package service

import (
	"errors"

	"github.com/google/uuid"
	"github.com/llmchatbot/backend/internal/dto"
	"github.com/llmchatbot/backend/internal/repository"
)

// UserService handles user business logic
type UserService struct {
	userRepo *repository.UserRepository
}

// NewUserService creates a new user service
func NewUserService(userRepo *repository.UserRepository) *UserService {
	return &UserService{
		userRepo: userRepo,
	}
}

// GetProfile retrieves user profile by ID
func (s *UserService) GetProfile(userID uuid.UUID) (*dto.UserResponse, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}

	return &dto.UserResponse{
		ID:          user.ID.String(),
		Email:       user.Email,
		Username:    user.Username,
		CreatedAt:   user.CreatedAt,
		LastLoginAt: user.LastLoginAt,
		IsActive:    user.IsActive,
	}, nil
}

// UpdateProfile updates user profile
func (s *UserService) UpdateProfile(userID uuid.UUID, req *dto.UpdateUserRequest) (*dto.UserResponse, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}

	// Check if username is being changed and if it's already taken
	if req.Username != "" && req.Username != user.Username {
		usernameExists, err := s.userRepo.UsernameExists(req.Username)
		if err != nil {
			return nil, err
		}
		if usernameExists {
			return nil, errors.New("username already exists")
		}
		user.Username = req.Username
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	return &dto.UserResponse{
		ID:          user.ID.String(),
		Email:       user.Email,
		Username:    user.Username,
		CreatedAt:   user.CreatedAt,
		LastLoginAt: user.LastLoginAt,
		IsActive:    user.IsActive,
	}, nil
}
