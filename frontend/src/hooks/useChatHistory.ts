import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import {
  setChatLoading,
  setSessions,
  addSession,
  updateSession,
  removeSession,
  selectSessions,
  selectChatLoading,
} from '@/stores';
import { chatApi } from '@/services/api/chatApi';
import { handleError } from '@/utils/errorHandler';
import type { CreateChatSessionRequest } from '@/types/chat.types';

/**
 * Hook for managing chat history
 */
export const useChatHistory = () => {
  const dispatch = useAppDispatch();
  const sessions = useAppSelector(selectSessions);
  const loading = useAppSelector(selectChatLoading);

  /**
   * Load all chat sessions
   */
  const loadSessions = useCallback(async () => {
      try {
        dispatch(setChatLoading(true));
        const data = await chatApi.getChatSessions(false);
        dispatch(setSessions(data));
      } catch (err: unknown) {
        handleError(err, 'Загрузка списка чатов');
      } finally {
        dispatch(setChatLoading(false));
    }
  }, [dispatch]);

  /**
   * Create a new chat session
   */
  const createSession = useCallback(
    async (data?: CreateChatSessionRequest) => {
      try {
        dispatch(setChatLoading(true));
        const session = await chatApi.createChatSession(data || {});
        dispatch(addSession(session));
        return session;
      } catch (err: unknown) {
        handleError(err, 'Создание чата');
        throw err;
      } finally {
        dispatch(setChatLoading(false));
      }
    },
    [dispatch]
  );

  /**
   * Update chat session title
   */
  const updateSessionTitle = useCallback(
    async (id: string, title: string) => {
      try {
        const session = await chatApi.updateChatSession(id, { title });
        dispatch(updateSession(session));
      } catch (err: unknown) {
        handleError(err, 'Обновление чата');
        throw err;
      }
    },
    [dispatch]
  );

  /**
   * Archive chat session
   */
  const archiveSession = useCallback(
    async (id: string) => {
      try {
        await chatApi.archiveChatSession(id);
        dispatch(removeSession(id));
      } catch (err: unknown) {
        handleError(err, 'Архивирование чата');
        throw err;
      }
    },
    [dispatch]
  );

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    loading,
    loadSessions,
    createSession,
    updateSessionTitle,
    archiveSession,
  };
};

