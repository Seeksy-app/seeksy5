/**
 * RequireRole - Guard that requires user to have a specific role
 * 
 * Must be used inside RequireAuth or after auth is confirmed.
 * Shows loading state while auth is loading, redirects if role not present.
 */

import { ReactNode, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { AppLoading } from '@/components/ui/AppLoading';
import { useToast } from '@/hooks/use-toast';

interface RequireRoleProps {
  children: ReactNode;
  /** Required role(s) - user must have at least one */
  role: UserRole | UserRole[];
  /** Where to redirect if role not present (default: /dashboard) */
  redirectTo?: string;
  /** Show toast when access denied */
  showToast?: boolean;
}

export function RequireRole({ 
  children, 
  role, 
  redirectTo = '/dashboard',
  showToast = true 
}: RequireRoleProps) {
  const { status, hasRole, hasAnyRole } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const hasShownToast = useRef(false);

  const requiredRoles = Array.isArray(role) ? role : [role];
  const hasRequiredRole = hasAnyRole(requiredRoles);

  // Show toast once when access is denied
  useEffect(() => {
    if (status === 'authenticated' && !hasRequiredRole && showToast && !hasShownToast.current) {
      hasShownToast.current = true;
      toast({
        title: "Access denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
    }
  }, [status, hasRequiredRole, showToast, toast]);

  // Show loading while auth is resolving
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AppLoading message="Verifying access..." variant="fullscreen" />
      </div>
    );
  }

  // If not authenticated, let RequireAuth handle it
  if (status === 'anonymous') {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Redirect if role not present
  if (!hasRequiredRole) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // Render protected content
  return <>{children}</>;
}
