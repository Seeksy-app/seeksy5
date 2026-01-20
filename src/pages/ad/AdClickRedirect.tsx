import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackNewsletterAdClick } from "@/lib/tracking/adImpressionTracking";

/**
 * Newsletter ad click redirect handler
 * 
 * Route: /ad/click/:adId?campaign=xxx&url=xxx&newsletter=xxx&creator=xxx
 * 
 * Flow:
 * 1. Extract ad ID, campaign ID, newsletter ID, and destination URL from params
 * 2. Track impression in ad_impressions table
 * 3. 302 redirect to advertiser URL
 */
const AdClickRedirect = () => {
  const { adId } = useParams<{ adId: string }>();
  const [searchParams] = useSearchParams();
  const [redirecting, setRedirecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleRedirect();
  }, [adId]);

  const handleRedirect = async () => {
    try {
      if (!adId) {
        throw new Error('Ad ID is required');
      }

      const campaignId = searchParams.get('campaign');
      const destinationUrl = searchParams.get('url');
      const newsletterId = searchParams.get('newsletter');
      const creatorId = searchParams.get('creator');

      if (!destinationUrl) {
        throw new Error('Destination URL is required');
      }

      if (!creatorId) {
        throw new Error('Creator ID is required');
      }

      // Generate IP hash for tracking
      const ipHash = await generateIpHash();

      // Track the impression
      await trackNewsletterAdClick({
        adId,
        campaignId: campaignId || undefined,
        newsletterId: newsletterId || undefined,
        creatorId,
        ipHash,
      });

      // Log click event in ad_cta_clicks table if available
      try {
        await supabase.from('ad_cta_clicks').insert({
          ad_slot_id: adId,
          campaign_id: campaignId,
          creator_id: creatorId,
          listener_ip_hash: ipHash,
          episode_id: newsletterId || 'newsletter',
          podcast_id: 'newsletter',
        });
      } catch (clickError) {
        console.warn('Failed to log CTA click:', clickError);
        // Non-blocking
      }

      // Redirect to destination URL
      window.location.href = destinationUrl;
    } catch (err) {
      console.error('Error processing ad redirect:', err);
      setError(err instanceof Error ? err.message : 'Failed to redirect');
      setRedirecting(false);
    }
  };

  const generateIpHash = async (): Promise<string> => {
    const sessionId = sessionStorage.getItem('ad_session_id') || crypto.randomUUID();
    sessionStorage.setItem('ad_session_id', sessionId);
    
    const encoder = new TextEncoder();
    const data = encoder.encode(sessionId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <ExternalLink className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Redirect Failed</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            Please contact the newsletter publisher if this issue persists.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-md">
        <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
        <h1 className="text-2xl font-bold mb-2">Redirecting...</h1>
        <p className="text-muted-foreground">
          You're being redirected to the advertiser's website.
        </p>
      </Card>
    </div>
  );
};

export default AdClickRedirect;
