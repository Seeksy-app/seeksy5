import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'seeksy-admin-sidebar-v1';

interface SidebarState {
  openGroups: Record<string, boolean>;
}

// Map of route prefixes to their parent group names
const ROUTE_TO_GROUP: Record<string, string> = {
  '/admin/users': 'User Management',
  '/admin/identity': 'User Management',
  '/admin/permissions': 'User Management',
  '/admin/advertising': 'Advertising and Sales',
  '/admin/rate-desk': 'Advertising and Sales',
  '/admin/ad-campaigns': 'Advertising and Sales',
  '/admin/ad-analytics': 'Advertising and Sales',
  '/admin/revenue': 'Advertising and Sales',
  '/admin/financial-models': 'Advertising and Sales',
  '/admin/cfo-models': 'Advertising and Sales',
  '/admin/sales-leads': 'Advertising and Sales',
  '/admin/support': 'Business Operations',
  '/admin/site-leads': 'Business Operations',
  '/admin/billing': 'Business Operations',
  '/admin/payments': 'Business Operations',
  '/admin/investor': 'Business Operations',
  '/admin/marketing-gtm': 'Business Operations',
  '/admin/business-tools': 'Business Tools',
  '/admin/gtm': 'Business Tools',
  '/admin/proposal': 'Business Tools',
  '/admin/rd-intelligence': 'R&D & Intelligence',
  '/admin/cfo-assumptions': 'R&D & Intelligence',
  '/admin/market-intelligence': 'R&D & Intelligence',
  '/admin/api-keys': 'Developer Tools',
  '/admin/webhooks': 'Developer Tools',
  '/admin/logs': 'Developer Tools',
  '/admin/help': 'Support',
  '/admin/contact': 'Support',
  // Email Suite routes - map to Marketing group
  '/admin/email': 'Marketing',
  '/admin/email-client': 'Marketing',
  '/admin/signatures': 'Marketing',
};

const DEFAULT_STATE: SidebarState = {
  openGroups: {
    "Email Suite": false,
    "Email": false,
    "Marketing": false,
    "Media": false,
    "User Management": false,
    "Advertising and Sales": false,
    "Business Operations": false,
    "Business Tools": false,
    "R&D & Intelligence": false,
    "Content Management": false,
    "Developer Tools": false,
    "Support": false,
    "Admin Legal": false,
    "Project Management": false,
    "Financials (CFO)": false,
  }
};

function getGroupForPath(pathname: string): string | null {
  // Find the most specific matching route prefix
  const matchingPrefixes = Object.keys(ROUTE_TO_GROUP)
    .filter(prefix => pathname.startsWith(prefix))
    .sort((a, b) => b.length - a.length);
  
  return matchingPrefixes.length > 0 ? ROUTE_TO_GROUP[matchingPrefixes[0]] : null;
}

function loadState(): SidebarState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        openGroups: { ...DEFAULT_STATE.openGroups, ...parsed.openGroups }
      };
    }
  } catch (e) {
    console.warn('Failed to load sidebar state:', e);
  }
  return DEFAULT_STATE;
}

function saveState(state: SidebarState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save sidebar state:', e);
  }
}

export function useSidebarState() {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const saved = loadState();
    return saved.openGroups;
  });

  // Persist state changes
  useEffect(() => {
    saveState({ openGroups });
  }, [openGroups]);

  const toggleGroup = useCallback((groupName: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  }, []);

  const isGroupOpen = useCallback((groupName: string): boolean => {
    return openGroups[groupName] ?? false;
  }, [openGroups]);

  return {
    openGroups,
    toggleGroup,
    isGroupOpen,
  };
}
