import { useAppSelector } from '@/hooks/redux';
import { createSelector } from '@reduxjs/toolkit';
import {
  selectSessions,
  selectCurrentSession,
  selectChatLoading,
  type RootState,
} from '@/stores';

/**
 * Memoized selector for ChatHistory component
 * Combines multiple selectors into one to improve performance
 */
const chatHistorySelector = createSelector(
  [
    (state: RootState) => selectSessions(state),
    (state: RootState) => selectCurrentSession(state),
    (state: RootState) => selectChatLoading(state),
  ],
  (sessions, currentSession, loading) => ({
    sessions,
    currentSession,
    loading,
  })
);

/**
 * Hook for ChatHistory selectors
 */
export const useChatHistorySelectors = () => {
  return useAppSelector(chatHistorySelector);
};

