package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/llmchatbot/backend/internal/config"
	"github.com/llmchatbot/backend/internal/database"
	"github.com/llmchatbot/backend/internal/handler"
	"github.com/llmchatbot/backend/internal/middleware"
	"github.com/llmchatbot/backend/internal/model"
	"github.com/llmchatbot/backend/internal/repository"
	"github.com/llmchatbot/backend/internal/service"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Set Gin mode
	if cfg.Server.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Connect to database
	if err := database.Connect(cfg); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Run migrations
	if err := database.Migrate(&model.User{}, &model.ChatSession{}, &model.Message{}); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(database.DB)
	chatRepo := repository.NewChatRepository(database.DB)
	messageRepo := repository.NewMessageRepository(database.DB)

	// Initialize services
	authService := service.NewAuthService(userRepo, cfg)
	userService := service.NewUserService(userRepo)
	chatService := service.NewChatService(chatRepo, messageRepo)
	messageService := service.NewMessageService(messageRepo, chatRepo)
	streamingService := service.NewStreamingService(cfg, messageService)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)
	chatHandler := handler.NewChatHandler(chatService)
	streamingHandler := handler.NewStreamingHandler(streamingService, messageService, chatService)

	// Setup router
	router := setupRouter(cfg, authService, authHandler, userHandler, chatHandler, streamingHandler)

	// Create HTTP server
	srv := &http.Server{
		Addr:         fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
	}

	// Start server in goroutine
	go func() {
		log.Printf("Server starting on %s:%s", cfg.Server.Host, cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

// setupRouter configures all routes and middleware
func setupRouter(
	cfg *config.Config,
	authService *service.AuthService,
	authHandler *handler.AuthHandler,
	userHandler *handler.UserHandler,
	chatHandler *handler.ChatHandler,
	streamingHandler *handler.StreamingHandler,
) *gin.Engine {
	router := gin.New()

	// Global middleware
	router.Use(middleware.LoggingMiddleware())
	router.Use(middleware.SecurityMiddleware())
	router.Use(middleware.CORSMiddleware())
	router.Use(gin.Recovery())

	// Rate limiting (100 requests per minute per IP)
	router.Use(middleware.RateLimitMiddleware(100, time.Minute))

	// Health check endpoint (no auth required)
	router.GET("/health", streamingHandler.Health)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Auth routes (no auth required)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/logout", authHandler.Logout)
		}

		// Protected routes (require authentication)
		protected := v1.Group("")
		protected.Use(middleware.JWTAuthMiddleware(authService.GetJWTManager()))
		{
			// User routes
			users := protected.Group("/users")
			{
				users.GET("/me", userHandler.GetProfile)
				users.PUT("/me", userHandler.UpdateProfile)
			}

			// Chat routes
			chats := protected.Group("/chats")
			{
				chats.GET("", chatHandler.GetChatSessions)
				chats.POST("", chatHandler.CreateChatSession)
				chats.GET("/:id", chatHandler.GetChatSession)
				chats.PUT("/:id", chatHandler.UpdateChatSession)
				chats.DELETE("/:id", chatHandler.ArchiveChatSession)
			}

			// Streaming routes
			stream := protected.Group("/stream")
			{
				stream.GET("/chat/:session_id", streamingHandler.StreamChat)
			}
		}
	}

	// Internal routes (for Python service)
	internal := router.Group("/api/internal")
	{
		// Note: In production, these should be protected with API key or internal network
		internal.POST("/llm/stream", func(c *gin.Context) {
			// This endpoint would receive tokens from Python service
			// Implementation depends on Python service architecture
			c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"})
		})
	}

	return router
}
