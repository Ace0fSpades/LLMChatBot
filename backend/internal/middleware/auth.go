package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/llmchatbot/backend/internal/database"
	"github.com/llmchatbot/backend/pkg/jwt"
)

const (
	// UserIDKey is the key for user ID in context
	UserIDKey = "user_id"
	// UserEmailKey is the key for user email in context
	UserEmailKey = "user_email"
)

// JWTAuthMiddleware validates JWT token and sets user context
func JWTAuthMiddleware(jwtMgr *jwt.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract token from header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString := jwt.ExtractTokenFromHeader(authHeader)
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		// Validate token
		claims, err := jwtMgr.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Check token type
		if claims.TokenType != "access" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token type"})
			c.Abort()
			return
		}

		// Set user context
		c.Set(UserIDKey, claims.UserID.String())
		c.Set(UserEmailKey, claims.Email)

		// Set RLS context for PostgreSQL
		if database.DB != nil {
			_ = database.SetUserContext(database.DB, claims.UserID.String())
		}

		c.Next()
	}
}

// OptionalAuthMiddleware validates JWT token if present but doesn't require it
func OptionalAuthMiddleware(jwtMgr *jwt.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		tokenString := jwt.ExtractTokenFromHeader(authHeader)
		if tokenString == "" {
			c.Next()
			return
		}

		claims, err := jwtMgr.ValidateToken(tokenString)
		if err == nil && claims.TokenType == "access" {
			c.Set(UserIDKey, claims.UserID.String())
			c.Set(UserEmailKey, claims.Email)
		}

		c.Next()
	}
}

// GetUserID extracts user ID from context
func GetUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get(UserIDKey)
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// GetUserEmail extracts user email from context
func GetUserEmail(c *gin.Context) (string, bool) {
	email, exists := c.Get(UserEmailKey)
	if !exists {
		return "", false
	}
	return email.(string), true
}
