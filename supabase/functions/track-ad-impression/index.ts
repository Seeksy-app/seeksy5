import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImpressionRequest {
  ad_slot_id: string;
  campaign_id?: string;
  episode_id: string;
  podcast_id: string;
  creator_id: string;
}

// Bot detection patterns
const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python/i,
  /java/i,
  /http/i,
  /headless/i,
  /phantom/i,
  /selenium/i,
];

// Hash IP address for privacy
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Detect if user agent is a bot
function isBot(userAgent: string): boolean {
  if (!userAgent) return true; // No user agent = suspicious
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

// Get geo-location data from IP
async function getGeoLocation(ip: string): Promise<{ country: string | null; city: string | null }> {
  try {
    // Using ip-api.com free service (no API key needed)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country || null,
        city: data.city || null,
      };
    }
  } catch (error) {
    console.error('Geo-location lookup failed:', error);
  }
  
  return { country: null, city: null };
}

// Extract real IP from headers (handles proxies and load balancers)
function getRealIP(req: Request): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  const xRealIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (cfConnectingIP) return cfConnectingIP;
  if (xRealIP) return xRealIP;
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  
  return 'unknown';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  try {
    console.log('[TRACK-IMPRESSION] Request received');

    // Parse request body
    const impressionData: ImpressionRequest = await req.json();
    console.log('[TRACK-IMPRESSION] Data:', impressionData);

    // Validate required fields
    if (!impressionData.ad_slot_id || !impressionData.episode_id || 
        !impressionData.podcast_id || !impressionData.creator_id) {
      throw new Error('Missing required fields');
    }

    // Get IP address and user agent
    const ip = getRealIP(req);
    const userAgent = req.headers.get('user-agent') || '';
    console.log('[TRACK-IMPRESSION] IP:', ip, 'User-Agent:', userAgent);

    // Bot detection
    const isBotRequest = isBot(userAgent);
    console.log('[TRACK-IMPRESSION] Bot detected:', isBotRequest);

    // Hash IP for privacy
    const ipHash = await hashIP(ip);
    console.log('[TRACK-IMPRESSION] IP hash:', ipHash);

    // Get geo-location
    const { country, city } = await getGeoLocation(ip);
    console.log('[TRACK-IMPRESSION] Geo:', { country, city });

    // Validate impression using fraud prevention function
    const { data: isValid, error: validationError } = await supabase
      .rpc('validate_ad_impression', {
        p_ad_slot_id: impressionData.ad_slot_id,
        p_campaign_id: impressionData.campaign_id || null,
        p_listener_ip_hash: ipHash,
        p_user_agent: userAgent
      });

    if (validationError) {
      console.error('[TRACK-IMPRESSION] Validation error:', validationError);
    }

    if (!isValid) {
      console.log('[TRACK-IMPRESSION] Invalid or suspicious impression detected, skipping');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid or suspicious impression',
          counted: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record impression
    const { data: impression, error: insertError } = await supabase
      .from('ad_impressions')
      .insert({
        ad_slot_id: impressionData.ad_slot_id,
        campaign_id: impressionData.campaign_id,
        episode_id: impressionData.episode_id,
        podcast_id: impressionData.podcast_id,
        creator_id: impressionData.creator_id,
        listener_ip_hash: ipHash,
        user_agent: userAgent,
        country: country,
        city: city,
        is_valid: !isBotRequest, // Mark as invalid if bot detected
        played_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('[TRACK-IMPRESSION] Insert error:', insertError);
      throw insertError;
    }

    console.log('[TRACK-IMPRESSION] Impression recorded:', impression.id);

    // Charge advertiser if this is a valid platform ad impression
    if (impressionData.campaign_id && !isBotRequest) {
      console.log('[TRACK-IMPRESSION] Charging advertiser for impression');
      
      try {
        // Call charge function (don't await - fire and forget)
        supabase.functions.invoke('advertiser-charge-impression', {
          body: { 
            campaignId: impressionData.campaign_id,
            impressionCount: 1
          }
        }).then(({ data, error }) => {
          if (error) {
            console.error('[TRACK-IMPRESSION] Charge error:', error);
          } else {
            console.log('[TRACK-IMPRESSION] Charge successful:', data);
          }
        });
      } catch (chargeError) {
        console.error('[TRACK-IMPRESSION] Charge invocation error:', chargeError);
        // Don't fail the impression tracking if charging fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        impression_id: impression.id,
        is_valid: !isBotRequest,
        counted: !isBotRequest
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[TRACK-IMPRESSION] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});