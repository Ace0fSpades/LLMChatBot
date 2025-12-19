import type { ChatSession } from '@/types/chat.types';

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
  return (
    <div
      className={`chat-history-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="chat-history-item-content">
        <div className="chat-history-item-title">{session.title}</div>
        <div className="chat-history-item-meta">
          {new Date(session.updated_at).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
          })}
        </div>
      </div>
      <button
        className="chat-history-item-archive"
        onClick={(e) => {
          e.stopPropagation();
          onArchive();
        }}
        title="Архивировать"
      >
        ×
      </button>
    </div>
  );
};

