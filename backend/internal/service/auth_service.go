package service

import (
	"errors"
	"time"

	"github.com/llmchatbot/backend/internal/config"
	"github.com/llmchatbot/backend/internal/dto"
	"github.com/llmchatbot/backend/internal/model"
	"github.com/llmchatbot/backend/internal/repository"
	"github.com/llmchatbot/backend/pkg/jwt"
	"github.com/llmchatbot/backend/pkg/utils"
)

// AuthService handles authentication business logic
type AuthService struct {
	userRepo *repository.UserRepository
	jwtMgr   *jwt.Manager
	cfg      *config.Config
}

// NewAuthService creates a new auth service
func NewAuthService(userRepo *repository.UserRepository, cfg *config.Config) *AuthService {
	jwtMgr := jwt.NewManager(
		cfg.JWT.SecretKey,
		cfg.JWT.AccessTokenExpiry,
		cfg.JWT.RefreshTokenExpiry,
	)

	return &AuthService{
		userRepo: userRepo,
		jwtMgr:   jwtMgr,
		cfg:      cfg,
	}
}

// Register registers a new user
func (s *AuthService) Register(req *dto.RegisterRequest) (*dto.AuthResponse, error) {
	// Check if email already exists
	emailExists, err := s.userRepo.EmailExists(req.Email)
	if err != nil {
		return nil, err
	}
	if emailExists {
		return nil, errors.New("email already exists")
	}

	// Check if username already exists
	usernameExists, err := s.userRepo.UsernameExists(req.Username)
	if err != nil {
		return nil, err
	}
	if usernameExists {
		return nil, errors.New("username already exists")
	}

	// Hash password
	passwordHash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &model.User{
		Email:        req.Email,
		Username:     req.Username,
		PasswordHash: passwordHash,
		IsActive:     true,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	// Generate tokens
	accessToken, err := s.jwtMgr.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.jwtMgr.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int(s.cfg.JWT.AccessTokenExpiry.Seconds()),
	}, nil
}

// Login authenticates a user and returns tokens
func (s *AuthService) Login(req *dto.LoginRequest) (*dto.AuthResponse, error) {
	// Get user by email
	user, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Check if user is active
	if !user.IsActive {
		return nil, errors.New("account is deactivated")
	}

	// Verify password
	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		return nil, errors.New("invalid credentials")
	}

	// Update last login
	now := time.Now()
	user.LastLoginAt = &now
	if err := s.userRepo.Update(user); err != nil {
		// Log error but don't fail login
		_ = s.userRepo.UpdateLastLogin(user.ID)
	}

	// Generate tokens
	accessToken, err := s.jwtMgr.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.jwtMgr.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int(s.cfg.JWT.AccessTokenExpiry.Seconds()),
	}, nil
}

// RefreshToken refreshes an access token using a refresh token
func (s *AuthService) RefreshToken(refreshToken string) (*dto.AuthResponse, error) {
	// Validate refresh token
	claims, err := s.jwtMgr.ValidateToken(refreshToken)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	// Check token type
	if claims.TokenType != "refresh" {
		return nil, errors.New("invalid token type")
	}

	// Get user to verify they still exist and are active
	user, err := s.userRepo.GetByID(claims.UserID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if !user.IsActive {
		return nil, errors.New("account is deactivated")
	}

	// Generate new tokens
	accessToken, err := s.jwtMgr.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	newRefreshToken, err := s.jwtMgr.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int(s.cfg.JWT.AccessTokenExpiry.Seconds()),
	}, nil
}

// ValidateToken validates a JWT token and returns claims
func (s *AuthService) ValidateToken(tokenString string) (*jwt.Claims, error) {
	claims, err := s.jwtMgr.ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}

	// Check token type
	if claims.TokenType != "access" {
		return nil, errors.New("invalid token type")
	}

	return claims, nil
}

// GetJWTManager returns the JWT manager (for middleware)
func (s *AuthService) GetJWTManager() *jwt.Manager {
	return s.jwtMgr
}
