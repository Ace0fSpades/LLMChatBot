import { useState } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { setCurrentSession } from '@/stores';
import { useChatHistory } from '@/hooks/useChatHistory';
import { chatApi } from '@/services/api/chatApi';
import { ChatHistoryItem } from './ChatHistoryItem';
import { ArchivedChats } from './ArchivedChats';
import { LoadingSpinner, CreateChatModal } from '@/components/common';
import { useChatHistorySelectors } from './ChatHistory.selectors';
import { handleError } from '@/utils/errorHandler';

/**
 * Chat history sidebar component
 */
export const ChatHistory = () => {
  const dispatch = useAppDispatch();
  const { sessions, currentSession, loading } = useChatHistorySelectors();
  const { createSession, archiveSession } = useChatHistory();
  const [showArchived, setShowArchived] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  /**
   * Handle chat session selection
   */
  const handleSelectSession = async (sessionId: string) => {
    try {
      const session = await chatApi.getChatSession(sessionId, true);
      dispatch(setCurrentSession(session));
    } catch (error) {
      handleError(error, 'Загрузка чата');
    }
  };

  /**
   * Handle opening create chat modal
   */
  const handleNewChatClick = () => {
    setShowCreateModal(true);
  };

  /**
   * Handle creating new chat with title
   */
  const handleCreateChat = async (title: string) => {
    try {
      const session = await createSession({ title });
      if (session) {
        dispatch(setCurrentSession(session));
      }
    } catch (error) {
      handleError(error, 'Создание чата');
    }
  };

  /**
   * Handle archiving chat
   */
  const handleArchive = async (sessionId: string) => {
    try {
      await archiveSession(sessionId);
      if (currentSession?.id === sessionId) {
        dispatch(setCurrentSession(null));
      }
    } catch (error) {
      handleError(error, 'Архивирование чата');
    }
  };

  if (showArchived) {
    return <ArchivedChats onClose={() => setShowArchived(false)} />;
  }

  return (
    <>
      <div className="chat-history">
        <div className="chat-history-header">
          <button onClick={handleNewChatClick} className="btn-primary">
            + Новый чат
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className="btn-secondary chat-history-archive-btn"
            title="Архивированные чаты"
          >
            📦 Архив
          </button>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="chat-history-list">
            {sessions.length === 0 ? (
              <div className="chat-history-empty">
                <p>Нет чатов. Создайте новый!</p>
              </div>
            ) : (
              sessions.map((session) => (
                <ChatHistoryItem
                  key={session.id}
                  session={session}
                  isActive={currentSession?.id === session.id}
                  onClick={() => handleSelectSession(session.id)}
                  onArchive={() => handleArchive(session.id)}
                />
              ))
            )}
          </div>
        )}
      </div>
      <CreateChatModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateChat}
      />
    </>
  );
};

