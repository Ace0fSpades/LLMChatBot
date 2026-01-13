import { apiClient } from './client';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  RefreshTokenRequest,
} from '@/types/auth.types';

/**
 * Authentication API service
 */
export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      '/api/v1/auth/register',
      data
    );
    return response.data;
  },

  /**
   * Login user
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      '/api/v1/auth/login',
      data
    );
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (
    data: RefreshTokenRequest
  ): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      '/api/v1/auth/refresh',
      data
    );
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/api/v1/auth/logout');
  },

  /**
   * Create guest session
   */
  createGuestSession: async (): Promise<AuthResponse & { guest_id: string }> => {
    const response = await apiClient.post<AuthResponse & { guest_id: string }>(
      '/api/v1/auth/guest'
    );
    return response.data;
  },
};

