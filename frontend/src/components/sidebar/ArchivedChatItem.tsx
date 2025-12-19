import type { ChatSession } from '@/types/chat.types';
import { useTranslation } from 'react-i18next';
import styles from './ArchivedChats.module.scss';

/**
 * Archived chat item props
 */
interface ArchivedChatItemProps {
  session: ChatSession;
  isSelected: boolean;
  onSelect: (sessionId: string) => void;
  onClick: () => void;
}

/**
 * Archived chat item component with checkbox
 */
export const ArchivedChatItem = ({
  session,
  isSelected,
  onSelect,
  onClick,
}: ArchivedChatItemProps) => {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect(session.id);
  };

  return (
    <div className={styles['archived-chat-item']} onClick={onClick}>
      <input
        type="checkbox"
        className={styles['archived-chat-item-checkbox']}
        checked={isSelected}
        onChange={handleCheckboxChange}
        onClick={(e) => e.stopPropagation()}
      />
      <div className={styles['archived-chat-item-content']}>
        <div className={styles['archived-chat-item-title']}>{session.title}</div>
        <div className={styles['archived-chat-item-meta']}>
          {new Date(session.updated_at).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      </div>
    </div>
  );
};

