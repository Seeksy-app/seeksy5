/**
 * RBAC Permission System Hook
 * 
 * Provides permission checking for the entire Seeksy platform.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from './useUserRoles';

export type PermissionCategory = 
  | 'core' | 'studio' | 'clips' | 'media' | 'meetings' 
  | 'creatorhub' | 'ads' | 'supportdesk' | 'settings' 
  | 'billing' | 'rnd' | 'admin' | 'board' | 'events' | 'crm' | 'marketing'
  | 'podcasts' | 'monetization' | 'identity';

export type Permission =
  | 'core.read' | 'core.write'
  | 'studio.access' | 'studio.record' | 'studio.settings'
  | 'clips.view' | 'clips.edit' | 'clips.delete'
  | 'media.view' | 'media.upload' | 'media.delete'
  | 'meetings.view' | 'meetings.manage' | 'meetings.settings'
  | 'creatorhub.view' | 'creatorhub.manage'
  | 'ads.view' | 'ads.manage' | 'ads.billing' | 'ads.analytics'
  | 'supportdesk.view' | 'supportdesk.reply' | 'supportdesk.manage' | 'supportdesk.settings'
  | 'settings.view' | 'settings.manage'
  | 'billing.view' | 'billing.manage'
  | 'rnd.read' | 'rnd.write'
  | 'admin.users' | 'admin.roles' | 'admin.all' | 'admin.impersonate'
  | 'board.view' | 'board.analytics'
  | 'events.view' | 'events.manage'
  | 'crm.view' | 'crm.manage'
  | 'marketing.view' | 'marketing.manage'
  | 'podcasts.view' | 'podcasts.manage' | 'podcasts.publish'
  | 'monetization.view' | 'monetization.manage'
  | 'identity.view' | 'identity.manage' | 'identity.certify';

export interface UsePermissionsReturn {
  permissions: string[];
  isLoading: boolean;
  error: Error | null;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canAccessModule: (module: PermissionCategory) => boolean;
  logAccessDenied: (permission: Permission, resource?: string) => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const { roles } = useUserRoles();

  const { data: permissions = [], isLoading, error } = useQuery({
    queryKey: ['userPermissions', roles],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission')
        .in('role', roles);

      if (error) {
        console.error('[usePermissions] Error:', error);
        return [];
      }

      return [...new Set(data.map(p => p.permission))];
    },
    enabled: roles.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (checkPermissions: Permission[]): boolean => {
    return checkPermissions.some(p => permissions.includes(p));
  };

  const hasAllPermissions = (checkPermissions: Permission[]): boolean => {
    return checkPermissions.every(p => permissions.includes(p));
  };

  const canAccessModule = (module: PermissionCategory): boolean => {
    return permissions.some(p => p.startsWith(`${module}.`));
  };

  const logAccessDenied = async (permission: Permission, resource?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('access_denied_log').insert({
        user_id: user.id,
        attempted_permission: permission,
        attempted_resource: resource,
        denied_reason: 'Permission not granted'
      });
    } catch (err) {
      console.error('[usePermissions] Log error:', err);
    }
  };

  return {
    permissions,
    isLoading,
    error: error as Error | null,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessModule,
    logAccessDenied
  };
}
