package app

import (
	"context"
	"log"
	"time"

	"github.com/llmchatbot/backend/internal/config"
	"github.com/llmchatbot/backend/internal/database"
	"github.com/llmchatbot/backend/internal/model"
	"gorm.io/gorm"
)

// App represents the application structure
type App struct {
	Config        *config.Config
	DB            *gorm.DB
	cleanupCancel context.CancelFunc
}

// NewApp creates and initializes a new application instance
func NewApp() (*App, error) {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		return nil, err
	}

	// Connect to database
	if err := database.Connect(cfg); err != nil {
		return nil, err
	}

	// Run migrations
	if err := database.Migrate(&model.User{}, &model.ChatSession{}, &model.Message{}); err != nil {
		return nil, err
	}

	return &App{
		Config: cfg,
		DB:     database.GetDB(),
	}, nil
}

// Close gracefully closes application resources
func (a *App) Close() error {
	// Stop cleanup goroutine
	if a.cleanupCancel != nil {
		a.cleanupCancel()
	}
	return database.Close()
}

// StartGuestCleanup starts a background goroutine to clean up expired guest accounts
func (a *App) StartGuestCleanup(deps *Dependencies) {
	ctx, cancel := context.WithCancel(context.Background())
	a.cleanupCancel = cancel

	go func() {
		ticker := time.NewTicker(1 * time.Hour) // Run cleanup every hour
		defer ticker.Stop()

		// Run cleanup immediately on start
		if err := deps.AuthService.CleanupExpiredGuests(); err != nil {
			log.Printf("Error cleaning up expired guests: %v", err)
		}

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if err := deps.AuthService.CleanupExpiredGuests(); err != nil {
					log.Printf("Error cleaning up expired guests: %v", err)
				} else {
					log.Println("Successfully cleaned up expired guest accounts")
				}
			}
		}
	}()
}
