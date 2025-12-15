package app

import (
	"github.com/llmchatbot/backend/internal/config"
	"github.com/llmchatbot/backend/internal/database"
	"github.com/llmchatbot/backend/internal/model"
	"gorm.io/gorm"
)

// App represents the application structure
type App struct {
	Config *config.Config
	DB     *gorm.DB
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
	return database.Close()
}
