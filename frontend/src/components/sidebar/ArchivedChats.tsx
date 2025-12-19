import { useState, useCallback, useEffect } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import {
  setArchivedSessions,
  removeArchivedSessions,
  restoreSession,
  setSessions,
  setArchivedLoading,
  setCurrentSession,
  setMessages,
} from '@/stores';
import { chatApi } from '@/services/api/chatApi';
import { ArchivedChatItem } from './ArchivedChatItem';
import { LoadingSpinner } from '@/components/common';
import { useArchivedChatsSelectors } from './ArchivedChats.selectors';
import { handleError } from '@/utils/errorHandler';

/**
 * Archived chats component
 */
export const ArchivedChats = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useAppDispatch();
  const { archivedSessions, loading, currentSession } = useArchivedChatsSelectors();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Load archived chat sessions
   */
  const loadArchivedSessions = useCallback(async () => {
    try {
      dispatch(setArchivedLoading(true));
      const sessions = await chatApi.getChatSessions(true);
      const archived = sessions.filter((s) => s.is_archived);
      dispatch(setArchivedSessions(archived));
    } catch (error) {
      handleError(error, 'Загрузка архивированных чатов');
    } finally {
      dispatch(setArchivedLoading(false));
    }
  }, [dispatch]);

  /**
   * Load archived sessions on mount
   */
  useEffect(() => {
    loadArchivedSessions();
  }, [loadArchivedSessions]);

  /**
   * Handle session selection
   */
  const handleSelectSession = useCallback((sessionId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  }, []);

  /**
   * Handle viewing a session
   */
  const handleViewSession = useCallback(
    async (sessionId: string) => {
      try {
        const session = await chatApi.getChatSession(sessionId, true);
        dispatch(setCurrentSession(session));
        // Don't close archived chats panel when viewing a session
      } catch (error) {
        handleError(error, 'Загрузка чата');
      }
    },
    [dispatch]
  );

  /**
   * Handle restoring selected sessions
   */
  const handleRestore = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);
    setIsProcessing(true);

    try {
      if (ids.length === 1) {
        // Single restore
        const session = await chatApi.restoreChatSession(ids[0]);
        dispatch(restoreSession(session));
        dispatch(removeArchivedSessions([ids[0]]));
      } else {
        // Bulk restore
        await chatApi.restoreChatSessions(ids);
        // Reload both archived and active sessions
        const allSessions = await chatApi.getChatSessions(true);
        const archived = allSessions.filter((s) => s.is_archived);
        const active = allSessions.filter((s) => !s.is_archived);
        dispatch(setArchivedSessions(archived));
        dispatch(setSessions(active));
      }
      setSelectedIds(new Set());
    } catch (error) {
      handleError(error, 'Восстановление чатов');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, dispatch]);

  /**
   * Handle deleting selected sessions
   */
  const handleDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);
    const confirmed = window.confirm(
      `Вы уверены, что хотите удалить ${ids.length} чат(ов)? Это действие нельзя отменить.`
    );

    if (!confirmed) return;

    setIsProcessing(true);

    try {
      if (ids.length === 1) {
        // Single delete
        await chatApi.deleteChatSession(ids[0]);
        dispatch(removeArchivedSessions([ids[0]]));
        
        // If deleted session is currently open, clear it
        if (currentSession && currentSession.id === ids[0]) {
          dispatch(setCurrentSession(null));
          dispatch(setMessages([]));
        }
      } else {
        // Bulk delete
        await chatApi.deleteChatSessions(ids);
        dispatch(removeArchivedSessions(ids));
        
        // If current session is among deleted ones, clear it
        if (currentSession && ids.includes(currentSession.id)) {
          dispatch(setCurrentSession(null));
          dispatch(setMessages([]));
        }
      }
      setSelectedIds(new Set());
    } catch (error) {
      handleError(error, 'Удаление чатов');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, dispatch, currentSession]);

  /**
   * Handle select all
   */
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === archivedSessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(archivedSessions.map((s) => s.id)));
    }
  }, [selectedIds, archivedSessions]);

  const hasSelection = selectedIds.size > 0;
  const allSelected = archivedSessions.length > 0 && selectedIds.size === archivedSessions.length;

  return (
    <div className="archived-chats">
      <div className="archived-chats-header">
        <h2>Архивированные чаты</h2>
        <button
          className="archived-chats-close"
          onClick={onClose}
          title="Закрыть"
        >
          ×
        </button>
      </div>

      {archivedSessions.length > 0 && (
        <div className="archived-chats-toolbar">
          <label className="archived-chats-select-all">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAll}
            />
            <span>Выбрать все</span>
          </label>
          {hasSelection && (
            <div className="archived-chats-actions">
              <button
                className="btn-secondary archived-chats-restore"
                onClick={handleRestore}
                disabled={isProcessing}
              >
                Восстановить ({selectedIds.size})
              </button>
              <button
                className="btn-secondary archived-chats-delete"
                onClick={handleDelete}
                disabled={isProcessing}
              >
                Удалить ({selectedIds.size})
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="archived-chats-list">
          {archivedSessions.length === 0 ? (
            <div className="archived-chats-empty">
              <p>Нет архивированных чатов</p>
            </div>
          ) : (
            archivedSessions.map((session) => (
              <ArchivedChatItem
                key={session.id}
                session={session}
                isSelected={selectedIds.has(session.id)}
                onSelect={handleSelectSession}
                onClick={() => handleViewSession(session.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

