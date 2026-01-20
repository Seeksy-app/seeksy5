/**
 * Role-Based Navigation Item
 * 
 * Only renders navigation items the user has permission to access.
 */

import { ReactNode } from 'react';
import { usePermissions, Permission } from '@/hooks/usePermissions';
import { useUserRoles } from '@/hooks/useUserRoles';
import { UserRole } from '@/config/navigation';

interface RoleBasedNavItemProps {
  children: ReactNode;
  requiredPermissions?: Permission | Permission[];
  requiredRoles?: UserRole[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export function RoleBasedNavItem({
  children,
  requiredPermissions,
  requiredRoles,
  requireAll = false,
  fallback = null
}: RoleBasedNavItemProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading: permLoading } = usePermissions();
  const { roles, hasRole, hasAnyRole, isLoading: roleLoading } = useUserRoles();

  if (permLoading || roleLoading) {
    return null;
  }

  let hasAccess = true;

  // Check role-based access
  if (requiredRoles && requiredRoles.length > 0) {
    hasAccess = requireAll 
      ? requiredRoles.every(role => hasRole(role))
      : hasAnyRole(requiredRoles);
    
    if (!hasAccess) return <>{fallback}</>;
  }

  // Check permission-based access
  if (requiredPermissions) {
    const perms = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    hasAccess = requireAll
      ? hasAllPermissions(perms)
      : hasAnyPermission(perms);
  }

  if (!hasAccess) return <>{fallback}</>;

  return <>{children}</>;
}

/**
 * Hook version for programmatic checks
 */
export function useNavItemAccess(
  requiredPermissions?: Permission | Permission[],
  requiredRoles?: UserRole[],
  requireAll = false
): boolean {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading: permLoading } = usePermissions();
  const { hasRole, hasAnyRole, isLoading: roleLoading } = useUserRoles();

  if (permLoading || roleLoading) return false;

  let hasAccess = true;

  // Check role-based access
  if (requiredRoles && requiredRoles.length > 0) {
    hasAccess = requireAll 
      ? requiredRoles.every(role => hasRole(role))
      : hasAnyRole(requiredRoles);
    
    if (!hasAccess) return false;
  }

  // Check permission-based access
  if (requiredPermissions) {
    const perms = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    hasAccess = requireAll
      ? hasAllPermissions(perms)
      : hasAnyPermission(perms);
  }

  return hasAccess;
}
