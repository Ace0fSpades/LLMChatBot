import type { ChatSession } from '@/types/chat.types';
import { useTranslation } from 'react-i18next';
import styles from './ChatHistory.module.scss';

/**
 * Chat history item props
 */
interface ChatHistoryItemProps {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
  onArchive: () => void;
}

/**
 * Chat history item component
 */
export const ChatHistoryItem = ({
  session,
  isActive,
  onClick,
  onArchive,
}: ChatHistoryItemProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';

  return (
    <div
      className={`${styles['chat-history-item']} ${isActive ? styles.active : ''}`}
      onClick={onClick}
    >
      <div className={styles['chat-history-item-content']}>
        <div className={styles['chat-history-item-title']}>{session.title}</div>
        <div className={styles['chat-history-item-meta']}>
          {new Date(session.updated_at).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
          })}
        </div>
      </div>
      <button
        className={styles['chat-history-item-archive']}
        onClick={(e) => {
          e.stopPropagation();
          onArchive();
        }}
        title={t('chatHistory.archiveTooltip')}
      >
        ×
      </button>
    </div>
  );
};

