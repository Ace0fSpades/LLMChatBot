import { useEffect, useState, useRef } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import {
  setMessages,
  addMessage,
  updateLastMessage,
  setStreaming,
  setCurrentSession,
} from '@/stores';
import { chatApi } from '@/services/api/chatApi';
import { useChatStream } from '@/hooks/useChatStream';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { LoadingSpinner } from '@/components/common';
import { useChatInterfaceSelectors } from './ChatInterface.selectors';
import { handleError } from '@/utils/errorHandler';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import type { Message } from '@/types/message.types';
import styles from './ChatInterface.module.scss';

/**
 * Chat interface component
 */
export const ChatInterface = () => {
  const dispatch = useAppDispatch();
  const { currentSession, messages, isStreaming } = useChatInterfaceSelectors();
  const { startStream } = useChatStream();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const assistantMessageIdRef = useRef<string | null>(null);
  const streamingContentRef = useRef<string>('');

  /**
   * Load messages for current session
   */
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentSession) return;

      try {
        setLoading(true);
        const sessionWithMessages = await chatApi.getChatSession(
          currentSession.id,
          true
        );
        dispatch(setMessages(sessionWithMessages.messages));
      } catch (error: unknown) {
        // If session was deleted (404) or not found, clear current session and messages
        if (error instanceof AxiosError && error.response?.status === 404) {
          dispatch(setCurrentSession(null));
          dispatch(setMessages([]));
        } else {
          handleError(error, t('errors.loadMessages'));
        }
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [currentSession, dispatch]);

  /**
   * Handle sending a message
   */
  const handleSendMessage = async (content: string) => {
    if (!currentSession) return;

    // Add user message to UI immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      tokens: 0,
      is_incomplete: false,
      created_at: new Date().toISOString(),
      sequence_number: messages.length + 1,
    };
    dispatch(addMessage(userMessage));
    dispatch(setStreaming(true));

    // Create placeholder assistant message for streaming
    const assistantMessageId = `temp-assistant-${Date.now()}`;
    assistantMessageIdRef.current = assistantMessageId;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      tokens: 0,
      is_incomplete: true,
      created_at: new Date().toISOString(),
      sequence_number: messages.length + 2,
    };
    dispatch(addMessage(assistantMessage));
    streamingContentRef.current = ''; // Reset streaming content

    // Start streaming response
    try {
      await startStream(
        currentSession.id,
        content,
        (token: string) => {
          // Accumulate tokens in ref and update message
          streamingContentRef.current += token;
          // Dispatch outside of setState to avoid React warning
          dispatch(updateLastMessage(streamingContentRef.current));
        },
        () => {
          dispatch(setStreaming(false));
          streamingContentRef.current = ''; // Clear streaming content
          
          // Wait a bit for backend to save the message, then reload
          // This ensures the message is saved in DB before we reload
          setTimeout(() => {
            chatApi.getChatSession(currentSession.id, true).then((session) => {
              dispatch(setMessages(session.messages));
            }).catch((err) => {
              handleError(err, t('errors.reloadMessages'));
            });
          }, 500); // 500ms delay to allow backend to save
        },
        (error: Error) => {
          dispatch(setStreaming(false));
          streamingContentRef.current = ''; // Clear streaming content
          // Reload messages to get current state from backend
          chatApi.getChatSession(currentSession.id, true).then((session) => {
            dispatch(setMessages(session.messages));
          }).catch((err) => {
            // Fallback: remove failed assistant message manually
            const currentMessages = messages.filter(m => m.id !== assistantMessageId);
            dispatch(setMessages(currentMessages));
            handleError(err, t('errors.reloadMessagesAfterError'));
          });
          // Show error to user
          handleError(error, t('errors.getResponse'));
        }
      );
    } catch (error) {
      handleError(error, t('errors.startStream'));
      dispatch(setStreaming(false));
    }
  };

  if (!currentSession) {
    return (
      <div className={styles['chat-interface-empty']}>
        <p>{t('chat.selectChat')}</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles['chat-interface']}>
      <div className={styles['chat-header']}>
        <h2>{currentSession.title}</h2>
      </div>
      <MessageList messages={messages} />
      <InputArea onSend={handleSendMessage} disabled={isStreaming} />
    </div>
  );
};

