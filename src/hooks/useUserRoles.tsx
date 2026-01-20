/**
 * Hook to fetch and manage user roles from the database
 * 
 * This replaces the old RoleContext dual-role system with a proper
 * multi-role system where users can have multiple roles simultaneously.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/config/navigation';
import { attemptBootRecovery, isAuthError, shouldAttemptRecovery } from '@/utils/bootRecovery';

interface UseUserRolesReturn {
  roles: UserRole[];
  isLoading: boolean;
  error: Error | null;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAdmin: boolean;
  isCreator: boolean;
  isAdvertiser: boolean;
  isInfluencer: boolean;
  isAgency: boolean;
  isSubscriber: boolean;
  isBoardMember: boolean;
  isBoardAdmin: boolean;
}

export function useUserRoles(): UseUserRolesReturn {
  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ['userRoles'],
    queryFn: async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('[useUserRoles] Auth error:', authError);
          if (isAuthError(authError) && shouldAttemptRecovery()) {
            attemptBootRecovery();
          }
          return [];
        }
        
        if (!user) return [];

        const { data, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (rolesError) {
          console.error('[useUserRoles] Roles fetch error:', rolesError);
          if (isAuthError(rolesError) && shouldAttemptRecovery()) {
            attemptBootRecovery();
          }
          return [];
        }
        
        // Map database roles to UserRole type and include super_admin as admin
        const userRoles = data.map(r => r.role as UserRole);
        
        // If user has super_admin, also include admin for convenience
        if (userRoles.includes('super_admin' as UserRole)) {
          userRoles.push('admin');
        }
        
        return userRoles;
      } catch (err) {
        console.error('[useUserRoles] Unexpected error:', err);
        if (isAuthError(err) && shouldAttemptRecovery()) {
          attemptBootRecovery();
        }
        return [];
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (checkRoles: UserRole[]): boolean => {
    return checkRoles.some(role => roles.includes(role));
  };

  return {
    roles,
    isLoading,
    error: error as Error | null,
    hasRole,
    hasAnyRole,
    isAdmin: roles.includes('admin') || roles.includes('super_admin' as UserRole),
    isCreator: roles.includes('creator'),
    isAdvertiser: roles.includes('advertiser'),
    isInfluencer: roles.includes('influencer'),
    isAgency: roles.includes('agency'),
    isSubscriber: roles.includes('subscriber'),
    isBoardMember: roles.includes('board_member' as UserRole),
    isBoardAdmin: roles.includes('board_admin' as UserRole),
  };
}
