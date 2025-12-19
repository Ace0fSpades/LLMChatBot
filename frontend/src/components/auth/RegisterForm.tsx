import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import styles from './RegisterForm.module.scss';

/**
 * Registration form component
 */
export const RegisterForm = () => {
  const navigate = useNavigate();
  const { register, loading, error, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return;
    }

    const result = await register({ email, username, password });
    if (result.success) {
      navigate('/chat');
    }
  };

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/chat');
    return null;
  }

  return (
    <div className={styles['auth-container']}>
      <div className={styles['auth-form']}>
        <h2>{t('auth.registerTitle')}</h2>
        {error && <div className="error-message">{error}</div>}
        {password !== confirmPassword && confirmPassword && (
          <div className="error-message">{t('auth.passwordsNotMatch')}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="username">{t('auth.username')}</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={100}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || password !== confirmPassword}
            className="btn-primary"
          >
            {loading ? t('common.loading') : t('auth.register')}
          </button>
        </form>
        <p className={styles['auth-link']}>
          {t('auth.hasAccount')} <a href="/login">{t('auth.login')}</a>
        </p>
      </div>
    </div>
  );
};

