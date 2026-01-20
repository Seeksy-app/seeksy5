import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const adId = url.searchParams.get('adId');
    const placementId = url.searchParams.get('placementId');
    const videoId = url.searchParams.get('videoId');
    const channelId = url.searchParams.get('channelId');
    const position = url.searchParams.get('position');
    const dest = url.searchParams.get('dest');
    const viewerSessionId = url.searchParams.get('sessionId');

    console.log('[seeksy-tv-ad-click-redirect] Request received:', { 
      adId, placementId, videoId, position, dest 
    });

    // Validate required fields
    if (!adId || !dest) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: adId, dest' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate destination URL
    let destinationUrl: URL;
    try {
      destinationUrl = new URL(dest);
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(destinationUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid destination URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get IP hash for analytics (privacy-preserving)
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    const ipHash = await hashIP(clientIP);

    // Get referrer and user agent
    const referrer = req.headers.get('referer') || null;
    const userAgent = req.headers.get('user-agent') || null;

    // Insert click record
    const { error: insertError } = await supabase
      .from('seeksy_tv_ad_clicks')
      .insert({
        ad_id: adId,
        placement_id: placementId || null,
        video_id: videoId || null,
        channel_id: channelId || null,
        position: position || null,
        viewer_session_id: viewerSessionId || null,
        ip_hash: ipHash,
        destination_url: dest,
        referrer,
        user_agent: userAgent,
      });

    if (insertError) {
      console.error('[seeksy-tv-ad-click-redirect] Error logging click:', insertError);
      // Don't block the redirect, just log the error
    } else {
      console.log('[seeksy-tv-ad-click-redirect] Click logged successfully');
    }

    // Redirect to destination
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': dest,
      },
    });

  } catch (error) {
    console.error('[seeksy-tv-ad-click-redirect] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Simple hash function for IP privacy
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.slice(0, 16));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
