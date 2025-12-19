import { useState, useEffect, useRef } from 'react';

/**
 * Create chat modal props
 */
interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
}

/**
 * Modal for creating a new chat with custom title
 */
export const CreateChatModal = ({
  isOpen,
  onClose,
  onCreate,
}: CreateChatModalProps) => {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Reset title when modal opens/closes
   */
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      // Focus input after modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || 'New Chat';
    onCreate(finalTitle);
    setTitle('');
    onClose();
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setTitle('');
    onClose();
  };

  /**
   * Handle Escape key
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setTitle('');
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Создать новый чат</h2>
          <button
            className="modal-close"
            onClick={handleCancel}
            title="Закрыть"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="chat-title">Название чата</label>
            <input
              id="chat-title"
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название (необязательно)"
              maxLength={255}
              autoFocus
            />
            <p className="form-hint">
              Оставьте пустым для использования "New Chat"
            </p>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancel}
            >
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

