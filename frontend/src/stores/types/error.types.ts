/**
 * Error state interface
 */
export interface ErrorState {
  error: {
    message: string;
    title?: string;
  } | null;
}

