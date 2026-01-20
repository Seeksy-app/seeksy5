/**
 * TenantContext - Multi-tenant foundation for portal isolation
 * 
 * This context provides:
 * - activeTenantId: The current tenant scope for all data operations
 * - tenants: All tenants the user has access to
 * - switchTenant: Function to change active tenant
 * 
 * All shared-table queries MUST use activeTenantId for filtering.
 * All inserts MUST include tenant_id derived from activeTenantId.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type TenantType = 'seeksy_platform' | 'creator' | 'advertiser' | 'board' | 'subscriber';
export type TenantRole = 'viewer' | 'editor' | 'admin';

export interface Tenant {
  id: string;
  tenant_type: TenantType;
  name: string;
  slug: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface TenantMembership {
  id: string;
  tenant_id: string;
  user_id: string;
  role: TenantRole;
  is_default: boolean;
  tenant: Tenant;
}

interface TenantContextValue {
  // Core state
  activeTenantId: string | null;
  activeTenant: Tenant | null;
  tenants: Tenant[];
  memberships: TenantMembership[];
  
  // Loading states
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  switchTenant: (tenantId: string) => void;
  
  // Helper checks
  isPlatformAdmin: boolean;
  hasRole: (role: TenantRole) => boolean;
  getTenantsByType: (type: TenantType) => Tenant[];
  
  // For queries - ensures tenant scope
  requireTenantId: () => string;
}

const TenantContext = createContext<TenantContextValue | null>(null);

const ACTIVE_TENANT_KEY = 'seeksy_active_tenant_id';

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [activeTenantId, setActiveTenantId] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_TENANT_KEY);
  });

  // Fetch user's tenant memberships with tenant details
  const { data: memberships = [], isLoading, error } = useQuery({
    queryKey: ['tenant-memberships'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('tenant_memberships')
        .select(`
          id,
          tenant_id,
          user_id,
          role,
          is_default,
          tenant:tenants (
            id,
            tenant_type,
            name,
            slug,
            metadata,
            is_active,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('[TenantContext] Failed to fetch memberships:', error);
        throw error;
      }

      // Transform the data to match our interface
      return (data || []).map((m: any) => ({
        id: m.id,
        tenant_id: m.tenant_id,
        user_id: m.user_id,
        role: m.role as TenantRole,
        is_default: m.is_default,
        tenant: m.tenant as Tenant,
      })) as TenantMembership[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Extract tenants from memberships
  const tenants = memberships.map(m => m.tenant).filter(Boolean);

  // Auto-select default tenant if none selected
  useEffect(() => {
    if (!isLoading && memberships.length > 0 && !activeTenantId) {
      // Find default tenant
      const defaultMembership = memberships.find(m => m.is_default);
      if (defaultMembership) {
        setActiveTenantId(defaultMembership.tenant_id);
        localStorage.setItem(ACTIVE_TENANT_KEY, defaultMembership.tenant_id);
      } else if (memberships[0]) {
        // Fallback to first tenant
        setActiveTenantId(memberships[0].tenant_id);
        localStorage.setItem(ACTIVE_TENANT_KEY, memberships[0].tenant_id);
      }
    }
  }, [isLoading, memberships, activeTenantId]);

  // Get active tenant object
  const activeTenant = tenants.find(t => t.id === activeTenantId) || null;

  // Get current membership for active tenant
  const activeMembership = memberships.find(m => m.tenant_id === activeTenantId);

  // Check if user is platform admin
  const isPlatformAdmin = memberships.some(
    m => m.tenant.tenant_type === 'seeksy_platform' && m.role === 'admin'
  );

  // Switch tenant
  const switchTenant = useCallback((tenantId: string) => {
    const membership = memberships.find(m => m.tenant_id === tenantId);
    if (membership) {
      setActiveTenantId(tenantId);
      localStorage.setItem(ACTIVE_TENANT_KEY, tenantId);
      // Invalidate tenant-scoped queries
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey;
        // Invalidate queries that include tenant scope
        return Array.isArray(key) && key.some(k => 
          typeof k === 'string' && (
            k.includes('tenant') || 
            k.includes('subscriber') || 
            k.includes('campaign') || 
            k.includes('list')
          )
        );
      }});
    }
  }, [memberships, queryClient]);

  // Check if user has at least the given role in active tenant
  const hasRole = useCallback((minRole: TenantRole): boolean => {
    if (!activeMembership) return false;
    const roleHierarchy: TenantRole[] = ['viewer', 'editor', 'admin'];
    const userRoleIndex = roleHierarchy.indexOf(activeMembership.role);
    const requiredRoleIndex = roleHierarchy.indexOf(minRole);
    return userRoleIndex >= requiredRoleIndex;
  }, [activeMembership]);

  // Get tenants by type
  const getTenantsByType = useCallback((type: TenantType): Tenant[] => {
    return tenants.filter(t => t.tenant_type === type);
  }, [tenants]);

  // Require tenant ID - throws if not available
  const requireTenantId = useCallback((): string => {
    if (!activeTenantId) {
      throw new Error('[TenantContext] No active tenant. User must select a tenant before performing this operation.');
    }
    return activeTenantId;
  }, [activeTenantId]);

  const value: TenantContextValue = {
    activeTenantId,
    activeTenant,
    tenants,
    memberships,
    isLoading,
    error: error as Error | null,
    switchTenant,
    isPlatformAdmin,
    hasRole,
    getTenantsByType,
    requireTenantId,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

// Hook for enforcing tenant scope in queries
export function useTenantScope() {
  const { activeTenantId, requireTenantId, isPlatformAdmin } = useTenant();
  
  return {
    // For SELECT queries - filter by tenant
    tenantFilter: activeTenantId,
    
    // For INSERT/UPDATE - include tenant_id
    tenantId: requireTenantId,
    
    // Platform admins can optionally bypass tenant filter
    canBypassTenantFilter: isPlatformAdmin,
  };
}
