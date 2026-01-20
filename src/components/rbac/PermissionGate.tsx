/**
 * Permission Gate Component
 * 
 * Conditionally renders children based on user permissions.
 * Shows access denied message or fallback when permission not granted.
 */

import { ReactNode } from 'react';
import { usePermissions, Permission } from '@/hooks/usePermissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface PermissionGateProps {
  permission: Permission | Permission[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  showDenied?: boolean;
  deniedMessage?: string;
}

export function PermissionGate({
  permission,
  requireAll = false,
  children,
  fallback = null,
  showDenied = false,
  deniedMessage = 'You do not have permission to view this content.'
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading, logAccessDenied } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions) 
    : hasAnyPermission(permissions);

  if (!hasAccess) {
    if (showDenied) {
      // Log access denied attempt
      permissions.forEach(p => logAccessDenied(p));
      
      return (
        <Alert variant="destructive" className="my-4">
          <ShieldX className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>{deniedMessage}</AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook version for programmatic permission checks
 */
export function usePermissionCheck(permission: Permission | Permission[], requireAll = false): boolean {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();
  
  if (isLoading) return false;
  
  const permissions = Array.isArray(permission) ? permission : [permission];
  return requireAll 
    ? hasAllPermissions(permissions) 
    : hasAnyPermission(permissions);
}
