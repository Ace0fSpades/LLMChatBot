package service

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/llmchatbot/backend/internal/config"
	"github.com/llmchatbot/backend/internal/dto"
)

// StreamingService handles streaming communication with LLM service
type StreamingService struct {
	llmClient *http.Client
	llmURL    string
	msgSvc    *MessageService
}

// NewStreamingService creates a new streaming service
// Note: This service is used ONLY for streaming requests to the LLM service.
// The HTTP client has no timeout (Timeout: 0) because streaming can take a long time
// and is limited by max_tokens anyway. Regular non-streaming HTTP requests
// to other services should use a client with appropriate timeout settings.
func NewStreamingService(cfg *config.Config, msgSvc *MessageService) *StreamingService {
	return &StreamingService{
		// Use client without timeout for streaming requests
		// Streaming can take a long time, so we don't want to interrupt it
		llmClient: &http.Client{
			Timeout: 0, // No timeout for streaming requests (generation limited by max_tokens)
		},
		llmURL: cfg.LLM.BaseURL,
		msgSvc: msgSvc,
	}
}

// GenerationRequest represents request to LLM service
type GenerationRequest struct {
	Prompt  string                 `json:"prompt"`
	History []*dto.MessageResponse `json:"history,omitempty"`
	Model   string                 `json:"model,omitempty"`
}

// TokenResponse represents a token response from LLM service
type TokenResponse struct {
	Type    string `json:"type"`    // "token" or "complete"
	Content string `json:"content"` // token content or full response
	Tokens  int    `json:"tokens,omitempty"`
}

// StreamGeneration streams tokens from LLM service
func (s *StreamingService) StreamGeneration(sessionID uuid.UUID, message string, history []*dto.MessageResponse, model string) (<-chan TokenResponse, <-chan error) {
	tokenChan := make(chan TokenResponse, 100)
	errChan := make(chan error, 1)

	go func() {
		defer close(tokenChan)
		defer close(errChan)

		// Prepare request
		reqBody := GenerationRequest{
			Prompt:  message,
			History: history,
			Model:   model,
		}

		jsonData, err := json.Marshal(reqBody)
		if err != nil {
			errChan <- fmt.Errorf("failed to marshal request: %w", err)
			return
		}

		// Create HTTP request
		req, err := http.NewRequest("POST", fmt.Sprintf("%s/api/v1/generate/stream", s.llmURL), bytes.NewBuffer(jsonData))
		if err != nil {
			errChan <- fmt.Errorf("failed to create request: %w", err)
			return
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/x-ndjson")

		// Execute request
		resp, err := s.llmClient.Do(req)
		if err != nil {
			errChan <- fmt.Errorf("failed to execute request: %w", err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			errChan <- fmt.Errorf("LLM service returned status %d", resp.StatusCode)
			return
		}

		// Read NDJSON (newline-delimited JSON) streaming response
		// ML Service → Backend: NDJSON format (each line is a JSON object)
		scanner := bufio.NewScanner(resp.Body)
		var fullResponse strings.Builder
		totalTokens := 0

		hasReceivedComplete := false
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())

			// Skip empty lines
			if line == "" {
				continue
			}

			// Parse JSON line (NDJSON format: each line is a complete JSON object)
			var tokenResp TokenResponse
			if err := json.Unmarshal([]byte(line), &tokenResp); err != nil {
				errChan <- fmt.Errorf("failed to decode NDJSON response: %w", err)
				return
			}

			if tokenResp.Type == "complete" {
				hasReceivedComplete = true
				// Send completion signal with full response
				tokenChan <- TokenResponse{
					Type:    "complete",
					Content: tokenResp.Content, // Use content from complete event
					Tokens:  tokenResp.Tokens,
				}
				break
			}

			if tokenResp.Type == "error" {
				errChan <- fmt.Errorf("LLM service error: %s", tokenResp.Content)
				return
			}

			// Accumulate tokens
			fullResponse.WriteString(tokenResp.Content)
			totalTokens = tokenResp.Tokens
			tokenChan <- tokenResp
		}

		// Check for scanner errors
		if err := scanner.Err(); err != nil {
			if err != io.EOF {
				errChan <- fmt.Errorf("failed to read NDJSON stream: %w", err)
				return
			}
		}

		// If we reached here without a "complete" event, send one with accumulated response
		// This handles cases where Python service didn't send complete event
		if !hasReceivedComplete && fullResponse.Len() > 0 {
			tokenChan <- TokenResponse{
				Type:    "complete",
				Content: fullResponse.String(),
				Tokens:  totalTokens,
			}
		}
	}()

	return tokenChan, errChan
}
