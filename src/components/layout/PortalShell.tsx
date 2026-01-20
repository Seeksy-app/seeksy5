/**
 * PortalShell - Hard-remounting portal layout wrapper
 * 
 * This component uses key={portal} to force React to completely
 * unmount and remount the layout when the portal changes.
 * 
 * This ensures:
 * - No sidebar/header/nav state persists across portals
 * - All portal-specific providers reset
 * - Clean slate for each portal experience
 */

import React, { Suspense } from 'react';
import { usePortal, PortalMode } from '@/contexts/PortalContext';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { Skeleton } from '@/components/ui/skeleton';

// Debug badge component (dev only)
function PortalDebugBadge({ portal }: { portal: PortalMode }) {
  if (!import.meta.env.DEV) return null;
  
  const colors: Record<PortalMode, string> = {
    admin: 'bg-red-500',
    creator: 'bg-blue-500',
    board: 'bg-purple-500',
    advertiser: 'bg-green-500',
    subscriber: 'bg-orange-500',
    public: 'bg-gray-500',
  };
  
  return (
    <div 
      className={`fixed bottom-4 left-4 z-[9999] px-3 py-1.5 rounded-full text-white text-xs font-mono ${colors[portal]} opacity-80 pointer-events-none`}
    >
      Portal: {portal.toUpperCase()}
    </div>
  );
}

// Loading fallback
function PortalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="space-y-4 w-full max-w-md p-8">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

// Portal-specific layout wrappers
// These are intentionally separate components so React fully unmounts them on portal change

function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <TenantProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          {children}
        </div>
      </SidebarProvider>
    </TenantProvider>
  );
}

function CreatorPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <TenantProvider>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            {children}
          </div>
        </SidebarProvider>
      </TenantProvider>
    </WorkspaceProvider>
  );
}

function BoardPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <TenantProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          {children}
        </div>
      </SidebarProvider>
    </TenantProvider>
  );
}

function AdvertiserPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <TenantProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          {children}
        </div>
      </SidebarProvider>
    </TenantProvider>
  );
}

function SubscriberPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}

function PublicPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}

// Main PortalShell component
export function PortalShell() {
  const { portal } = usePortal();
  
  // Select the appropriate layout based on portal
  const PortalLayout = React.useMemo(() => {
    switch (portal) {
      case 'admin':
        return AdminPortalLayout;
      case 'creator':
        return CreatorPortalLayout;
      case 'board':
        return BoardPortalLayout;
      case 'advertiser':
        return AdvertiserPortalLayout;
      case 'subscriber':
        return SubscriberPortalLayout;
      case 'public':
      default:
        return PublicPortalLayout;
    }
  }, [portal]);

  return (
    <>
      {/* 
        KEY PROP: This is the critical piece!
        When portal changes, React sees a different key and completely
        unmounts the old tree and mounts a new one.
      */}
      <div key={`portal-shell-${portal}`}>
        <Suspense fallback={<PortalLoading />}>
          <PortalLayout>
            <Outlet />
          </PortalLayout>
        </Suspense>
      </div>
      
      <PortalDebugBadge portal={portal} />
    </>
  );
}

// Export for use in route configuration
export function PortalShellWrapper({ children }: { children?: React.ReactNode }) {
  const { portal } = usePortal();
  
  const PortalLayout = React.useMemo(() => {
    switch (portal) {
      case 'admin':
        return AdminPortalLayout;
      case 'creator':
        return CreatorPortalLayout;
      case 'board':
        return BoardPortalLayout;
      case 'advertiser':
        return AdvertiserPortalLayout;
      case 'subscriber':
        return SubscriberPortalLayout;
      case 'public':
      default:
        return PublicPortalLayout;
    }
  }, [portal]);

  return (
    <>
      <div key={`portal-shell-${portal}`}>
        <Suspense fallback={<PortalLoading />}>
          <PortalLayout>
            {children}
          </PortalLayout>
        </Suspense>
      </div>
      
      <PortalDebugBadge portal={portal} />
    </>
  );
}
