import axios, { AxiosInstance, AxiosError } from 'axios';
import { getAccessToken, clearTokens } from '@/utils/tokenStorage';
import { store } from '@/stores';
import { selectIsGuest } from '@/stores/selectors/auth.selectors';

/**
 * API base URL
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Create axios instance with default configuration
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle errors
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        const state = store.getState();
        const isGuest = selectIsGuest(state);
        
        // Only redirect to login if not a guest session
        // Guest sessions don't have tokens, so 401 errors are expected
        if (!isGuest) {
          clearTokens();
          window.location.href = '/';
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();

