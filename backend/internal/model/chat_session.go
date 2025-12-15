package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ChatSession represents a chat session
type ChatSession struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID     uuid.UUID `gorm:"type:uuid;index;not null"`
	Title      string    `gorm:"default:'New Chat';size:255"`
	ModelUsed  string    `gorm:"default:'phi-3-mini';size:100"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	IsArchived bool `gorm:"default:false"`

	// Relationships
	User     User      `gorm:"foreignKey:UserID"`
	Messages []Message `gorm:"foreignKey:ChatSessionID;constraint:OnDelete:CASCADE"`
}

// BeforeCreate hook to generate UUID if not set
func (c *ChatSession) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// TableName specifies the table name for ChatSession
func (ChatSession) TableName() string {
	return "chat_sessions"
}
