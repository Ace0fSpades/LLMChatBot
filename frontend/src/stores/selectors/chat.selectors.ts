import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { ChatState } from '../types/chat.types';

/**
 * Base selectors - simple functions to extract data from state
 */
const selectChatState = (state: RootState): ChatState => state.chat;

export const selectSessions = (state: RootState) => state.chat.sessions;
export const selectArchivedSessions = (state: RootState) =>
  state.chat.archivedSessions;
export const selectCurrentSession = (state: RootState) =>
  state.chat.currentSession;
export const selectCurrentMessages = (state: RootState) =>
  state.chat.currentMessages;
export const selectChatLoading = (state: RootState) => state.chat.loading;
export const selectArchivedLoading = (state: RootState) =>
  state.chat.archivedLoading;
export const selectChatError = (state: RootState) => state.chat.error;
export const selectIsStreaming = (state: RootState) => state.chat.isStreaming;

/**
 * Memoized selectors - combine multiple base selectors for performance
 */
export const selectChatStateData = createSelector(
  [selectChatState],
  (chatState) => ({
    sessions: chatState.sessions,
    archivedSessions: chatState.archivedSessions,
    currentSession: chatState.currentSession,
    currentMessages: chatState.currentMessages,
    loading: chatState.loading,
    archivedLoading: chatState.archivedLoading,
    error: chatState.error,
    isStreaming: chatState.isStreaming,
  })
);

