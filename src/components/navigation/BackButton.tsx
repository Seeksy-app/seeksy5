import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  fallbackPath?: string;
  label?: string;
  className?: string;
}

// Map of child routes to their parent routes
const PARENT_ROUTES: Record<string, string> = {
  // Admin routes
  "/admin/screenshot-generator": "/admin",
  "/admin/demo-recorder": "/admin",
  "/admin/screen-capture": "/admin",
  "/admin/settings": "/admin",
  "/admin/logo-manager": "/admin",
  "/admin/brand-settings": "/admin",
  "/admin/email-templates": "/admin",
  "/admin/global-settings": "/admin",
  "/admin/hero-manager": "/admin",
  "/admin/advertisers": "/admin",
  "/admin/ad-analytics": "/admin",
  "/admin/campaigns": "/admin",
  "/admin/revenue-reports": "/admin",
  "/admin/billing": "/admin",
  "/admin/payments": "/admin",
  "/admin/financial-models": "/admin",
  "/admin/combined-financial-models": "/admin",
  "/admin/support-desk": "/admin",
  "/admin/sales-leads": "/admin",
  "/admin/advertising-management": "/admin",
  "/admin/impersonate": "/admin",
  "/admin/credit-management": "/admin",
  "/admin/profile-settings": "/admin",
  "/admin/creators": "/admin",
  "/admin/identity": "/admin",
  "/admin/voice-credentials": "/admin",
  "/admin/voice-certification": "/admin",
  "/admin/voice-nft-certificates": "/admin",
  "/admin/onboarding": "/admin",
  "/admin/system-status": "/admin",
  "/admin/landing-pages": "/admin",
  "/admin/master-blog": "/admin",
  "/admin/hero-image-generator": "/admin",
  "/admin/mascot-generator": "/admin",
  "/admin/app-audio": "/admin",
  "/admin/personas": "/admin",
  "/admin/rate-desk": "/admin",
  "/admin/ad-analytics-import": "/admin",
  
  // Events & Awards
  "/events/create": "/events",
  "/awards/create": "/awards",
  "/awards/judges": "/awards",
  "/awards/admin/tally": "/awards",
  
  // Studio routes
  "/studio/audio": "/studio",
  "/studio/video": "/studio",
  "/studio/clips": "/studio",
  "/clips-studio": "/studio",
  "/studio/media": "/studio",
  "/studio/templates": "/studio",
  "/studio/settings": "/studio",
  "/studio/recordings": "/studio",
  "/studio/ads": "/studio",
  "/studio/guests": "/studio",
  "/studio/live": "/studio",
  "/studio/complete": "/studio",
  "/studio/storage": "/studio",
  
  // Podcasts
  "/podcasts/create": "/podcasts",
  "/podcasts/import": "/podcasts",
  
  // Blog
  "/blog/create": "/blog",
  "/blog-library": "/blog",
  
  // Contacts
  "/contacts/profile": "/contacts",
  
  // Meetings
  "/meetings/create": "/meetings",
  "/meetings/types": "/meetings",
  "/meetings/types/create": "/meetings/types",
  
  // Email
  "/email/drafts": "/email",
  "/email/sent": "/email",
  "/email/scheduled": "/email",
  "/email/analytics": "/email",
  "/email-settings": "/email",
  "/email-campaigns": "/email",
  "/email-templates": "/email",
  "/email-segments": "/email",
  "/email-automations": "/email",
  
  // CFO / GTM
  "/proforma": "/cfo-dashboard",
  "/cfo-calculators": "/cfo-dashboard",
  
  // Advertiser routes
  "/advertiser/creatives": "/advertiser",
  "/advertiser/campaigns": "/advertiser",
  "/advertiser/signup": "/advertiser",
  
  // Identity
  "/my-voice-identity": "/identity",
  "/voice-certification": "/identity",
  
  // Forms
  "/forms/builder": "/forms",
  
  // Proposals
  "/proposals/create": "/proposals",
  
  // Invoices
  "/invoices/create": "/invoices",
  
  // Tasks
  "/tasks": "/dashboard",
  
  // Transcripts
  "/transcripts": "/media-vault",
};

export function BackButton({ fallbackPath, label = "Back", className = "" }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Check if we have browser history
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // No history - use parent route mapping or fallback
      const parentRoute = getParentRoute(location.pathname);
      navigate(parentRoute || fallbackPath || "/dashboard");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`gap-2 text-muted-foreground hover:text-foreground ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}

// Helper to get parent route from current path
function getParentRoute(pathname: string): string | null {
  // Check exact match first
  if (PARENT_ROUTES[pathname]) {
    return PARENT_ROUTES[pathname];
  }
  
  // Check for dynamic routes (e.g., /events/:id → /events)
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 2) {
    // Try removing last segment
    const parentPath = "/" + segments.slice(0, -1).join("/");
    if (PARENT_ROUTES[parentPath]) {
      return PARENT_ROUTES[parentPath];
    }
    // Default to parent path
    return parentPath;
  }
  
  return null;
}

export default BackButton;
