import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { AuthState } from '../types/auth.types';

/**
 * Base selectors - simple functions to extract data from state
 */
const selectAuthState = (state: RootState): AuthState => state.auth;

export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;

/**
 * Memoized selectors - combine multiple base selectors for performance
 */
export const selectAuthStateData = createSelector(
  [selectAuthState],
  (authState) => ({
    isAuthenticated: authState.isAuthenticated,
    accessToken: authState.accessToken,
    refreshToken: authState.refreshToken,
    loading: authState.loading,
    error: authState.error,
  })
);

