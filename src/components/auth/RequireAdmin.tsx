/**
 * RequireAdmin - Route guard component for admin-only pages
 * 
 * Wraps page content and ensures user has admin role before rendering.
 * Shows loading state while checking auth, redirects non-admins to dashboard.
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserRoles } from '@/hooks/useUserRoles';
import { AppLoading } from '@/components/ui/AppLoading';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';

interface RequireAdminProps {
  children: ReactNode;
  /** Optional redirect path for non-admins (default: /dashboard) */
  redirectTo?: string;
}

export function RequireAdmin({ children, redirectTo = '/dashboard' }: RequireAdminProps) {
  const { isAdmin, isLoading } = useUserRoles();
  const location = useLocation();
  const { toast } = useToast();
  const hasShownToast = useRef(false);

  // Show toast once when access is denied
  useEffect(() => {
    if (!isLoading && !isAdmin && !hasShownToast.current) {
      hasShownToast.current = true;
      toast({
        title: "Admin access required",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
    }
  }, [isLoading, isAdmin, toast]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AppLoading message="Verifying access..." variant="fullscreen" />
      </div>
    );
  }

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // Render protected content
  return <>{children}</>;
}
