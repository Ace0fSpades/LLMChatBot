import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ErrorState } from '../types/error.types';

/**
 * Initial error state
 */
const initialState: ErrorState = {
  error: null,
};

/**
 * Error slice with reducers
 */
const errorSlice = createSlice({
  name: 'error',
  initialState,
  reducers: {
    /**
     * Set error message
     */
    setError: (
      state,
      action: PayloadAction<{ message: string; title?: string }>
    ) => {
      state.error = action.payload;
    },

    /**
     * Clear error
     */
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setError, clearError } = errorSlice.actions;
export default errorSlice.reducer;

