import { ChatHistory } from '@/components/sidebar/ChatHistory';
import { ChatInterface } from '@/components/chat/ChatInterface';
import styles from './ChatPage.module.scss';

/**
 * Chat page component
 */
export const ChatPage = () => {
  return (
    <div className={styles['chat-page']}>
      <ChatHistory />
      <ChatInterface />
    </div>
  );
};

