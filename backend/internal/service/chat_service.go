package service

import (
	"github.com/google/uuid"
	"github.com/llmchatbot/backend/internal/dto"
	"github.com/llmchatbot/backend/internal/model"
	"github.com/llmchatbot/backend/internal/repository"
)

// ChatService handles chat session business logic
type ChatService struct {
	chatRepo    *repository.ChatRepository
	messageRepo *repository.MessageRepository
}

// NewChatService creates a new chat service
func NewChatService(chatRepo *repository.ChatRepository, messageRepo *repository.MessageRepository) *ChatService {
	return &ChatService{
		chatRepo:    chatRepo,
		messageRepo: messageRepo,
	}
}

// CreateChatSession creates a new chat session
func (s *ChatService) CreateChatSession(userID uuid.UUID, req *dto.CreateChatSessionRequest) (*dto.ChatSessionResponse, error) {
	title := req.Title
	if title == "" {
		title = "New Chat"
	}

	modelUsed := req.ModelUsed
	if modelUsed == "" {
		modelUsed = "qwen2.5-3b"
	}

	session := &model.ChatSession{
		UserID:     userID,
		Title:      title,
		ModelUsed:  modelUsed,
		IsArchived: false,
	}

	if err := s.chatRepo.Create(session); err != nil {
		return nil, err
	}

	return s.toChatSessionResponse(session), nil
}

// GetChatSessions retrieves all chat sessions for a user
func (s *ChatService) GetChatSessions(userID uuid.UUID, includeArchived bool) ([]dto.ChatSessionResponse, error) {
	sessions, err := s.chatRepo.GetByUserID(userID, includeArchived)
	if err != nil {
		return nil, err
	}

	responses := make([]dto.ChatSessionResponse, len(sessions))
	for i, session := range sessions {
		responses[i] = *s.toChatSessionResponse(&session)
	}

	return responses, nil
}

// GetChatSession retrieves a chat session by ID
func (s *ChatService) GetChatSession(sessionID, userID uuid.UUID) (*dto.ChatSessionResponse, error) {
	session, err := s.chatRepo.GetByIDAndUserID(sessionID, userID)
	if err != nil {
		return nil, err
	}

	return s.toChatSessionResponse(session), nil
}

// GetChatSessionWithMessages retrieves a chat session with all messages
func (s *ChatService) GetChatSessionWithMessages(sessionID, userID uuid.UUID) (*dto.ChatSessionWithMessagesResponse, error) {
	session, err := s.chatRepo.GetWithMessages(sessionID, userID)
	if err != nil {
		return nil, err
	}

	response := &dto.ChatSessionWithMessagesResponse{
		ChatSessionResponse: *s.toChatSessionResponse(session),
		Messages:            make([]dto.MessageResponse, len(session.Messages)),
	}

	for i, msg := range session.Messages {
		response.Messages[i] = dto.MessageResponse{
			ID:             msg.ID.String(),
			Role:           msg.Role,
			Content:        msg.Content,
			Tokens:         msg.Tokens,
			CreatedAt:      msg.CreatedAt,
			SequenceNumber: msg.SequenceNumber,
		}
	}

	return response, nil
}

// UpdateChatSession updates a chat session title
func (s *ChatService) UpdateChatSession(sessionID, userID uuid.UUID, req *dto.UpdateChatSessionRequest) (*dto.ChatSessionResponse, error) {
	session, err := s.chatRepo.GetByIDAndUserID(sessionID, userID)
	if err != nil {
		return nil, err
	}

	session.Title = req.Title

	if err := s.chatRepo.Update(session); err != nil {
		return nil, err
	}

	return s.toChatSessionResponse(session), nil
}

// ArchiveChatSession archives a chat session
func (s *ChatService) ArchiveChatSession(sessionID, userID uuid.UUID) error {
	return s.chatRepo.Archive(sessionID, userID)
}

// RestoreChatSession restores an archived chat session
func (s *ChatService) RestoreChatSession(sessionID, userID uuid.UUID) (*dto.ChatSessionResponse, error) {
	if err := s.chatRepo.Unarchive(sessionID, userID); err != nil {
		return nil, err
	}

	session, err := s.chatRepo.GetByIDAndUserID(sessionID, userID)
	if err != nil {
		return nil, err
	}

	return s.toChatSessionResponse(session), nil
}

// RestoreChatSessions restores multiple archived chat sessions
func (s *ChatService) RestoreChatSessions(sessionIDs []uuid.UUID, userID uuid.UUID) error {
	return s.chatRepo.UnarchiveMultiple(sessionIDs, userID)
}

// DeleteChatSession permanently deletes a chat session
func (s *ChatService) DeleteChatSession(sessionID, userID uuid.UUID) error {
	return s.chatRepo.Delete(sessionID, userID)
}

// DeleteChatSessions permanently deletes multiple chat sessions
func (s *ChatService) DeleteChatSessions(sessionIDs []uuid.UUID, userID uuid.UUID) error {
	return s.chatRepo.DeleteMultiple(sessionIDs, userID)
}

// toChatSessionResponse converts a ChatSession model to response DTO
func (s *ChatService) toChatSessionResponse(session *model.ChatSession) *dto.ChatSessionResponse {
	return &dto.ChatSessionResponse{
		ID:         session.ID.String(),
		Title:      session.Title,
		ModelUsed:  session.ModelUsed,
		CreatedAt:  session.CreatedAt,
		UpdatedAt:  session.UpdatedAt,
		IsArchived: session.IsArchived,
	}
}
