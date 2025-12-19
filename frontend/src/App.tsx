import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, clearAuth } from './stores';
import { selectIsGuest } from './stores/selectors/auth.selectors';
import { ErrorBoundary, Header, ErrorModal } from './components/common';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { WelcomePage } from './pages/WelcomePage';
import { ChatPage } from './pages/ChatPage';
import { PrivateRoute } from './components/auth/PrivateRoute';
import './styles/index.scss';

/**
 * Inner app component with guest session cleanup
 */
function InnerApp() {
  const dispatch = useDispatch();
  const isGuest = useSelector(selectIsGuest);

  /**
   * Handle page unload to clear guest session
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isGuest) {
        // Clear guest session when page is being closed
        dispatch(clearAuth());
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isGuest, dispatch]);

  return (
    <div className="app">
      <Header />
      <ErrorModal />
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}

/**
 * Main App component
 */
function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <InnerApp />
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;

