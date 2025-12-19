package dto

import "time"

// ChatSessionResponse represents chat session response
type ChatSessionResponse struct {
	ID           string    `json:"id"`
	Title        string    `json:"title"`
	ModelUsed    string    `json:"model_used"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	IsArchived   bool      `json:"is_archived"`
	MessageCount int       `json:"message_count,omitempty"`
}

// CreateChatSessionRequest represents create chat session request
type CreateChatSessionRequest struct {
	Title     string `json:"title" binding:"omitempty,max=255"`
	ModelUsed string `json:"model_used" binding:"omitempty"`
}

// UpdateChatSessionRequest represents update chat session request
type UpdateChatSessionRequest struct {
	Title string `json:"title" binding:"required,max=255"`
}

// ChatSessionWithMessagesResponse represents chat session with messages
type ChatSessionWithMessagesResponse struct {
	ChatSessionResponse
	Messages []MessageResponse `json:"messages"`
}

// BulkOperationRequest represents bulk operation request
type BulkOperationRequest struct {
	IDs []string `json:"ids" binding:"required,min=1"`
}