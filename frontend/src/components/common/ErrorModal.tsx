import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { clearError, selectError } from '@/stores';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Error modal component for displaying errors
 */
export const ErrorModal = () => {
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectError);
  const { t } = useTranslation();

  /**
   * Handle closing error modal
   */
  const handleClose = () => {
    dispatch(clearError());
  };

  /**
   * Handle Escape key
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && error) {
        dispatch(clearError());
      }
    };

    if (error) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [error, dispatch]);

  if (!error) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content error-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{error.title || t('common.error')}</h2>
          <button
            className="modal-close"
            onClick={handleClose}
            title={t('common.close')}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <p className="error-message">{error.message}</p>
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={handleClose}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

