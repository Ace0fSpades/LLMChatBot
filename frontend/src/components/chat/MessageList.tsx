import { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import type { Message } from '@/types/message.types';
import styles from './MessageList.module.scss';

/**
 * Message list props
 */
interface MessageListProps {
  messages: Message[];
}

/**
 * Message list component with auto-scroll
 */
export const MessageList = ({ messages }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Scroll to bottom when messages change
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={styles['message-list']}>
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

