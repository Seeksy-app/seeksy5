import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Instagram, TrendingUp, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMyPageEnabled } from "@/hooks/useMyPageEnabled";
import { useBannerDismissal } from "@/hooks/useBannerDismissal";

const SOCIAL_BANNER_KEY = "socialAccountsBannerDismissed";

export function SocialAccountsBanner() {
  const navigate = useNavigate();
  const { data: myPageEnabled, isLoading: myPageLoading } = useMyPageEnabled();
  const { isDismissed, isLoading: dismissalLoading, dismiss } = useBannerDismissal(SOCIAL_BANNER_KEY);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['social-media-accounts-check'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_media_accounts')
        .select('platform')
        .limit(1);
      
      if (error) throw error;
      return data;
    },
  });

  // Don't show if My Page integration is disabled
  if (!myPageEnabled || myPageLoading) {
    return null;
  }

  // Don't show while loading, if dismissed, or if they have accounts connected
  if (isLoading || dismissalLoading || isDismissed || (accounts && accounts.length > 0)) {
    return null;
  }

  return (
    <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-yellow-600" />
            <AlertTitle className="text-yellow-900 dark:text-yellow-100">
              Unlock Social Media Campaign Opportunities
            </AlertTitle>
          </div>
          <AlertDescription className="text-yellow-800 dark:text-yellow-200 mb-3">
            Connect your Instagram and Facebook accounts to receive campaign invitations from advertisers and track your ad impressions to earn revenue.
          </AlertDescription>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => navigate('/integrations')}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Instagram className="h-4 w-4 mr-2" />
              Connect Accounts
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={dismiss}
          className="text-yellow-600 hover:text-yellow-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
