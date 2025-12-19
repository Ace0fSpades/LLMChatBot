import { useState, FormEvent, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ChatInterface.module.scss';

/**
 * Input area props
 */
interface InputAreaProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

/**
 * Input area component for chat messages
 */
export const InputArea = ({ onSend, disabled }: InputAreaProps) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');

  /**
   * Handle form submission
   */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  /**
   * Handle Enter key (submit) or Shift+Enter (new line)
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={styles['input-area']}>
      <form onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.messagePlaceholder')}
          disabled={disabled}
          rows={3}
        />
        <button type="submit" disabled={disabled || !message.trim()} className="btn-primary">
          {t('chat.sendMessage')}
        </button>
      </form>
    </div>
  );
};

