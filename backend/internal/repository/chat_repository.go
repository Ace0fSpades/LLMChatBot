package repository

import (
	"errors"

	"github.com/google/uuid"
	"github.com/llmchatbot/backend/internal/model"
	"gorm.io/gorm"
)

// ChatRepository handles chat session data operations
type ChatRepository struct {
	db *gorm.DB
}

// NewChatRepository creates a new chat repository
func NewChatRepository(db *gorm.DB) *ChatRepository {
	return &ChatRepository{db: db}
}

// Create creates a new chat session
func (r *ChatRepository) Create(session *model.ChatSession) error {
	return r.db.Create(session).Error
}

// GetByID retrieves a chat session by ID
func (r *ChatRepository) GetByID(id uuid.UUID) (*model.ChatSession, error) {
	var session model.ChatSession
	err := r.db.Where("id = ?", id).First(&session).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("chat session not found")
		}
		return nil, err
	}
	return &session, nil
}

// GetByIDAndUserID retrieves a chat session by ID and UserID (for security)
func (r *ChatRepository) GetByIDAndUserID(id, userID uuid.UUID) (*model.ChatSession, error) {
	var session model.ChatSession
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&session).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("chat session not found")
		}
		return nil, err
	}
	return &session, nil
}

// GetByUserID retrieves all chat sessions for a user
func (r *ChatRepository) GetByUserID(userID uuid.UUID, includeArchived bool) ([]model.ChatSession, error) {
	var sessions []model.ChatSession
	query := r.db.Where("user_id = ?", userID)

	if !includeArchived {
		query = query.Where("is_archived = ?", false)
	}

	err := query.Order("updated_at DESC").Find(&sessions).Error
	return sessions, err
}

// Update updates a chat session
func (r *ChatRepository) Update(session *model.ChatSession) error {
	return r.db.Save(session).Error
}

// Archive archives a chat session
func (r *ChatRepository) Archive(id, userID uuid.UUID) error {
	result := r.db.Model(&model.ChatSession{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("is_archived", true)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errors.New("chat session not found")
	}

	return nil
}

// Delete permanently deletes a chat session
func (r *ChatRepository) Delete(id, userID uuid.UUID) error {
	result := r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.ChatSession{})
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errors.New("chat session not found")
	}

	return nil
}

// GetWithMessages retrieves a chat session with all messages
func (r *ChatRepository) GetWithMessages(id, userID uuid.UUID) (*model.ChatSession, error) {
	var session model.ChatSession
	err := r.db.Preload("Messages", func(db *gorm.DB) *gorm.DB {
		return db.Order("sequence_number ASC")
	}).Where("id = ? AND user_id = ?", id, userID).First(&session).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("chat session not found")
		}
		return nil, err
	}

	return &session, nil
}
