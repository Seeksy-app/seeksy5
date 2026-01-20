/**
 * OnboardingGuard - Simplified guard that uses AuthContext
 * 
 * This is now a thin wrapper that delegates to the centralized auth system.
 * The redirect logic is handled by Index.tsx based on AuthContext state.
 */

import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLoading } from '@/components/ui/AppLoading';

interface OnboardingGuardProps {
  children: ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { status, isAdmin, isBoardMember } = useAuth();
  const location = useLocation();

  // Board routes render immediately without any loading state
  const isBoardRoute = location.pathname.startsWith('/board');
  if (isBoardRoute) {
    return <>{children}</>;
  }

  // Public routes that don't need the bootstrap gate
  const publicRoutes = [
    '/', '/auth', '/pricing', '/about', '/terms', '/privacy', '/cookies', 
    '/security', '/apps-and-tools', '/comparison', '/signup-select',
    '/advertiser/signup', '/demo', '/investor', '/demo-videos', '/videos'
  ];
  const isPublicRoute = publicRoutes.includes(location.pathname) || 
    location.pathname.startsWith('/meet/') ||
    location.pathname.startsWith('/videos') ||
    location.pathname.startsWith('/yourbenefits') ||
    location.pathname.startsWith('/c/') ||
    location.pathname.startsWith('/book/') ||
    location.pathname.startsWith('/proforma/') ||
    location.pathname.startsWith('/investor') ||
    location.pathname.startsWith('/tv') ||
    location.pathname.startsWith('/veterans') ||
    location.pathname.startsWith('/invest/') ||
    location.pathname.startsWith('/f/');
  
  // For public routes, render immediately
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Admins and board members bypass loading state
  if (status === 'authenticated' && (isAdmin || isBoardMember)) {
    return <>{children}</>;
  }

  // Show branded loading state while auth is loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AppLoading message="Loading your experience..." variant="fullscreen" />
      </div>
    );
  }

  // Auth resolved - render children
  // Redirect logic is handled by Index.tsx based on auth state
  return <>{children}</>;
}
