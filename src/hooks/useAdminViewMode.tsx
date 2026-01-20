/**
 * Session-only admin view mode switcher
 * Allows admins to quickly switch between viewing as Admin, Creator, Advertiser, or Board
 * Stored in sessionStorage - resets when browser closes
 */

/**
 * useAdminViewMode - Admin view mode switching hook
 * 
 * This hook now delegates to PortalContext as the single source of truth.
 * It provides backward-compatible API for existing AdminViewSwitcher usage.
 * 
 * MIGRATION: Components should eventually migrate to usePortal() directly.
 */

import { useCallback } from 'react';
import { usePortal, PortalMode } from '@/contexts/PortalContext';
import { useUserRoles } from './useUserRoles';

// Backward-compatible type alias
export type ViewMode = 'admin' | 'creator' | 'advertiser' | 'board';

export function useAdminViewMode() {
  const { isAdmin } = useUserRoles();
  const { portal, switchPortal, getPortalRoute } = usePortal();

  // Map portal to view mode (subset of portal modes that admins can switch to)
  const viewMode: ViewMode = (['admin', 'creator', 'advertiser', 'board'].includes(portal) 
    ? portal 
    : 'admin') as ViewMode;

  const setViewMode = useCallback((mode: ViewMode) => {
    // Delegate to portal context - this will trigger hard remount
    switchPortal(mode as PortalMode);
  }, [switchPortal]);

  const getRouteForMode = useCallback((mode: ViewMode): string => {
    return getPortalRoute(mode as PortalMode);
  }, [getPortalRoute]);

  return {
    viewMode,
    setViewMode,
    getRouteForMode,
    canSwitch: isAdmin,
  };
}
