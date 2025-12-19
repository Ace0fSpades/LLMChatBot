import { ChatHistory } from '@/components/sidebar/ChatHistory';
import { ChatInterface } from '@/components/chat/ChatInterface';

/**
 * Chat page component
 */
export const ChatPage = () => {
  return (
    <div className="chat-page">
      <ChatHistory />
      <ChatInterface />
    </div>
  );
};

