/**
 * RequireAuth - Guard that requires user to be authenticated
 * 
 * Shows loading state while auth is loading, redirects to /auth if anonymous.
 * No data fetching - just reads from AuthContext.
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLoading } from '@/components/ui/AppLoading';

interface RequireAuthProps {
  children: ReactNode;
  /** Where to redirect if not authenticated (default: /auth) */
  redirectTo?: string;
}

export function RequireAuth({ children, redirectTo = '/auth' }: RequireAuthProps) {
  const { status } = useAuth();
  const location = useLocation();

  // Show loading while auth is resolving
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AppLoading message="Loading..." variant="fullscreen" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === 'anonymous') {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // Render protected content
  return <>{children}</>;
}
