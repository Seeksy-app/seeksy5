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
    const { ad_id, placement_id, video_id, channel_id, position, viewer_session_id } = await req.json();
    
    console.log('[seeksy-tv-log-impression] Request received:', { 
      ad_id, placement_id, video_id, channel_id, position, viewer_session_id 
    });

    if (!ad_id || !placement_id || !video_id || !position) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: ad_id, placement_id, video_id, position' }),
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

    // Insert impression
    const { data, error } = await supabase
      .from('seeksy_tv_ad_impressions')
      .insert({
        ad_id,
        placement_id,
        video_id,
        channel_id: channel_id || null,
        position,
        viewer_session_id: viewer_session_id || null,
        ip_hash: ipHash,
      })
      .select()
      .single();

    if (error) {
      console.error('[seeksy-tv-log-impression] Error inserting impression:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to log impression' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[seeksy-tv-log-impression] Impression logged:', data.id);

    return new Response(
      JSON.stringify({ ok: true, impression_id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[seeksy-tv-log-impression] Unexpected error:', error);
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
