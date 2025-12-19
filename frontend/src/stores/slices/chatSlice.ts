import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ChatSession } from '@/types/chat.types';
import type { Message } from '@/types/message.types';
import type { ChatState } from '../types/chat.types';

/**
 * Initial chat state
 */
const initialState: ChatState = {
  sessions: [],
  archivedSessions: [],
  currentSession: null,
  currentMessages: [],
  loading: false,
  archivedLoading: false,
  error: null,
  isStreaming: false,
  streamingMessage: '',
};

/**
 * Chat slice with reducers
 */
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    /**
     * Set chat loading state
     */
    setChatLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    /**
     * Set archived loading state
     */
    setArchivedLoading: (state, action: PayloadAction<boolean>) => {
      state.archivedLoading = action.payload;
    },

    /**
     * Set chat sessions list
     */
    setSessions: (state, action: PayloadAction<ChatSession[]>) => {
      state.sessions = action.payload;
    },

    /**
     * Add new chat session
     */
    addSession: (state, action: PayloadAction<ChatSession>) => {
      state.sessions.unshift(action.payload);
    },

    /**
     * Update chat session
     */
    updateSession: (state, action: PayloadAction<ChatSession>) => {
      const index = state.sessions.findIndex(
        (s) => s.id === action.payload.id
      );
      if (index !== -1) {
        state.sessions[index] = action.payload;
      }
      if (state.currentSession?.id === action.payload.id) {
        state.currentSession = action.payload;
      }
    },

    /**
     * Remove chat session (archive)
     */
    removeSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter((s) => s.id !== action.payload);
      if (state.currentSession?.id === action.payload) {
        state.currentSession = null;
        state.currentMessages = [];
      }
    },

    /**
     * Set archived chat sessions list
     */
    setArchivedSessions: (state, action: PayloadAction<ChatSession[]>) => {
      state.archivedSessions = action.payload;
    },

    /**
     * Remove archived session (restore or delete)
     */
    removeArchivedSession: (state, action: PayloadAction<string>) => {
      state.archivedSessions = state.archivedSessions.filter(
        (s) => s.id !== action.payload
      );
    },

    /**
     * Remove multiple archived sessions
     */
    removeArchivedSessions: (state, action: PayloadAction<string[]>) => {
      const idsToRemove = new Set(action.payload);
      state.archivedSessions = state.archivedSessions.filter(
        (s) => !idsToRemove.has(s.id)
      );
    },

    /**
     * Add session back to active sessions (restore)
     */
    restoreSession: (state, action: PayloadAction<ChatSession>) => {
      state.sessions.unshift(action.payload);
    },

    /**
     * Set current chat session
     */
    setCurrentSession: (state, action: PayloadAction<ChatSession | null>) => {
      state.currentSession = action.payload;
    },

    /**
     * Set messages for current session
     */
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.currentMessages = action.payload;
    },

    /**
     * Add message to current session
     */
    addMessage: (state, action: PayloadAction<Message>) => {
      state.currentMessages.push(action.payload);
    },

    /**
     * Update last message (for streaming)
     */
    updateLastMessage: (state, action: PayloadAction<string>) => {
      const lastMessage = state.currentMessages[state.currentMessages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content = action.payload;
      } else {
        // Create new assistant message if it doesn't exist
        state.currentMessages.push({
          id: `temp-${Date.now()}`,
          role: 'assistant',
          content: action.payload,
          tokens: 0,
          is_incomplete: true,
          created_at: new Date().toISOString(),
          sequence_number: state.currentMessages.length + 1,
        });
      }
    },

    /**
     * Set streaming state
     */
    setStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
      if (!action.payload) {
        state.streamingMessage = '';
      }
    },

    /**
     * Append token to streaming message
     */
    appendStreamingToken: (state, action: PayloadAction<string>) => {
      state.streamingMessage += action.payload;
      const lastMessage = state.currentMessages[state.currentMessages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content = state.streamingMessage;
      }
    },

    /**
     * Set chat error message
     */
    setChatError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    /**
     * Clear chat state
     */
    clearChat: (state) => {
      state.sessions = [];
      state.currentSession = null;
      state.currentMessages = [];
      state.isStreaming = false;
      state.streamingMessage = '';
    },
  },
});

export const {
  setChatLoading,
  setArchivedLoading,
  setSessions,
  addSession,
  updateSession,
  removeSession,
  setArchivedSessions,
  removeArchivedSession,
  removeArchivedSessions,
  restoreSession,
  setCurrentSession,
  setMessages,
  addMessage,
  updateLastMessage,
  setStreaming,
  appendStreamingToken,
  setChatError,
  clearChat,
} = chatSlice.actions;
export default chatSlice.reducer;

