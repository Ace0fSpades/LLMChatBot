import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import styles from './Header.module.scss';

/**
 * Header component with logout button
 */
export const Header = () => {
  const { logout, isAuthenticated, isGuest } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className={styles.header}>
      <div className={styles['header-content']}>
        <h1>
          {t('common.appName')}{' '}
          {isGuest && (
            <span className={styles['guest-badge']}>
              ({t('auth.guest')})
            </span>
          )}
        </h1>
        <div className={styles['header-actions']}>
          <LanguageSwitcher />
          <button onClick={handleLogout} className="btn-secondary">
            {isGuest ? t('auth.guestMode') : t('auth.logout')}
          </button>
        </div>
      </div>
    </header>
  );
};

