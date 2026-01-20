/**
 * AuthContext - Single source of truth for authentication
 * 
 * This is the ONLY place that:
 * 1. Calls supabase.auth.getSession() and onAuthStateChange()
 * 2. Fetches the user's profile and roles
 * 3. Makes redirect decisions
 * 
 * All other components/hooks read from this context.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Auth status for clear decision making
export type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

// User role from user_roles table
export type UserRole = 
  | 'admin' 
  | 'super_admin' 
  | 'creator' 
  | 'advertiser' 
  | 'influencer' 
  | 'agency' 
  | 'subscriber'
  | 'board_member'
  | 'board_admin';

// Profile data from profiles table
export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  account_type: string | null;
  active_account_type: string | null;
  account_types_enabled: string[];
  onboarding_completed: boolean;
  preferred_role: string | null;
  is_creator: boolean;
  is_advertiser: boolean;
}

interface AuthContextType {
  // Core state
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  roles: UserRole[];
  
  // Backward compatibility
  loading: boolean;
  
  // Derived booleans for convenience
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCreator: boolean;
  isAdvertiser: boolean;
  isBoardMember: boolean;
  onboardingCompleted: boolean;
  
  // Role checking
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  
  // Actions
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);

  // Fetch profile and roles for a user
  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch profile and roles in parallel
      const [profileResult, rolesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url, account_type, active_account_type, account_types_enabled, onboarding_completed, preferred_role, is_creator, is_advertiser')
          .eq('id', userId)
          .single(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
      ]);

      if (profileResult.data) {
        setProfile(profileResult.data as UserProfile);
      }

      if (rolesResult.data) {
        const userRoles = rolesResult.data.map(r => r.role as UserRole);
        // If user has super_admin, also include admin for convenience
        if (userRoles.includes('super_admin')) {
          userRoles.push('admin');
        }
        setRoles(userRoles);
      }
    } catch (err) {
      console.error('[AuthContext] Error fetching user data:', err);
    }
  }, []);

  // Refresh profile data (for use after onboarding, etc.)
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  }, [user, fetchUserData]);

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setStatus('anonymous');
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST (per Supabase best practices)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        // Synchronous state updates only in callback
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          setStatus('authenticated');
          // Defer data fetch to avoid deadlock
          setTimeout(() => {
            fetchUserData(newSession.user.id);
          }, 0);
        } else {
          setStatus('anonymous');
          setProfile(null);
          setRoles([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        setStatus('authenticated');
        fetchUserData(existingSession.user.id);
      } else {
        setStatus('anonymous');
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  // Derived values
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  const isSuperAdmin = roles.includes('super_admin');
  const isCreator = roles.includes('creator') || profile?.is_creator === true;
  const isAdvertiser = roles.includes('advertiser') || profile?.is_advertiser === true;
  const isBoardMember = roles.includes('board_member') || roles.includes('board_admin');
  const onboardingCompleted = profile?.onboarding_completed ?? false;

  const hasRole = useCallback((role: UserRole) => roles.includes(role), [roles]);
  const hasAnyRole = useCallback((checkRoles: UserRole[]) => 
    checkRoles.some(role => roles.includes(role)), [roles]);

  const value: AuthContextType = {
    status,
    user,
    session,
    profile,
    roles,
    loading: status === 'loading',
    isAdmin,
    isSuperAdmin,
    isCreator,
    isAdvertiser,
    isBoardMember,
    onboardingCompleted,
    hasRole,
    hasAnyRole,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During initial render before AuthProvider mounts, return safe defaults
    // This prevents crashes during React's initial tree construction
    console.warn('[useAuth] Called outside AuthProvider - returning loading state');
    return {
      status: 'loading' as AuthStatus,
      user: null,
      session: null,
      profile: null,
      roles: [],
      loading: true,
      isAdmin: false,
      isSuperAdmin: false,
      isCreator: false,
      isAdvertiser: false,
      isBoardMember: false,
      onboardingCompleted: false,
      hasRole: () => false,
      hasAnyRole: () => false,
      signOut: async () => {},
      refreshProfile: async () => {},
    } as AuthContextType;
  }
  return context;
}
