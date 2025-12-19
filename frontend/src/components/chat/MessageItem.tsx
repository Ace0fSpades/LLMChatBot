import type React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';
import type { Message } from '@/types/message.types';

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
  const isUser = message.role === 'user';
  const decodedContent = decodeContent(message.content);

  return (
    <div className={`message-item ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className="message-content">
        <div className="message-role">
          {isUser ? 'Вы' : 'Ассистент'}
          {!isUser && message.is_incomplete && (
            <span className="message-incomplete-badge" title="Сообщение было обрезано из-за ограничения токенов или ошибки">
              (неполное)
            </span>
          )}
        </div>
        <div className="message-text">
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
        <div className="message-time">
          {new Date(message.created_at).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
};

