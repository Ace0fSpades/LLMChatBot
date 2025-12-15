package dto

import "time"

// UserResponse represents user response
type UserResponse struct {
	ID          string     `json:"id"`
	Email       string     `json:"email"`
	Username    string     `json:"username"`
	CreatedAt   time.Time  `json:"created_at"`
	LastLoginAt *time.Time `json:"last_login_at,omitempty"`
	IsActive    bool       `json:"is_active"`
}

// UpdateUserRequest represents update user request
type UpdateUserRequest struct {
	Username string `json:"username" binding:"omitempty,min=3,max=100"`
}
