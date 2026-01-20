import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface ClickData {
  ad_slot_id: string;
  campaign_id?: string;
  episode_id: string;
  podcast_id: string;
  creator_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ad_slot_id, campaign_id, episode_id, podcast_id, creator_id }: ClickData = await req.json();

    console.log('📊 Tracking CTA click:', {
      ad_slot_id,
      campaign_id,
      episode_id,
      podcast_id,
      creator_id
    });

    // Get IP and user agent
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || null;
    const referrer = req.headers.get('referer') || null;

    // Hash IP for privacy
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const ipHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Insert click record
    const { error: clickError } = await supabase
      .from('ad_cta_clicks')
      .insert({
        ad_slot_id,
        campaign_id: campaign_id || null,
        episode_id,
        podcast_id,
        creator_id,
        listener_ip_hash: ipHash,
        user_agent: userAgent,
        referrer: referrer
      });

    if (clickError) {
      console.error('❌ Error tracking CTA click:', clickError);
      throw clickError;
    }

    console.log('✅ CTA click tracked successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'CTA click tracked' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in track-ad-cta-click:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});