package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Message represents a message in a chat session
type Message struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ChatSessionID  uuid.UUID `gorm:"type:uuid;index;not null"`
	Role           string    `gorm:"not null;size:50;check:role IN ('user', 'assistant', 'system')"`
	Content        string    `gorm:"type:text;not null"`
	Tokens         int       `gorm:"default:0"`
	IsIncomplete   bool      `gorm:"default:false"` // Flag for incomplete/truncated messages
	CreatedAt      time.Time
	SequenceNumber int `gorm:"not null"` // Order number in chat

	// Relationships
	ChatSession ChatSession `gorm:"foreignKey:ChatSessionID"`
}

// BeforeCreate hook to generate UUID if not set
func (m *Message) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

// TableName specifies the table name for Message
func (Message) TableName() string {
	return "messages"
}
