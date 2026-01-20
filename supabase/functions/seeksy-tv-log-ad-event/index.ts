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
    const { 
      adId, 
      placementId, 
      videoId, 
      channelId, 
      position, 
      eventType,
      atSecond,
      durationSeconds,
      viewerSessionId,
      errorCode
    } = await req.json();
    
    console.log('[seeksy-tv-log-ad-event] Request received:', { 
      adId, placementId, videoId, channelId, position, eventType, viewerSessionId 
    });

    // Validate required fields
    if (!adId || !placementId || !videoId || !position || !eventType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: adId, placementId, videoId, position, eventType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate event type
    const validEventTypes = ['start', 'first_quartile', 'midpoint', 'third_quartile', 'complete', 'skip', 'error'];
    if (!validEventTypes.includes(eventType)) {
      return new Response(
        JSON.stringify({ error: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate position
    const validPositions = ['pre', 'mid', 'post'];
    if (!validPositions.includes(position)) {
      return new Response(
        JSON.stringify({ error: `Invalid position. Must be one of: ${validPositions.join(', ')}` }),
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

    // Insert event
    const { data, error } = await supabase
      .from('seeksy_tv_ad_events')
      .insert({
        ad_id: adId,
        placement_id: placementId,
        video_id: videoId,
        channel_id: channelId || null,
        position,
        event_type: eventType,
        at_second: atSecond ?? null,
        duration_seconds: durationSeconds ?? null,
        viewer_session_id: viewerSessionId || null,
        ip_hash: ipHash,
        error_code: errorCode || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[seeksy-tv-log-ad-event] Error inserting event:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to log event' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[seeksy-tv-log-ad-event] Event logged:', data.id, eventType);

    return new Response(
      JSON.stringify({ ok: true, event_id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[seeksy-tv-log-ad-event] Unexpected error:', error);
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
