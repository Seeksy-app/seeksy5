// Seeksy Homepage - v6.0 (Refactored - no auth calls)
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CookieConsent } from "@/components/CookieConsent";
import { TopNavigation } from "@/components/homepage/TopNavigation";
import { AppLoading } from "@/components/ui/AppLoading";

// Homepage sections
import { HeroWorkspaceSection } from "@/components/homepage/HeroWorkspaceSection";
import { InteractiveDemo } from "@/components/homepage/InteractiveDemo";
import { PlatformPillars } from "@/components/homepage/PlatformPillars";
import { ModuleBuilder } from "@/components/homepage/ModuleBuilder";
import { PersonasSection } from "@/components/homepage/PersonasSection";
import { FinalCTA } from "@/components/homepage/FinalCTA";
import { FooterSection } from "@/components/homepage/FooterSection";
import { LeadMagnetModal, useLeadMagnetPopup } from "@/components/lead-magnet";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_CREATOR_LANDING = '/my-day';

const Index = () => {
  const { status, user, profile, isAdmin, isAdvertiser, onboardingCompleted } = useAuth();
  const navigate = useNavigate();
  
  // Lead magnet popup - disabled
  const { isOpen: isLeadMagnetOpen, closeModal: closeLeadMagnet } = useLeadMagnetPopup({
    scrollThreshold: 60,
    timeDelay: 45,
    enabled: false,
  });

  // Single redirect decision based on auth state
  useEffect(() => {
    // Only redirect when auth is resolved and user is authenticated
    if (status !== 'authenticated' || !user) return;
    
    // Wait for profile to load before making redirect decision
    if (profile === null) return;

    // Admin users go to admin
    if (isAdmin) {
      navigate('/admin', { replace: true });
      return;
    }
    
    // Advertiser users go to advertiser dashboard
    if (isAdvertiser && !profile?.is_creator) {
      navigate('/advertiser', { replace: true });
      return;
    }
    
    // If onboarding is not completed, redirect to onboarding
    if (!onboardingCompleted) {
      navigate('/onboarding', { replace: true });
      return;
    }
    
    // Creator users with completed onboarding - check for custom default landing route
    const fetchLandingRoute = async () => {
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('default_landing_route')
        .eq('user_id', user.id)
        .maybeSingle();

      // Use user's preferred landing route, or fallback to My Day
      const landingRoute = prefs?.default_landing_route || DEFAULT_CREATOR_LANDING;
      navigate(landingRoute, { replace: true });
    };
    
    fetchLandingRoute();
  }, [status, user, profile, isAdmin, isAdvertiser, onboardingCompleted, navigate]);

  // Show branded loading while auth is loading
  if (status === 'loading') {
    return <AppLoading message="Welcome to Seeksy..." />;
  }

  // If authenticated, show loading while redirect happens
  if (status === 'authenticated') {
    return <AppLoading message="Loading your workspace..." />;
  }

  // Anonymous users see the marketing homepage
  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <main>
        {/* 1. Hero - Workspace Builder (Image 1 style) */}
        <HeroWorkspaceSection />
        
        {/* 2. Interactive Demo - Chat/Prompt box with clickable modules */}
        <InteractiveDemo />
        
        {/* 3. Personas Section - Videos */}
        <PersonasSection />
        
        {/* 4. Value Pillars - Create, Connect, Monetize */}
        <PlatformPillars />
        
        {/* 5. Module Builder - Toggle version */}
        <ModuleBuilder />
        
        {/* Final CTA */}
        <FinalCTA />
        
        {/* Footer */}
        <FooterSection />
      </main>
      <CookieConsent />
      
      {/* Lead Magnet Modal */}
      <LeadMagnetModal
        isOpen={isLeadMagnetOpen}
        onClose={closeLeadMagnet}
        source="homepage"
      />
    </div>
  );
};

export default Index;
