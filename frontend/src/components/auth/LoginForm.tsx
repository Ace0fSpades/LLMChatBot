import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import styles from './LoginForm.module.scss';

/**
 * Login form component
 */
export const LoginForm = () => {
  const navigate = useNavigate();
  const { login, loading, error, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await login({ email, password });
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
        <h2>{t('auth.loginTitle')}</h2>
        {error && <div className="error-message">{error}</div>}
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
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? t('common.loading') : t('auth.login')}
          </button>
        </form>
        <p className={styles['auth-link']}>
          {t('auth.noAccount')}{' '}
          <a href="/register">{t('auth.register')}</a>
        </p>
      </div>
    </div>
  );
};

