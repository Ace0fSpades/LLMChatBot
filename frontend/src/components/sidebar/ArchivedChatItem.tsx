import type { ChatSession } from '@/types/chat.types';

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
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect(session.id);
  };

  return (
    <div
      className="archived-chat-item"
      onClick={onClick}
    >
      <input
        type="checkbox"
        className="archived-chat-item-checkbox"
        checked={isSelected}
        onChange={handleCheckboxChange}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="archived-chat-item-content">
        <div className="archived-chat-item-title">{session.title}</div>
        <div className="archived-chat-item-meta">
          {new Date(session.updated_at).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      </div>
    </div>
  );
};

