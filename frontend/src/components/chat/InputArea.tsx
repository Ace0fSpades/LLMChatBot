import { useState, FormEvent, KeyboardEvent } from 'react';

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
    <div className="input-area">
      <form onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введите сообщение... (Enter для отправки, Shift+Enter для новой строки)"
          disabled={disabled}
          rows={3}
        />
        <button type="submit" disabled={disabled || !message.trim()} className="btn-primary">
          Отправить
        </button>
      </form>
    </div>
  );
};

