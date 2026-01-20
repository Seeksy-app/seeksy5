import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRole, UserRole } from '@/contexts/RoleContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { currentRole, isLoading } = useRole();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (currentRole !== requiredRole) {
    // Redirect to appropriate dashboard based on current role
    const redirectPath = currentRole === 'creator' ? '/dashboard' : '/advertiser';
    return <Navigate to={redirectPath} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
