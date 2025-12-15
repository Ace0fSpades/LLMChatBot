package repository

import (
	"errors"

	"github.com/google/uuid"
	"github.com/llmchatbot/backend/internal/model"
	"gorm.io/gorm"
)

// MessageRepository handles message data operations
type MessageRepository struct {
	db *gorm.DB
}

// NewMessageRepository creates a new message repository
func NewMessageRepository(db *gorm.DB) *MessageRepository {
	return &MessageRepository{db: db}
}

// Create creates a new message
func (r *MessageRepository) Create(message *model.Message) error {
	return r.db.Create(message).Error
}

// GetByID retrieves a message by ID
func (r *MessageRepository) GetByID(id uuid.UUID) (*model.Message, error) {
	var message model.Message
	err := r.db.Where("id = ?", id).First(&message).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("message not found")
		}
		return nil, err
	}
	return &message, nil
}

// GetByChatSessionID retrieves all messages for a chat session
func (r *MessageRepository) GetByChatSessionID(chatSessionID uuid.UUID) ([]model.Message, error) {
	var messages []model.Message
	err := r.db.Where("chat_session_id = ?", chatSessionID).
		Order("sequence_number ASC").
		Find(&messages).Error
	return messages, err
}

// GetLastN retrieves last N messages for a chat session
func (r *MessageRepository) GetLastN(chatSessionID uuid.UUID, n int) ([]model.Message, error) {
	var messages []model.Message
	err := r.db.Where("chat_session_id = ?", chatSessionID).
		Order("sequence_number DESC").
		Limit(n).
		Find(&messages).Error

	// Reverse to get chronological order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, err
}

// GetNextSequenceNumber gets the next sequence number for a chat session
func (r *MessageRepository) GetNextSequenceNumber(chatSessionID uuid.UUID) (int, error) {
	var maxSeq int
	err := r.db.Model(&model.Message{}).
		Where("chat_session_id = ?", chatSessionID).
		Select("COALESCE(MAX(sequence_number), 0)").
		Scan(&maxSeq).Error

	return maxSeq + 1, err
}

// Update updates a message
func (r *MessageRepository) Update(message *model.Message) error {
	return r.db.Save(message).Error
}

// Delete deletes a message
func (r *MessageRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Message{}, id).Error
}

// CountByChatSessionID counts messages in a chat session
func (r *MessageRepository) CountByChatSessionID(chatSessionID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&model.Message{}).
		Where("chat_session_id = ?", chatSessionID).
		Count(&count).Error
	return count, err
}
