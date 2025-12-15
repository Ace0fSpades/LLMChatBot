package app

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/llmchatbot/backend/internal/middleware"
)

// SetupRouter configures all routes and middleware
func SetupRouter(a *App, deps *Dependencies) *gin.Engine {
	// Set Gin mode
	if a.Config.Server.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Global middleware
	router.Use(middleware.LoggingMiddleware())
	router.Use(middleware.SecurityMiddleware())
	router.Use(middleware.CORSMiddleware())
	router.Use(gin.Recovery())

	// Rate limiting (100 requests per minute per IP)
	router.Use(middleware.RateLimitMiddleware(100, time.Minute))

	// Health check endpoint (no auth required)
	router.GET("/health", deps.StreamingHandler.Health)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Auth routes (no auth required)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", deps.AuthHandler.Register)
			auth.POST("/login", deps.AuthHandler.Login)
			auth.POST("/refresh", deps.AuthHandler.RefreshToken)
			auth.POST("/logout", deps.AuthHandler.Logout)
		}

		// Protected routes (require authentication)
		protected := v1.Group("")
		protected.Use(middleware.JWTAuthMiddleware(deps.AuthService.GetJWTManager()))
		{
			// User routes
			users := protected.Group("/users")
			{
				users.GET("/me", deps.UserHandler.GetProfile)
				users.PUT("/me", deps.UserHandler.UpdateProfile)
			}

			// Chat routes
			chats := protected.Group("/chats")
			{
				chats.GET("", deps.ChatHandler.GetChatSessions)
				chats.POST("", deps.ChatHandler.CreateChatSession)
				chats.GET("/:id", deps.ChatHandler.GetChatSession)
				chats.PUT("/:id", deps.ChatHandler.UpdateChatSession)
				chats.DELETE("/:id", deps.ChatHandler.ArchiveChatSession)
			}

			// Streaming routes
			stream := protected.Group("/stream")
			{
				stream.GET("/chat/:session_id", deps.StreamingHandler.StreamChat)
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
			c.JSON(501, gin.H{"message": "Not implemented yet"})
		})
	}

	return router
}
