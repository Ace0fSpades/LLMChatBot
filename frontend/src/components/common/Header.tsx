import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

/**
 * Header component with logout button
 */
export const Header = () => {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="header">
      <div className="header-content">
        <h1>LLM ChatBot</h1>
        <button onClick={handleLogout} className="btn-secondary">
          Выйти
        </button>
      </div>
    </header>
  );
};

