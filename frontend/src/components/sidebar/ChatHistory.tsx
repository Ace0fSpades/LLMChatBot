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
import { useTranslation } from 'react-i18next';
import styles from './ChatHistory.module.scss';

/**
 * Chat history sidebar component
 */
export const ChatHistory = () => {
  const dispatch = useAppDispatch();
  const { sessions, currentSession, loading } = useChatHistorySelectors();
  const { createSession, archiveSession } = useChatHistory();
  const { t } = useTranslation();
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
      handleError(error, t('errors.loadChat'));
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
      handleError(error, t('errors.createChat'));
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
      handleError(error, t('errors.archiveChat'));
    }
  };

  if (showArchived) {
    return <ArchivedChats onClose={() => setShowArchived(false)} />;
  }

  return (
    <>
      <div className={styles['chat-history']}>
        <div className={styles['chat-history-header']}>
          <button onClick={handleNewChatClick} className="btn-primary">
            {t('chat.newChat')}
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`btn-secondary ${styles['chat-history-archive-btn']}`}
            title={t('chatHistory.archivedChats')}
          >
            📦 {t('common.archive')}
          </button>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className={styles['chat-history-list']}>
            {sessions.length === 0 ? (
              <div className={styles['chat-history-empty']}>
                <p>{t('chat.noChats')}</p>
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

