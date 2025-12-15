package app

import (
	"github.com/llmchatbot/backend/internal/handler"
	"github.com/llmchatbot/backend/internal/repository"
	"github.com/llmchatbot/backend/internal/service"
)

// Dependencies holds all application dependencies
type Dependencies struct {
	// Repositories
	UserRepo    *repository.UserRepository
	ChatRepo    *repository.ChatRepository
	MessageRepo *repository.MessageRepository

	// Services
	AuthService      *service.AuthService
	UserService      *service.UserService
	ChatService      *service.ChatService
	MessageService   *service.MessageService
	StreamingService *service.StreamingService

	// Handlers
	AuthHandler      *handler.AuthHandler
	UserHandler      *handler.UserHandler
	ChatHandler      *handler.ChatHandler
	StreamingHandler *handler.StreamingHandler
}

// InitializeDependencies initializes all application dependencies
func InitializeDependencies(a *App) *Dependencies {
	// Initialize repositories
	userRepo := repository.NewUserRepository(a.DB)
	chatRepo := repository.NewChatRepository(a.DB)
	messageRepo := repository.NewMessageRepository(a.DB)

	// Initialize services
	authService := service.NewAuthService(userRepo, a.Config)
	userService := service.NewUserService(userRepo)
	chatService := service.NewChatService(chatRepo, messageRepo)
	messageService := service.NewMessageService(messageRepo, chatRepo)
	streamingService := service.NewStreamingService(a.Config, messageService)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)
	chatHandler := handler.NewChatHandler(chatService)
	streamingHandler := handler.NewStreamingHandler(streamingService, messageService, chatService)

	return &Dependencies{
		UserRepo:    userRepo,
		ChatRepo:    chatRepo,
		MessageRepo: messageRepo,

		AuthService:      authService,
		UserService:      userService,
		ChatService:      chatService,
		MessageService:   messageService,
		StreamingService: streamingService,

		AuthHandler:      authHandler,
		UserHandler:      userHandler,
		ChatHandler:      chatHandler,
		StreamingHandler: streamingHandler,
	}
}
