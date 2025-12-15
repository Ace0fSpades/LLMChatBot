package service

import (
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
func NewStreamingService(cfg *config.Config, msgSvc *MessageService) *StreamingService {
	return &StreamingService{
		llmClient: &http.Client{
			Timeout: cfg.LLM.Timeout,
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
		req.Header.Set("Accept", "text/event-stream")

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

		// Read streaming response
		decoder := json.NewDecoder(resp.Body)
		var fullResponse strings.Builder
		totalTokens := 0

		for {
			var tokenResp TokenResponse
			if err := decoder.Decode(&tokenResp); err != nil {
				if err == io.EOF {
					break
				}
				errChan <- fmt.Errorf("failed to decode response: %w", err)
				return
			}

			if tokenResp.Type == "complete" {
				// Send completion signal
				tokenChan <- TokenResponse{
					Type:    "complete",
					Content: fullResponse.String(),
					Tokens:  totalTokens,
				}
				break
			}

			// Accumulate tokens
			fullResponse.WriteString(tokenResp.Content)
			totalTokens = tokenResp.Tokens
			tokenChan <- tokenResp
		}
	}()

	return tokenChan, errChan
}
