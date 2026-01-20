import { User } from "@supabase/supabase-js";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { WorkspaceProvider, useWorkspace } from "@/contexts/WorkspaceContext";
import { usePortal } from "@/contexts/PortalContext";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
// GlobalTopNav removed - using TopNavBar for both Admin and Creator
import { RoleBasedSidebar } from "@/components/navigation/RoleBasedSidebar";
import { AdvertiserSidebarNav } from "@/components/advertiser/AdvertiserSidebarNav";
import { TopNavBar } from "@/components/TopNavBar";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAdminViewMode } from "@/hooks/useAdminViewMode";
import { AdminNotesFloatingButton } from "@/components/admin/notes/AdminNotesFloatingButton";
import { HelpDrawer } from "@/components/help/HelpDrawer";
import { AppLoading } from "@/components/ui/AppLoading";

interface WorkspaceLayoutProps {
  user: User | null;
  children: React.ReactNode;
  shouldShowSidebar: boolean;
  shouldShowTopNav: boolean;
}

// Routes that should use legacy navigation (Admin, Board, Advertiser)
const LEGACY_NAV_ROUTES = [
  '/admin',
  '/board',
  '/advertiser',
  '/cfo',
  '/helpdesk',
  '/admin/helpdesk',
  '/demo-videos',
];

// Check if current route should use legacy navigation
function useShouldUseLegacyNav() {
  const location = useLocation();
  const { portal } = usePortal();
  const { isAdmin, isBoardMember, isAdvertiser } = useUserRoles();
  
  // Check if on a legacy route
  const isLegacyRoute = LEGACY_NAV_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );
  
  // Use portal context as source of truth
  // If portal is 'creator', use workspace nav even for admins
  if (portal === 'creator') {
    return isLegacyRoute; // Only use legacy if actually on legacy route
  }
  
  // Also use legacy nav if user has admin/board/advertiser role
  return isLegacyRoute || portal === 'admin' || portal === 'board' || portal === 'advertiser';
}

// Hook to enforce role-based routing
function useRoleBasedRouting(user: User | null) {
  const location = useLocation();
  const navigate = useNavigate();
  const { portal } = usePortal();
  const { isAdmin, isBoardMember, isAdvertiser, isLoading } = useUserRoles();

  useEffect(() => {
    // Skip if no user or still loading roles
    if (!user || isLoading) return;
    
    // Skip for public routes, auth, onboarding
    const skipRoutes = ['/auth', '/onboarding', '/public', '/pricing', '/about', '/terms', '/privacy', '/apps-and-tools'];
    if (skipRoutes.some(r => location.pathname.startsWith(r))) return;

    // Portal context now handles view mode - if portal is not 'admin', respect that choice
    if (isAdmin && portal !== 'admin') {
      // Don't redirect - portal context has already determined the correct portal
      return;
    }

    // Admin users should be redirected to /admin if on creator routes (only if portal is 'admin')
    if (isAdmin && portal === 'admin') {
      const isCreatorRoute = !location.pathname.startsWith('/admin') && 
                             !location.pathname.startsWith('/board') && 
                             !location.pathname.startsWith('/cfo') &&
                             !location.pathname.startsWith('/advertiser');
      if (isCreatorRoute && !location.pathname.startsWith('/settings') && !location.pathname.startsWith('/signatures')) {
        if (import.meta.env.DEV) {
          console.log('[WorkspaceLayout] Admin on creator route, redirecting to /admin');
        }
        navigate('/admin', { replace: true });
      }
    }
    
    // Board members should be on /board
    if (isBoardMember && !isAdmin) {
      if (!location.pathname.startsWith('/board')) {
        if (import.meta.env.DEV) {
          console.log('[WorkspaceLayout] Board member redirecting to /board');
        }
        navigate('/board', { replace: true });
      }
    }
    
    // Advertisers should be on /advertiser
    if (isAdvertiser && !isAdmin && !isBoardMember) {
      if (!location.pathname.startsWith('/advertiser')) {
        if (import.meta.env.DEV) {
          console.log('[WorkspaceLayout] Advertiser redirecting to /advertiser');
        }
        navigate('/advertiser', { replace: true });
      }
    }
  }, [user, isAdmin, isBoardMember, isAdvertiser, isLoading, location.pathname, navigate, portal]);
}

function WorkspaceLayoutInner({ 
  user, 
  children, 
  shouldShowSidebar, 
  shouldShowTopNav 
}: WorkspaceLayoutProps) {
  const location = useLocation();
  const { workspaces, isLoading, currentWorkspace, refreshWorkspaces } = useWorkspace();
  const { portal } = usePortal();
  const useLegacyNav = useShouldUseLegacyNav();
  const isAdvertiserRoute = location.pathname.startsWith('/advertiser');
  const { isAdmin, isLoading: isRolesLoading } = useUserRoles();
  const [isInitializing, setIsInitializing] = useState(true);

  // Track initialization to prevent flash
  useEffect(() => {
    // Wait for both auth and workspace to be ready
    if (!isLoading && !isRolesLoading) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isRolesLoading]);

  // Enforce role-based routing
  useRoleBasedRouting(user);

  // When admin switches to creator portal, force refresh workspaces
  useEffect(() => {
    if (isAdmin && portal === 'creator' && workspaces.length === 0) {
      if (import.meta.env.DEV) {
        console.log('[WorkspaceLayout] Admin in creator portal, forcing workspace fetch');
      }
      refreshWorkspaces(true);
    }
  }, [isAdmin, portal, workspaces.length, refreshWorkspaces]);

  // Public routes that don't need workspace check
  const isPublicRoute = [
    '/',
    '/auth',
    '/pricing',
    '/about',
    '/terms',
    '/privacy',
    '/cookies',
    '/security',
    '/apps-and-tools',
    '/demo-videos',
    '/videos',
    '/blog',
    '/platform',
    '/yourbenefits-platform',
    '/yourbenefits',
  ].some(route => location.pathname === route || location.pathname.startsWith('/public') || location.pathname.startsWith('/videos') || location.pathname.startsWith('/blog') || location.pathname.startsWith('/yourbenefits'));

  // Onboarding route should render children ONLY - no nav, no sidebar
  const isOnboardingRoute = location.pathname.startsWith('/onboarding');
  if (isOnboardingRoute) {
    return <>{children}</>;
  }

  // Legal public signing pages should render standalone - no nav, no sidebar
  const isLegalPublicRoute = location.pathname.startsWith('/legal/purchaser') || location.pathname.startsWith('/legal/chairman');
  if (isLegalPublicRoute) {
    return <>{children}</>;
  }

  // Board routes have their own complete layout (BoardLayout) - skip WorkspaceLayout wrapper
  const isBoardRoute = location.pathname.startsWith('/board');
  if (isBoardRoute) {
    return <>{children}</>;
  }

  // Use legacy navigation for admin/advertiser routes OR admin users
  // Check if this is an admin route for floating button
  const isAdminRouteForNotes = location.pathname.startsWith('/admin') || 
                                location.pathname.startsWith('/cfo') ||
                                location.pathname.startsWith('/helpdesk');

  // Show branded loading state during initialization for authenticated users
  // This prevents the white flash during auth → app transition
  if (user && isInitializing && !isPublicRoute && !isOnboardingRoute) {
    return (
      <div className="h-screen flex w-full bg-background overflow-hidden">
        {/* Keep sidebar shell visible to prevent layout shift */}
        {shouldShowSidebar && (
          <div className="w-64 flex-shrink-0 bg-sidebar border-r border-border" />
        )}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {shouldShowTopNav && (
            <div className="h-14 border-b border-border bg-background" />
          )}
          <main className="flex-1 flex items-center justify-center bg-background">
            <AppLoading message="Loading your workspace..." variant="inline" />
          </main>
        </div>
      </div>
    );
  }

  if (useLegacyNav || isPublicRoute || !user) {
    return (
      <div className="h-screen flex w-full bg-background overflow-hidden">
        {shouldShowSidebar && (
          isAdvertiserRoute ? <AdvertiserSidebarNav /> : <RoleBasedSidebar user={user} />
        )}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {shouldShowTopNav && <TopNavBar />}
          <main className="flex-1 flex flex-col bg-background overflow-y-auto">
            {children}
          </main>
        </div>
        {isAdminRouteForNotes && <AdminNotesFloatingButton />}
        {/* Portal-scoped Help Drawer - opens without navigation */}
        <HelpDrawer />
      </div>
    );
  }

  // Use new workspace-based navigation for regular users (creators)
  // But use the same TopNavBar header for consistency
  return (
    <div className="min-h-screen flex w-full bg-background">
      {shouldShowSidebar && <WorkspaceSidebar />}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {shouldShowTopNav && <TopNavBar />}
        <main className="flex-1 flex flex-col bg-background overflow-auto">
          {children}
        </main>
      </div>
      {/* Portal-scoped Help Drawer - opens without navigation */}
      <HelpDrawer />
    </div>
  );
}

export function WorkspaceLayout(props: WorkspaceLayoutProps) {
  return (
    <WorkspaceProvider>
      <WorkspaceLayoutInner {...props} />
    </WorkspaceProvider>
  );
}
