import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthResponse } from '@/types/auth.types';
import {
  saveAccessToken,
  saveRefreshToken,
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from '@/utils/tokenStorage';
import type { AuthState } from '../types/auth.types';

/**
 * Initial auth state
 */
const initialState: AuthState = {
  isAuthenticated: getAccessToken() !== null,
  accessToken: getAccessToken(),
  refreshToken: getRefreshToken(),
  loading: false,
  error: null,
};

/**
 * Auth slice with reducers
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Set auth loading state
     */
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    /**
     * Set authentication tokens
     */
    setAuth: (state, action: PayloadAction<AuthResponse>) => {
      state.accessToken = action.payload.access_token;
      state.refreshToken = action.payload.refresh_token;
      state.isAuthenticated = true;
      state.error = null;

      // Save tokens to localStorage
      saveAccessToken(action.payload.access_token);
      saveRefreshToken(action.payload.refresh_token);
    },

    /**
     * Clear authentication state
     */
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = null;

      // Clear tokens from localStorage
      clearTokens();
    },

    /**
     * Set auth error message
     */
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setAuthLoading, setAuth, clearAuth, setAuthError } = authSlice.actions;
export default authSlice.reducer;

