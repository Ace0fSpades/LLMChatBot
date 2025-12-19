import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import {
  setAuthLoading,
  setAuth,
  setGuestSession,
  clearAuth,
  setAuthError,
  selectIsAuthenticated,
  selectIsGuest,
  selectAccessToken,
  selectAuthLoading,
  selectAuthError,
} from '@/stores';
import { authApi } from '@/services/api/authApi';
import type { RegisterRequest, LoginRequest } from '@/types/auth.types';

/**
 * Hook for authentication operations
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isGuest = useAppSelector(selectIsGuest);
  const accessToken = useAppSelector(selectAccessToken);
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  /**
   * Register a new user
   */
  const register = useCallback(
    async (data: RegisterRequest) => {
      try {
        dispatch(setAuthLoading(true));
        dispatch(setAuthError(null));
        const response = await authApi.register(data);
        dispatch(setAuth(response));
        return { success: true };
      } catch (err: unknown) {
        const errorMessage =
          (err as { response?: { data?: { error?: string }; message?: string }; message?: string })?.response?.data?.error ||
          (err as { message?: string })?.message ||
          'Registration failed';
        dispatch(setAuthError(errorMessage));
        return { success: false, error: errorMessage };
      } finally {
        dispatch(setAuthLoading(false));
      }
    },
    [dispatch]
  );

  /**
   * Login user
   */
  const login = useCallback(
    async (data: LoginRequest) => {
      try {
        dispatch(setAuthLoading(true));
        dispatch(setAuthError(null));
        const response = await authApi.login(data);
        dispatch(setAuth(response));
        return { success: true };
      } catch (err: unknown) {
        const errorMessage =
          (err as { response?: { data?: { error?: string }; message?: string }; message?: string })?.response?.data?.error ||
          (err as { message?: string })?.message ||
          'Login failed';
        dispatch(setAuthError(errorMessage));
        return { success: false, error: errorMessage };
      } finally {
        dispatch(setAuthLoading(false));
      }
    },
    [dispatch]
  );

  /**
   * Start guest session (no authentication required)
   */
  const startGuestSession = useCallback(() => {
    dispatch(setGuestSession());
  }, [dispatch]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    // If guest session, just clear auth without API call
    if (isGuest) {
      dispatch(clearAuth());
      return;
    }

    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      dispatch(clearAuth());
    }
  }, [dispatch, isGuest]);

  return {
    isAuthenticated,
    isGuest,
    accessToken,
    loading,
    error,
    register,
    login,
    startGuestSession,
    logout,
  };
};

