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
 * Private route component that requires authentication
 */
export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

