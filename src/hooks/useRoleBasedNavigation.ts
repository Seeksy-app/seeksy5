/**
 * Role-Based Navigation Hook
 * 
 * Filters navigation items based on user permissions and roles.
 * Uses the RBAC system to determine which nav items to show.
 */

import { useMemo } from 'react';
import { useUserRoles } from './useUserRoles';
import { usePermissions, Permission, PermissionCategory } from './usePermissions';
import { NAVIGATION_CONFIG, NavigationGroup, NavigationItem, UserRole } from '@/config/navigation';

interface UseRoleBasedNavigationReturn {
  navigation: NavigationGroup[];
  canAccessPath: (path: string) => boolean;
  isLoading: boolean;
}

// Map paths to required permissions
const PATH_PERMISSION_MAP: Record<string, Permission | Permission[]> = {
  // Help Desk
  '/helpdesk': ['supportdesk.view', 'supportdesk.reply', 'supportdesk.manage'],
  '/helpdesk/tickets': ['supportdesk.view', 'supportdesk.reply'],
  '/helpdesk/settings': 'supportdesk.settings',
  
  // Studio
  '/studio': 'studio.access',
  '/studio/audio': 'studio.record',
  '/studio/video': 'studio.record',
  
  // Clips
  '/clips': ['clips.view', 'clips.edit'],
  
  // Media
  '/media': ['media.view', 'media.upload'],
  
  // Meetings
  '/meetings': ['meetings.view', 'meetings.manage'],
  
  // Ads
  '/ads': ['ads.view', 'ads.manage'],
  '/admin/advertising': ['ads.view', 'ads.manage'],
  '/admin/ad-campaigns': ['ads.view', 'ads.manage'],
  
  // R&D
  '/admin/rd-feeds': ['rnd.read', 'rnd.write'],
  '/admin/market-intelligence': 'rnd.read',
  
  // Admin
  '/admin': 'admin.users',
  '/admin/creators': 'admin.users',
  '/admin/permissions': 'admin.roles',
  '/admin/billing': 'billing.manage',
  
  // Settings
  '/settings': 'settings.view',
};

// Map roles to allowed paths (for items without specific permissions)
const ROLE_PATH_ACCESS: Record<UserRole, string[]> = {
  platform_owner: ['*'],
  super_admin: ['*'],
  admin: ['*'],
  support_admin: ['/helpdesk', '/admin/support', '/admin/creators'],
  support_agent: ['/helpdesk', '/admin/support'],
  team_manager: ['/dashboard', '/meetings', '/studio', '/media', '/clips'],
  creator: ['/dashboard', '/studio', '/media', '/clips', '/podcasts', '/meetings', '/monetization', '/profile'],
  advertiser: ['/advertiser', '/ads', '/campaigns', '/analytics'],
  board_member: ['/board'],
  influencer: ['/dashboard', '/studio', '/media', '/clips', '/social-analytics', '/monetization'],
  agency: ['/dashboard', '/agency', '/creators', '/campaigns'],
  subscriber: ['/dashboard', '/profile'],
  read_only_analyst: ['/board', '/admin/analytics', '/admin/rd-feeds'],
  cfo: ['/admin/financials', '/cfo-dashboard', '/admin/billing', '/admin/revenue', '/board'],
  cmo: ['/admin/marketing', '/admin/lead-magnets', '/admin/advertising', '/admin/cmo', '/admin/rd-feeds'],
  cco: ['/admin/content', '/admin/master-blog', '/admin/cco', '/admin/logo-manager', '/admin/hero-manager'],
  manager: ['/helpdesk', '/admin/billing', '/admin/crm', '/meetings'],
  ad_manager: ['/admin/seeksy-tv/advertising'],
};

export function useRoleBasedNavigation(): UseRoleBasedNavigationReturn {
  const { roles, isLoading: rolesLoading } = useUserRoles();
  const { permissions, hasPermission, hasAnyPermission, isLoading: permissionsLoading } = usePermissions();

  const isLoading = rolesLoading || permissionsLoading;

  // Check if user can access a specific path
  const canAccessPath = useMemo(() => {
    return (path: string): boolean => {
      if (isLoading) return false;
      
      // Super admin and platform owner have full access
      if (roles.includes('super_admin' as UserRole) || roles.includes('platform_owner' as UserRole)) {
        return true;
      }

      // Check permission-based access first
      const requiredPermissions = PATH_PERMISSION_MAP[path];
      if (requiredPermissions) {
        if (Array.isArray(requiredPermissions)) {
          return hasAnyPermission(requiredPermissions);
        }
        return hasPermission(requiredPermissions);
      }

      // Fall back to role-based access
      for (const role of roles) {
        const allowedPaths = ROLE_PATH_ACCESS[role as UserRole] || [];
        if (allowedPaths.includes('*')) return true;
        if (allowedPaths.some(allowed => path.startsWith(allowed))) return true;
      }

      return false;
    };
  }, [roles, permissions, isLoading, hasPermission, hasAnyPermission]);

  // Filter navigation based on roles and permissions
  const navigation = useMemo(() => {
    if (isLoading || roles.length === 0) return [];

    // Only show admin navigation to appropriate roles
    const adminRoles: UserRole[] = ['admin', 'super_admin', 'platform_owner', 'support_admin', 'support_agent'];
    const hasAdminAccess = roles.some(role => adminRoles.includes(role as UserRole));
    
    if (!hasAdminAccess) {
      return [];
    }

    return NAVIGATION_CONFIG.navigation
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          // Check role-based access
          const hasRoleAccess = item.roles.some(role => roles.includes(role as UserRole));
          if (!hasRoleAccess) return false;

          // Check permission-based access
          return canAccessPath(item.path);
        })
      }))
      .filter(group => group.items.length > 0);
  }, [roles, isLoading, canAccessPath]);

  return {
    navigation,
    canAccessPath,
    isLoading
  };
}

/**
 * Get navigation items for a specific portal
 */
export function getPortalNavigation(portal: 'admin' | 'creator' | 'advertiser' | 'board', roles: UserRole[]) {
  switch (portal) {
    case 'admin':
      return NAVIGATION_CONFIG.navigation;
    case 'board':
      return []; // Board has its own navigation
    case 'advertiser':
      return []; // Advertiser has its own navigation
    case 'creator':
      return []; // Creator has its own navigation
    default:
      return [];
  }
}
