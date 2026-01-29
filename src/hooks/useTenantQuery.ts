/**
 * useTenantQuery - Tenant-scoped query helper
 * 
 * Wraps useQuery to automatically include tenant filtering.
 * Use this for any queries on tenant-scoped tables.
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';

interface TenantQueryConfig {
  queryKey: string[];
  table: string;
  selectColumns?: string;
  filters?: Record<string, string | number | boolean>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  enabled?: boolean;
}

export function useTenantQuery<T = unknown[]>({
  queryKey,
  table,
  selectColumns = '*',
  filters = {},
  orderBy,
  limit,
  enabled = true,
}: TenantQueryConfig): UseQueryResult<T, Error> {
  const { activeTenantId, isPlatformAdmin } = useTenant();

  return useQuery<T, Error>({
    queryKey: ['tenant', activeTenantId, ...queryKey],
    queryFn: async () => {
      if (!activeTenantId && !isPlatformAdmin) {
        console.warn(`[useTenantQuery] No active tenant for query: ${queryKey.join('/')}`);
        return [] as unknown as T;
      }

      // Build query manually to avoid type recursion
      const baseQuery = (supabase as any).from(table).select(selectColumns);

      // We'll collect filter conditions
      let finalQuery = baseQuery;

      // Apply tenant filter
      if (activeTenantId) {
        finalQuery = finalQuery.eq('tenant_id' as never, activeTenantId as never);
      }

      // Apply additional filters
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          finalQuery = finalQuery.eq(key as never, value as never);
        }
      }

      // Apply ordering
      if (orderBy) {
        finalQuery = finalQuery.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      // Apply limit
      if (limit) {
        finalQuery = finalQuery.limit(limit);
      }

      const { data, error } = await finalQuery;

      if (error) {
        console.error(`[useTenantQuery] Query failed for ${table}:`, error);
        throw error;
      }

      return data as T;
    },
    enabled: enabled && (!!activeTenantId || isPlatformAdmin),
  });
}

/**
 * Helper to build tenant-scoped insert payload
 */
export function withTenantId<T extends Record<string, unknown>>(
  data: T,
  tenantId: string
): T & { tenant_id: string } {
  return {
    ...data,
    tenant_id: tenantId,
  };
}

/**
 * Helper hook for tenant-scoped mutations
 */
export function useTenantMutation() {
  const { activeTenantId, requireTenantId } = useTenant();

  return {
    // Get tenant ID for inserts (throws if not available)
    getTenantId: requireTenantId,
    
    // Current tenant ID (may be null)
    tenantId: activeTenantId,
    
    // Wrap data with tenant_id
    withTenant: <T extends Record<string, unknown>>(data: T) => {
      const tid = requireTenantId();
      return withTenantId(data, tid);
    },
  };
}
