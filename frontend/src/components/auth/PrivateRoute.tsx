import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { selectIsAuthenticated } from '@/stores';

/**
 * Private route props
 */
interface PrivateRouteProps {
  children: ReactNode;
}

/**
 * Private route component that requires authentication or guest session
 */
export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

