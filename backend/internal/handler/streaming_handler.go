package handler

import (
	"io"
	"net/http"

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

	// Start streaming from LLM service
	tokenChan, errChan := h.streamingService.StreamGeneration(
		sessionID,
		message,
		history,
		session.ModelUsed,
	)

	var fullResponse string
	var totalTokens int

	// Create SSE stream
	c.Stream(func(w io.Writer) bool {
		select {
		case token, ok := <-tokenChan:
			if !ok {
				// Stream ended, save assistant message
				if fullResponse != "" {
					_, _ = h.messageService.CreateAssistantMessage(sessionID, fullResponse, totalTokens)
				}
				return false
			}

			if token.Type == "complete" {
				// Send completion event
				c.SSEvent("message", map[string]interface{}{
					"type":    "complete",
					"content": token.Content,
					"tokens":  token.Tokens,
				})
				return false
			}

			// Accumulate tokens
			fullResponse += token.Content
			totalTokens = token.Tokens

			// Send token to client
			c.SSEvent("message", map[string]interface{}{
				"type":    "token",
				"content": token.Content,
			})
			return true

		case err := <-errChan:
			// Send error event
			c.SSEvent("error", map[string]interface{}{
				"error": err.Error(),
			})
			return false
		}
	})
}

// Health handles health check endpoint
func (h *StreamingHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "chat-backend",
	})
}
