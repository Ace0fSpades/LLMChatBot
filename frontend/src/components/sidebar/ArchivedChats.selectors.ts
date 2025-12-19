import { useAppSelector } from '@/hooks/redux';
import { createSelector } from '@reduxjs/toolkit';
import {
  selectArchivedSessions,
  selectArchivedLoading,
  selectCurrentSession,
  type RootState,
} from '@/stores';

/**
 * Memoized selector for ArchivedChats component
 * Combines multiple selectors into one to improve performance
 */
const archivedChatsSelector = createSelector(
  [
    (state: RootState) => selectArchivedSessions(state),
    (state: RootState) => selectArchivedLoading(state),
    (state: RootState) => selectCurrentSession(state),
  ],
  (archivedSessions, loading, currentSession) => ({
    archivedSessions,
    loading,
    currentSession,
  })
);

/**
 * Hook for ArchivedChats selectors
 */
export const useArchivedChatsSelectors = () => {
  return useAppSelector(archivedChatsSelector);
};

