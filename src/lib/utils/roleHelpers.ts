/**
 * Utility functions for role checking and management
 */

import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/config/navigation';

/**
 * Get all roles for the current user
 */
export async function getCurrentUserRoles(): Promise<UserRole[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }

  const roles = data.map(r => r.role as UserRole);
  
  // If user has super_admin, also include admin
  if (roles.includes('super_admin' as UserRole)) {
    roles.push('admin');
  }
  
  return roles;
}

/**
 * Check if current user has a specific role
 */
export async function userHasRole(role: UserRole): Promise<boolean> {
  const roles = await getCurrentUserRoles();
  return roles.includes(role);
}

/**
 * Check if current user has any of the specified roles
 */
export async function userHasAnyRole(checkRoles: UserRole[]): Promise<boolean> {
  const roles = await getCurrentUserRoles();
  return checkRoles.some(role => roles.includes(role));
}

/**
 * Add a role to a user (admin only)
 */
export async function addRoleToUser(userId: string, role: UserRole): Promise<boolean> {
  const result = await (supabase as any)
    .from('user_roles')
    .insert({
      user_id: userId,
      role: role
    });

  if (result.error) {
    console.error('Error adding role:', result.error);
    return false;
  }

  return true;
}

/**
 * Remove a role from a user (admin only)
 */
export async function removeRoleFromUser(userId: string, role: UserRole): Promise<boolean> {
  const result = await (supabase as any)
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', role as any);

  if (result.error) {
    console.error('Error removing role:', result.error);
    return false;
  }

  return true;
}
