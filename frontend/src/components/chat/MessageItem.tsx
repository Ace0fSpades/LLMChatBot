import type React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTranslation } from 'react-i18next';
import type { Components } from 'react-markdown';
import type { Message } from '@/types/message.types';
import styles from './MessageItem.module.scss';

/**
 * Message item props
 */
interface MessageItemProps {
  message: Message;
}

/**
 * Decode URL-encoded content if needed
 */
const decodeContent = (content: string): string => {
  try {
    // Check if content looks like URL-encoded
    if (content.includes('%')) {
      const decoded = decodeURIComponent(content);
      // If decoding was successful and result is different, return decoded
      if (decoded !== content) {
        return decoded;
      }
    }
    return content;
  } catch {
    // If decoding fails, return original content
    return content;
  }
};

/**
 * Message item component with Markdown support
 */
export const MessageItem = ({ message }: MessageItemProps) => {
  const { t, i18n } = useTranslation();
  const isUser = message.role === 'user';
  const decodedContent = decodeContent(message.content);

  return (
    <div
      className={`${styles['message-item']} ${
        isUser ? styles['message-user'] : styles['message-assistant']
      }`}
    >
      <div className={styles['message-content']}>
        <div className={styles['message-role']}>
          {isUser ? t('chat.you') : t('chat.assistant')}
          {!isUser && message.is_incomplete && (
            <span
              className={styles['message-incomplete-badge']}
              title={t('chat.incompleteTooltip')}
            >
              {t('chat.incompleteMessage')}
            </span>
          )}
        </div>
        <div className={styles['message-text']}>
          {isUser ? (
            // User messages: plain text (no Markdown)
            <span>{decodedContent}</span>
          ) : (
            // Assistant messages: render Markdown with syntax highlighting
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const isInline = !className || !match;

                  return !isInline && language ? (
                    <SyntaxHighlighter
                      style={oneDark as Record<string, React.CSSProperties>}
                      language={language}
                      PreTag="div"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              } as Components}
            >
              {decodedContent}
            </ReactMarkdown>
          )}
        </div>
        <div className={styles['message-time']}>
          {new Date(message.created_at).toLocaleTimeString(
            i18n.language === 'ru' ? 'ru-RU' : 'en-US',
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          )}
        </div>
      </div>
    </div>
  );
};

