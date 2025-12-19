package handler

import (
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/llmchatbot/backend/internal/dto"
	"github.com/llmchatbot/backend/internal/middleware"
	"github.com/llmchatbot/backend/internal/service"
)

// StreamingHandler handles streaming endpoints
type StreamingHandler struct {
	streamingService *service.StreamingService
	messageService   *service.MessageService
	chatService      *service.ChatService
}

// NewStreamingHandler creates a new streaming handler
func NewStreamingHandler(
	streamingService *service.StreamingService,
	messageService *service.MessageService,
	chatService *service.ChatService,
) *StreamingHandler {
	return &StreamingHandler{
		streamingService: streamingService,
		messageService:   messageService,
		chatService:      chatService,
	}
}

// StreamChat handles SSE streaming for chat responses
func (h *StreamingHandler) StreamChat(c *gin.Context) {
	userIDStr, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	sessionIDStr := c.Param("session_id")
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	// Get message from query parameter
	message := c.Query("message")
	if message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message parameter is required"})
		return
	}

	// Verify chat session belongs to user
	session, err := h.chatService.GetChatSession(sessionID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat session not found"})
		return
	}

	// Save user message
	_, err = h.messageService.CreateUserMessage(sessionID, userID, message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save message"})
		return
	}

	// Get chat history for context (last 10 messages)
	history, err := h.messageService.GetChatHistory(sessionID, 10)
	if err != nil {
		history = []*dto.MessageResponse{} // Use empty history if error
	}

	// Set up SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no") // Disable nginx buffering

	// Disable write timeout for SSE streams using http.ResponseController
	// This overrides the server-level WriteTimeout (15s default) for this specific connection.
	// Since we have max_tokens limit, generation will complete anyway.
	// Regular HTTP requests still use the server-level WriteTimeout for protection.
	rc := http.NewResponseController(c.Writer)
	if err := rc.SetWriteDeadline(time.Time{}); err != nil {
		// If SetWriteDeadline is not supported, log but continue
		fmt.Printf("Warning: Could not disable write timeout: %v\n", err)
	}

	// Flush headers immediately
	if flusher, ok := c.Writer.(http.Flusher); ok {
		flusher.Flush()
	}

	// Start streaming from LLM service
	tokenChan, errChan := h.streamingService.StreamGeneration(
		sessionID,
		message,
		history,
		session.ModelUsed,
	)

	var fullResponse string
	var totalTokens int
	var messageSaved bool
	var hasReceivedTokens bool
	var streamEnded bool

	// Create SSE stream
	c.Stream(func(w io.Writer) bool {
		// If stream already ended, don't process more events
		if streamEnded {
			return false
		}

		select {
		case token, ok := <-tokenChan:
			if !ok {
				// Stream ended unexpectedly (channel closed without complete event)
				streamEnded = true
				// Save as incomplete message
				if !messageSaved && hasReceivedTokens && fullResponse != "" {
					_, err := h.messageService.CreateAssistantMessage(sessionID, fullResponse, totalTokens, true)
					if err != nil {
						// Log error but don't fail the stream
						fmt.Printf("Failed to save incomplete message: %v\n", err)
					} else {
						messageSaved = true
					}
				}
				return false
			}

			if token.Type == "complete" {
				streamEnded = true
				// Use content from complete event (it contains full response)
				finalContent := token.Content
				if finalContent == "" {
					// Fallback to accumulated response
					finalContent = fullResponse
				}
				finalTokens := token.Tokens
				if finalTokens == 0 {
					finalTokens = totalTokens
				}

				// Save assistant message before sending completion event (complete message)
				if !messageSaved && finalContent != "" {
					_, err := h.messageService.CreateAssistantMessage(sessionID, finalContent, finalTokens, false)
					if err != nil {
						// Log error but continue
						fmt.Printf("Failed to save complete message: %v\n", err)
					} else {
						messageSaved = true
					}
				}

				// Send completion event
				c.SSEvent("message", map[string]interface{}{
					"type":    "complete",
					"content": finalContent,
					"tokens":  finalTokens,
				})
				return false
			}

			// Accumulate tokens
			fullResponse += token.Content
			totalTokens = token.Tokens
			hasReceivedTokens = true

			// Send token to client
			c.SSEvent("message", map[string]interface{}{
				"type":    "token",
				"content": token.Content,
			})
			return true

		case err := <-errChan:
			streamEnded = true
			// Save partial response if any tokens were received (mark as incomplete)
			if !messageSaved && hasReceivedTokens && fullResponse != "" {
				_, saveErr := h.messageService.CreateAssistantMessage(sessionID, fullResponse, totalTokens, true)
				if saveErr != nil {
					fmt.Printf("Failed to save incomplete message on error: %v\n", saveErr)
				} else {
					messageSaved = true
				}
			}
			// Send error event
			c.SSEvent("error", map[string]interface{}{
				"error": err.Error(),
			})
			return false
		}
	})

	// After stream ends, ensure message is saved if we received tokens but didn't save
	// This handles cases where connection was abruptly closed (only if stream didn't end normally)
	if !streamEnded && !messageSaved && hasReceivedTokens && fullResponse != "" {
		_, err := h.messageService.CreateAssistantMessage(sessionID, fullResponse, totalTokens, true)
		if err != nil {
			fmt.Printf("Failed to save incomplete message after stream end: %v\n", err)
		}
	}
}

// Health handles health check endpoint
func (h *StreamingHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "chat-backend",
	})
}
