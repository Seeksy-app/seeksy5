/**
 * RoleContext - Legacy compatibility layer
 * 
 * This context now delegates to AuthContext for auth state.
 * Kept for backward compatibility with components using useRole().
 */

import React, { createContext, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Updated to support all role types
export type UserRole = 'creator' | 'advertiser' | 'subscriber' | 'influencer' | 'agency' | 'admin' | 'super_admin' | 'ad_manager';

interface RoleContextType {
  currentRole: UserRole | null;
  availableRoles: UserRole[];
  isLoading: boolean;
  hasMultipleRoles: boolean;
  switchRole: (role: UserRole) => Promise<void>;
  enableRole: (role: UserRole) => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { status, roles, isAdmin, isCreator, isAdvertiser, profile, refreshProfile } = useAuth();
  
  // Map AuthContext roles to legacy format
  const availableRoles: UserRole[] = [];
  if (isAdmin) availableRoles.push('admin');
  if (isCreator || profile?.is_creator) availableRoles.push('creator');
  if (isAdvertiser || profile?.is_advertiser) availableRoles.push('advertiser');
  
  // Include all roles from AuthContext
  roles.forEach(role => {
    if (!availableRoles.includes(role as UserRole)) {
      availableRoles.push(role as UserRole);
    }
  });

  const hasMultipleRoles = availableRoles.length > 1;
  
  // Current role - prioritize admin, then first available
  const currentRole: UserRole | null = isAdmin ? 'admin' : availableRoles[0] ?? null;

  // Legacy switchRole - now just refreshes and navigates
  const switchRole = async (role: UserRole) => {
    if (role === 'creator') {
      window.location.href = '/my-day';
    } else if (role === 'advertiser') {
      window.location.href = '/advertiser';
    } else if (role === 'admin') {
      window.location.href = '/admin';
    }
  };

  // Legacy enableRole - kept for compatibility
  const enableRole = async (role: UserRole) => {
    // Would need to update profile - for now just refresh
    await refreshProfile();
  };

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        availableRoles,
        isLoading: status === 'loading',
        hasMultipleRoles,
        switchRole,
        enableRole,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
