import { apiClient } from './client';
import type {
  ChatSession,
  CreateChatSessionRequest,
  UpdateChatSessionRequest,
  ChatSessionWithMessages,
} from '@/types/chat.types';

/**
 * Chat API service
 */
export const chatApi = {
  /**
   * Get all chat sessions for current user
   */
  getChatSessions: async (
    includeArchived = false
  ): Promise<ChatSession[]> => {
    const response = await apiClient.get<ChatSession[]>('/api/v1/chats', {
      params: {
        include_archived: includeArchived,
      },
    });
    return response.data;
  },

  /**
   * Create a new chat session
   */
  createChatSession: async (
    data: CreateChatSessionRequest
  ): Promise<ChatSession> => {
    const response = await apiClient.post<ChatSession>(
      '/api/v1/chats',
      data
    );
    return response.data;
  },

  /**
   * Get a specific chat session with messages
   */
  getChatSession: async (
    id: string,
    includeMessages = true
  ): Promise<ChatSessionWithMessages> => {
    const response = await apiClient.get<ChatSessionWithMessages>(
      `/api/v1/chats/${id}`,
      {
        params: {
          include_messages: includeMessages,
        },
      }
    );
    return response.data;
  },

  /**
   * Update chat session
   */
  updateChatSession: async (
    id: string,
    data: UpdateChatSessionRequest
  ): Promise<ChatSession> => {
    const response = await apiClient.put<ChatSession>(
      `/api/v1/chats/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Archive chat session
   */
  archiveChatSession: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/chats/${id}`);
  },

  /**
   * Restore archived chat session
   */
  restoreChatSession: async (id: string): Promise<ChatSession> => {
    const response = await apiClient.post<ChatSession>(
      `/api/v1/chats/${id}/restore`
    );
    return response.data;
  },

  /**
   * Restore multiple archived chat sessions
   */
  restoreChatSessions: async (ids: string[]): Promise<void> => {
    await apiClient.post('/api/v1/chats/restore', { ids });
  },

  /**
   * Permanently delete chat session
   */
  deleteChatSession: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/chats/${id}/permanent`);
  },

  /**
   * Permanently delete multiple chat sessions
   */
  deleteChatSessions: async (ids: string[]): Promise<void> => {
    await apiClient.post('/api/v1/chats/delete', { ids });
  },
};

