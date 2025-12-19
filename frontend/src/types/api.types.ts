/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Error response from API
 */
export interface ApiError {
  error: string;
}

