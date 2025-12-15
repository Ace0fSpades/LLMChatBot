package service

import (
	"errors"

	"github.com/google/uuid"
	"github.com/llmchatbot/backend/internal/dto"
	"github.com/llmchatbot/backend/internal/model"
	"github.com/llmchatbot/backend/internal/repository"
)

// MessageService handles message business logic
type MessageService struct {
	messageRepo *repository.MessageRepository
	chatRepo    *repository.ChatRepository
}

// NewMessageService creates a new message service
func NewMessageService(messageRepo *repository.MessageRepository, chatRepo *repository.ChatRepository) *MessageService {
	return &MessageService{
		messageRepo: messageRepo,
		chatRepo:    chatRepo,
	}
}

// CreateUserMessage creates a user message in a chat session
func (s *MessageService) CreateUserMessage(sessionID, userID uuid.UUID, content string) (*dto.MessageResponse, error) {
	// Verify chat session exists and belongs to user
	session, err := s.chatRepo.GetByIDAndUserID(sessionID, userID)
	if err != nil {
		return nil, errors.New("chat session not found")
	}

	// Get next sequence number
	seqNum, err := s.messageRepo.GetNextSequenceNumber(sessionID)
	if err != nil {
		return nil, err
	}

	// Create message
	message := &model.Message{
		ChatSessionID:  sessionID,
		Role:           model.MessageRoleUser,
		Content:        content,
		SequenceNumber: seqNum,
		Tokens:         0, // Will be calculated if needed
	}

	if err := s.messageRepo.Create(message); err != nil {
		return nil, err
	}

	// Update session updated_at timestamp
	if err := s.chatRepo.Update(session); err != nil {
		// Log error but don't fail message creation
	}

	return &dto.MessageResponse{
		ID:             message.ID.String(),
		Role:           message.Role,
		Content:        message.Content,
		Tokens:         message.Tokens,
		CreatedAt:      message.CreatedAt,
		SequenceNumber: message.SequenceNumber,
	}, nil
}

// CreateAssistantMessage creates an assistant message in a chat session
func (s *MessageService) CreateAssistantMessage(sessionID uuid.UUID, content string, tokens int) (*dto.MessageResponse, error) {
	// Get next sequence number
	seqNum, err := s.messageRepo.GetNextSequenceNumber(sessionID)
	if err != nil {
		return nil, err
	}

	// Create message
	message := &model.Message{
		ChatSessionID:  sessionID,
		Role:           model.MessageRoleAssistant,
		Content:        content,
		Tokens:         tokens,
		SequenceNumber: seqNum,
	}

	if err := s.messageRepo.Create(message); err != nil {
		return nil, err
	}

	// Update session updated_at timestamp
	session, err := s.chatRepo.GetByID(sessionID)
	if err == nil {
		_ = s.chatRepo.Update(session)
	}

	return &dto.MessageResponse{
		ID:             message.ID.String(),
		Role:           message.Role,
		Content:        message.Content,
		Tokens:         message.Tokens,
		CreatedAt:      message.CreatedAt,
		SequenceNumber: message.SequenceNumber,
	}, nil
}

// GetChatHistory retrieves chat history for context (last N messages)
func (s *MessageService) GetChatHistory(sessionID uuid.UUID, limit int) ([]*dto.MessageResponse, error) {
	messages, err := s.messageRepo.GetLastN(sessionID, limit)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.MessageResponse, len(messages))
	for i, msg := range messages {
		responses[i] = &dto.MessageResponse{
			ID:             msg.ID.String(),
			Role:           msg.Role,
			Content:        msg.Content,
			Tokens:         msg.Tokens,
			CreatedAt:      msg.CreatedAt,
			SequenceNumber: msg.SequenceNumber,
		}
	}

	return responses, nil
}
