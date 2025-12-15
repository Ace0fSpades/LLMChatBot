package dto

import "time"

// MessageResponse represents message response
type MessageResponse struct {
	ID             string    `json:"id"`
	Role           string    `json:"role"`
	Content        string    `json:"content"`
	Tokens         int       `json:"tokens"`
	CreatedAt      time.Time `json:"created_at"`
	SequenceNumber int       `json:"sequence_number"`
}

// SendMessageRequest represents send message request
type SendMessageRequest struct {
	Content string `json:"content" binding:"required,min=1"`
}
