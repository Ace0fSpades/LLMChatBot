package database

import (
	"database/sql"
	"fmt"
	"log"
	"strings"

	"github.com/llmchatbot/backend/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB is the global database instance
var DB *gorm.DB

// GetDB returns the global database instance
func GetDB() *gorm.DB {
	return DB
}

// Connect initializes database connection
func Connect(cfg *config.Config) error {
	var err error

	// Configure GORM logger based on environment
	var gormLogger logger.Interface
	if cfg.Server.Environment == "development" {
		gormLogger = logger.Default.LogMode(logger.Info)
	} else {
		gormLogger = logger.Default.LogMode(logger.Error)
	}

	// Try to connect to the database
	DB, err = gorm.Open(postgres.Open(cfg.Database.GetDSN()), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		// If database doesn't exist, try to create it
		if strings.Contains(err.Error(), "does not exist") || strings.Contains(err.Error(), "database") {
			log.Println("Database does not exist, attempting to create it...")
			if err := createDatabaseIfNotExists(cfg); err != nil {
				return fmt.Errorf("failed to create database: %w", err)
			}
			// Retry connection after creating database
			DB, err = gorm.Open(postgres.Open(cfg.Database.GetDSN()), &gorm.Config{
				Logger: gormLogger,
			})
			if err != nil {
				return fmt.Errorf("failed to connect to database after creation: %w", err)
			}
		} else {
			return fmt.Errorf("failed to connect to database: %w", err)
		}
	}

	// Get underlying sql.DB to configure connection pool
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %w", err)
	}

	// Set connection pool settings
	sqlDB.SetMaxOpenConns(cfg.Database.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.Database.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(cfg.Database.ConnMaxLifetime)

	// Test connection
	if err := sqlDB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Database connection established successfully")
	return nil
}

// createDatabaseIfNotExists creates the database if it doesn't exist
func createDatabaseIfNotExists(cfg *config.Config) error {
	// Connect to postgres database (default database) to create our database
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=postgres sslmode=%s",
		cfg.Database.Host, cfg.Database.Port, cfg.Database.User, cfg.Database.Password, cfg.Database.SSLMode)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return fmt.Errorf("failed to connect to postgres database: %w", err)
	}
	defer db.Close()

	// Check if database exists
	var exists bool
	err = db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1)",
		cfg.Database.DBName,
	).Scan(&exists)

	if err != nil {
		return fmt.Errorf("failed to check database existence: %w", err)
	}

	if !exists {
		// Create database
		// Note: CREATE DATABASE cannot be executed in a transaction
		_, err = db.Exec(fmt.Sprintf("CREATE DATABASE %s", cfg.Database.DBName))
		if err != nil {
			return fmt.Errorf("failed to create database: %w", err)
		}
		log.Printf("Database '%s' created successfully", cfg.Database.DBName)
	} else {
		log.Printf("Database '%s' already exists", cfg.Database.DBName)
	}

	return nil
}

// Close closes database connection
func Close() error {
	if DB == nil {
		return nil
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}

	return sqlDB.Close()
}

// Migrate runs database migrations
func Migrate(models ...interface{}) error {
	if DB == nil {
		return fmt.Errorf("database connection not initialized")
	}

	if err := DB.AutoMigrate(models...); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("Database migrations completed successfully")
	return nil
}

// SetUserContext sets the current user ID for RLS (Row Level Security)
func SetUserContext(db *gorm.DB, userID string) error {
	return db.Exec("SET app.current_user_id = ?", userID).Error
}
