import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import styles from './WelcomePage.module.scss';

/**
 * Welcome page component with authentication options
 */
export const WelcomePage = () => {
  const navigate = useNavigate();
  const { startGuestSession } = useAuth();
  const { t } = useTranslation();
  const [guestLoading, setGuestLoading] = useState(false);

  /**
   * Handle guest session start
   */
  const handleGuestSession = async () => {
    setGuestLoading(true);
    try {
      const result = await startGuestSession();
      if (result.success) {
        navigate('/chat');
      }
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className={styles['welcome-container']}>
      <div className={styles['welcome-content']}>
        <h1 className={styles['welcome-title']}>{t('welcome.title')}</h1>
        <p className={styles['welcome-description']}>
          {t('welcome.description')}
        </p>

        <div className={styles['welcome-actions']}>
          <div className={styles['welcome-card']}>
            <h2 className={styles['welcome-card-title']}>
              {t('welcome.loginRegisterTitle')}
            </h2>
            <p className={styles['welcome-card-description']}>
              {t('welcome.loginRegisterDescription')}
            </p>
            <div className={styles['welcome-card-actions']}>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary"
              >
                {t('auth.login')}
              </button>
              <button
                onClick={() => navigate('/register')}
                className="btn-secondary"
              >
                {t('auth.register')}
              </button>
            </div>
          </div>

          <div className={`${styles['welcome-card']} ${styles['guest-card']}`}>
            <h2 className={styles['welcome-card-title']}>
              {t('welcome.guestTitle')}
            </h2>
            <p className={styles['welcome-card-description']}>
              {t('welcome.guestDescription')}
            </p>
            <button
              onClick={handleGuestSession}
              className={`btn-primary ${styles['welcome-btn']} ${styles['guest-btn']}`}
              disabled={guestLoading}
            >
              {guestLoading ? t('common.loading') : t('welcome.useGuestAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

