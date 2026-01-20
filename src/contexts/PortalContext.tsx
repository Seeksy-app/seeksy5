/**
 * PortalContext - SINGLE SOURCE OF TRUTH for portal mode
 * 
 * This context controls which portal the user is currently viewing:
 * - admin: Platform administration
 * - creator: Creator workspace
 * - board: Board member portal
 * - advertiser: Advertiser dashboard
 * - subscriber: Subscriber preferences
 * - public: Public-facing pages (no auth required)
 * 
 * RULES:
 * 1. Portal is derived from route prefix OR explicit user selection
 * 2. On portal switch, the entire app shell remounts (PortalShell uses key={portal})
 * 3. No portal-specific state should persist across portal switches
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { trackPortalChanged, trackEvent } from '@/utils/gtm';
import { supabase } from '@/integrations/supabase/client';

export type PortalMode = 'admin' | 'creator' | 'board' | 'advertiser' | 'subscriber' | 'public';

interface PortalContextValue {
  portal: PortalMode;
  previousPortal: PortalMode | null;
  setPortal: (portal: PortalMode, navigate?: boolean) => void;
  switchPortal: (portal: PortalMode) => void;
  getPortalRoute: (portal: PortalMode) => string;
  isPortalRoute: (portal: PortalMode) => boolean;
}

const PortalContext = createContext<PortalContextValue | null>(null);

const PORTAL_STORAGE_KEY = 'seeksy_portal_mode';

// Map route prefixes to portals
const ROUTE_PORTAL_MAP: Record<string, PortalMode> = {
  '/admin': 'admin',
  '/cfo': 'admin',
  '/board': 'board',
  '/advertiser': 'advertiser',
  '/creator': 'creator',
  '/dashboard': 'creator',
  '/my-day': 'creator',
  '/studio': 'creator',
  '/podcasts': 'creator',
  '/meetings': 'creator',
  '/contacts': 'creator',
  '/crm': 'creator',
  '/events': 'creator',
  '/awards': 'creator',
  '/settings': 'creator',
  '/email-settings': 'creator',
  '/apps': 'creator', // App store is creator context
  '/clips': 'creator',
  '/voice-cloning': 'creator',
  '/media': 'creator',
  '/campaigns': 'creator',
  '/email': 'creator',
  '/newsletters': 'creator',
  '/automations': 'creator',
  '/forms': 'creator',
  '/polls': 'creator',
  '/deals': 'creator',
  '/proposals': 'creator',
  '/projects': 'creator',
  '/tasks': 'creator',
  '/creator-hub': 'creator',
  '/subscriber': 'subscriber',
  '/s/': 'subscriber',
};

// Portal landing routes
const PORTAL_ROUTES: Record<PortalMode, string> = {
  admin: '/admin',
  creator: '/my-day',
  board: '/board',
  advertiser: '/advertiser',
  subscriber: '/subscriber/preferences',
  public: '/',
};

// Public routes that don't require portal context
const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/pricing',
  '/about',
  '/terms',
  '/privacy',
  '/cookies',
  '/security',
  '/apps-and-tools',
  '/blog',
  '/public',
  '/videos',
  '/tv',
  '/invest',
  '/onboarding',
  '/trucking',
  '/campaign-staff',
  '/veterans',
  '/venue',
];

function derivePortalFromPath(pathname: string): PortalMode {
  // Check public routes first
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return 'public';
  }
  
  // Check route prefix map - ROUTE ALWAYS WINS
  for (const [prefix, portal] of Object.entries(ROUTE_PORTAL_MAP)) {
    if (pathname.startsWith(prefix)) {
      return portal;
    }
  }
  
  // For unmatched authenticated routes, derive from the path structure
  // This prevents /apps or other generic routes from defaulting to stale stored portal
  return 'creator';
}

// Helper to clear all portal-related storage
export function clearPortalStorage() {
  sessionStorage.removeItem(PORTAL_STORAGE_KEY);
  localStorage.removeItem('currentWorkspaceId');
  if (import.meta.env.DEV) {
    console.log('[PortalContext] Portal storage cleared');
  }
}

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Derive initial portal from current route - ROUTE TAKES PRECEDENCE
  const [portal, setPortalState] = useState<PortalMode>(() => {
    const routePortal = derivePortalFromPath(window.location.pathname);
    
    // Route ALWAYS takes precedence for non-public routes
    if (routePortal !== 'public') {
      sessionStorage.setItem(PORTAL_STORAGE_KEY, routePortal);
      return routePortal;
    }
    
    // Only use stored value for public routes (homepage, blog, etc.)
    const stored = sessionStorage.getItem(PORTAL_STORAGE_KEY) as PortalMode | null;
    return stored || routePortal;
  });
  
  const [previousPortal, setPreviousPortal] = useState<PortalMode | null>(null);

  // Listen for auth state changes - clear portal on logout
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        if (import.meta.env.DEV) {
          console.log('[PortalContext] User signed out, clearing portal state');
        }
        clearPortalStorage();
        setPortalState('public');
        setPreviousPortal(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync portal with route changes - ROUTE ALWAYS WINS
  useEffect(() => {
    const routePortal = derivePortalFromPath(location.pathname);
    
    // For non-public routes, route ALWAYS determines portal
    if (routePortal !== 'public') {
      if (routePortal !== portal) {
        if (import.meta.env.DEV) {
          console.log(`[PortalContext] Route change detected: ${portal} -> ${routePortal} (path: ${location.pathname})`);
        }
        
        // Track mismatch for debugging
        if (portal !== 'public' && portal !== routePortal) {
          trackEvent('portal_route_mismatch', { 
            expected_portal: routePortal, 
            actual_portal: portal, 
            pathname: location.pathname 
          });
        }
        
        setPreviousPortal(portal);
        setPortalState(routePortal);
        sessionStorage.setItem(PORTAL_STORAGE_KEY, routePortal);
      }
    }
  }, [location.pathname, portal]);

  // Track portal changes for GTM analytics + clear caches
  const hasTrackedInitialPortal = useRef(false);
  
  useEffect(() => {
    // Fire GTM event on portal change (not on initial mount unless switching)
    if (previousPortal && previousPortal !== portal) {
      trackPortalChanged(portal, previousPortal);
      
      if (import.meta.env.DEV) {
        console.log(`[PortalContext] Portal switched: ${previousPortal} -> ${portal}. Clearing caches.`);
      }
      
      // Invalidate queries that might be portal-specific
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          // Invalidate workspace, dashboard, and portal-specific queries
          return Array.isArray(key) && key.some(k => 
            typeof k === 'string' && (
              k.includes('workspace') ||
              k.includes('dashboard') ||
              k.includes('sidebar') ||
              k.includes('nav') ||
              k.includes('menu')
            )
          );
        }
      });
      
      // Clear any localStorage items that are portal-specific
      localStorage.removeItem('currentWorkspaceId');
    }
  }, [portal, previousPortal, queryClient]);

  const setPortal = useCallback((newPortal: PortalMode, shouldNavigate = false) => {
    if (newPortal === portal) return;
    
    if (import.meta.env.DEV) {
      console.log(`[PortalContext] setPortal called: ${portal} -> ${newPortal}`);
    }
    
    setPreviousPortal(portal);
    setPortalState(newPortal);
    sessionStorage.setItem(PORTAL_STORAGE_KEY, newPortal);
    
    if (shouldNavigate) {
      navigate(PORTAL_ROUTES[newPortal]);
    }
  }, [portal, navigate]);

  const switchPortal = useCallback((newPortal: PortalMode) => {
    if (newPortal === portal) return;
    
    if (import.meta.env.DEV) {
      console.log(`[PortalContext] switchPortal: ${portal} -> ${newPortal}`);
    }
    
    setPreviousPortal(portal);
    setPortalState(newPortal);
    sessionStorage.setItem(PORTAL_STORAGE_KEY, newPortal);
    
    // Always navigate on explicit switch
    navigate(PORTAL_ROUTES[newPortal]);
  }, [portal, navigate]);

  const getPortalRoute = useCallback((targetPortal: PortalMode): string => {
    return PORTAL_ROUTES[targetPortal];
  }, []);

  const isPortalRoute = useCallback((targetPortal: PortalMode): boolean => {
    return portal === targetPortal;
  }, [portal]);

  const value = useMemo<PortalContextValue>(() => ({
    portal,
    previousPortal,
    setPortal,
    switchPortal,
    getPortalRoute,
    isPortalRoute,
  }), [portal, previousPortal, setPortal, switchPortal, getPortalRoute, isPortalRoute]);

  return (
    <PortalContext.Provider value={value}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal(): PortalContextValue {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
}

// Hook for components that need to know if they're in a specific portal
export function useIsPortal(targetPortal: PortalMode): boolean {
  const { portal } = usePortal();
  return portal === targetPortal;
}

// Hook for debugging - shows portal in dev mode
export function usePortalDebug() {
  const { portal, previousPortal } = usePortal();
  const location = useLocation();
  
  return {
    currentPortal: portal,
    previousPortal,
    currentPath: location.pathname,
    derivedPortal: derivePortalFromPath(location.pathname),
  };
}
