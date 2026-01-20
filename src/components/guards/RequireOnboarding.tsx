/**
 * RequireOnboarding - Guard that requires onboarding to be completed
 * 
 * If onboarding is not complete, redirects to /onboarding.
 * Must be used after auth is confirmed.
 */

import { ReactNode } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLoading } from '@/components/ui/AppLoading';

interface RequireOnboardingProps {
  children: ReactNode;
  /** Allow bypassing for dev testing with ?force=true */
  allowForceBypass?: boolean;
}

export function RequireOnboarding({ children, allowForceBypass = false }: RequireOnboardingProps) {
  const { status, onboardingCompleted, isAdmin, isBoardMember, profile } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Show loading while auth is resolving
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AppLoading message="Loading..." variant="fullscreen" />
      </div>
    );
  }

  // If not authenticated, let RequireAuth handle it
  if (status === 'anonymous') {
    return <>{children}</>;
  }

  // Admins and board members bypass onboarding
  if (isAdmin || isBoardMember) {
    return <>{children}</>;
  }

  // Check for force bypass in dev mode
  if (allowForceBypass && searchParams.get('force') === 'true') {
    return <>{children}</>;
  }

  // If user just completed onboarding, don't redirect back
  if (sessionStorage.getItem('onboarding_just_completed')) {
    return <>{children}</>;
  }

  // Profile not loaded yet - wait
  if (profile === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AppLoading message="Loading your profile..." variant="fullscreen" />
      </div>
    );
  }

  // Redirect to onboarding if not completed
  if (!onboardingCompleted) {
    // Don't redirect if already on onboarding
    if (location.pathname === '/onboarding') {
      return <>{children}</>;
    }
    return <Navigate to="/onboarding" replace />;
  }

  // Onboarding complete - render content
  return <>{children}</>;
}
