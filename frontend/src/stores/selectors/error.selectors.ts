import type { RootState } from '../store';

/**
 * Base selectors - simple functions to extract data from state
 */
export const selectError = (state: RootState) => state.error.error;

