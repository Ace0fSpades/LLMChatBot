import { store, setError } from '@/stores';
import { AxiosError } from 'axios';

/**
 * Get user-friendly error message from error
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    // Try to get error message from response
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    // Fallback to status text or default message
    if (error.response?.status === 404) {
      return 'Запрашиваемый ресурс не найден';
    }
    if (error.response?.status === 401) {
      return 'Необходима авторизация';
    }
    if (error.response?.status === 403) {
      return 'Доступ запрещен';
    }
    if (error.response?.status === 500) {
      return 'Внутренняя ошибка сервера';
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Произошла неизвестная ошибка';
};

/**
 * Show error in modal
 */
export const showError = (error: unknown, title?: string): void => {
  const message = getErrorMessage(error);
  store.dispatch(setError({ message, title }));
};

/**
 * Handle error and show it in modal
 * Replaces console.error calls
 */
export const handleError = (error: unknown, context?: string): void => {
  const title = context ? `Ошибка: ${context}` : 'Ошибка';
  showError(error, title);
};

