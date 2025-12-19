import { useAppSelector } from '@/hooks/redux';
import { createSelector } from '@reduxjs/toolkit';
import {
  selectCurrentSession,
  selectCurrentMessages,
  selectIsStreaming,
  type RootState,
} from '@/stores';

/**
 * Memoized selector for ChatInterface component
 * Combines multiple selectors into one to improve performance
 */
const chatInterfaceSelector = createSelector(
  [
    (state: RootState) => selectCurrentSession(state),
    (state: RootState) => selectCurrentMessages(state),
    (state: RootState) => selectIsStreaming(state),
  ],
  (currentSession, messages, isStreaming) => ({
    currentSession,
    messages,
    isStreaming,
  })
);

/**
 * Hook for ChatInterface selectors
 */
export const useChatInterfaceSelectors = () => {
  return useAppSelector(chatInterfaceSelector);
};

