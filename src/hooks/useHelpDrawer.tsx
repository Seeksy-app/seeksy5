/**
 * Portal-scoped Help Drawer state management
 * 
 * Content key mapping examples:
 * - admin:knowledge_hub → AdminKnowledgeHub content
 * - creator:knowledge_hub → CreatorKnowledgeHub content
 * - advertiser:help_center → AdvertiserHelpCenter content
 * - board:daily_brief → BoardDailyBrief content
 */

import { create } from 'zustand';
import { useLocation } from 'react-router-dom';
import { useAdminViewMode, ViewMode } from './useAdminViewMode';
import { useUserRoles } from './useUserRoles';

export type HelpActionKey = 
  | 'ai_assistant' 
  | 'knowledge_hub' 
  | 'daily_brief' 
  | 'glossary' 
  | 'help_center' 
  | 'contact_support';

export type PortalType = 'admin' | 'creator' | 'advertiser' | 'board';

interface HelpDrawerState {
  isOpen: boolean;
  activeActionKey: HelpActionKey | null;
  portal: PortalType | null;
  currentRoute: string | null;
  open: (actionKey: HelpActionKey, portal: PortalType, route: string) => void;
  close: () => void;
}

export const useHelpDrawerStore = create<HelpDrawerState>((set) => ({
  isOpen: false,
  activeActionKey: null,
  portal: null,
  currentRoute: null,
  open: (actionKey, portal, route) => set({ 
    isOpen: true, 
    activeActionKey: actionKey, 
    portal,
    currentRoute: route
  }),
  close: () => set({ 
    isOpen: false, 
    activeActionKey: null, 
    portal: null,
    currentRoute: null 
  }),
}));

/**
 * Determines the effective portal based on:
 * 1. Admin view mode (if admin is switching views)
 * 2. Current route path
 * 3. User roles as fallback
 */
export function useEffectivePortal(): PortalType {
  const location = useLocation();
  const { viewMode, canSwitch } = useAdminViewMode();
  const { isAdmin } = useUserRoles();
  
  // If admin can switch views, use their selected view mode
  if (isAdmin && canSwitch) {
    return viewMode;
  }
  
  // Otherwise, detect from current route
  const path = location.pathname;
  
  if (path.startsWith('/admin') || path.startsWith('/cfo') || path.startsWith('/helpdesk')) {
    return 'admin';
  }
  if (path.startsWith('/board')) {
    return 'board';
  }
  if (path.startsWith('/advertiser')) {
    return 'advertiser';
  }
  
  // Default to creator for all other routes
  return 'creator';
}

/**
 * Get the content key for portal-scoped help content
 * Format: ${portal}:${actionKey}
 */
export function getHelpContentKey(portal: PortalType, actionKey: HelpActionKey): string {
  return `${portal}:${actionKey}`;
}

/**
 * Centralized help menu action handler hook
 */
export function useHelpMenuActions() {
  const location = useLocation();
  const effectivePortal = useEffectivePortal();
  const { open, close } = useHelpDrawerStore();
  
  /**
   * Handle help menu action - opens the correct modal/drawer
   * with portal-scoped content
   */
  const handleHelpMenuAction = (actionKey: HelpActionKey) => {
    const currentRoute = location.pathname;
    
    // AI Assistant uses its own event-based system
    if (actionKey === 'ai_assistant') {
      document.dispatchEvent(new Event('open-spark-assistant'));
      return;
    }
    
    // Open the help drawer with portal context
    open(actionKey, effectivePortal, currentRoute);
  };
  
  return {
    handleHelpMenuAction,
    effectivePortal,
    closeHelpDrawer: close,
  };
}

/**
 * Portal display names for UI
 */
export const PORTAL_LABELS: Record<PortalType, string> = {
  admin: 'Admin',
  creator: 'Creator',
  advertiser: 'Advertiser',
  board: 'Board',
};

/**
 * Action display names for UI
 */
export const ACTION_LABELS: Record<HelpActionKey, string> = {
  ai_assistant: 'AI Assistant',
  knowledge_hub: 'Knowledge Hub',
  daily_brief: 'Daily Brief',
  glossary: 'Glossary',
  help_center: 'Help Center',
  contact_support: 'Contact Support',
};
