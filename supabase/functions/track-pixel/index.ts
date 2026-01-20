import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      creator_id,
      visitor_id,
      page_url,
      referrer,
      session_duration,
      page_views
    } = await req.json();

    console.log('📊 Pixel tracking data received:', { creator_id, page_url, visitor_id });

    // Extract IP and user agent
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    // Hash IP for privacy
    const ipHash = await hashIP(ip);

    // Check if visitor already exists
    const { data: existingLead } = await supabaseClient
      .from('pixel_leads')
      .select('id, page_views')
      .eq('creator_id', creator_id)
      .eq('visitor_ip_hash', ipHash)
      .eq('visitor_id', visitor_id)
      .maybeSingle();

    if (existingLead) {
      // Update existing lead with new activity
      const { error: updateError } = await supabaseClient
        .from('pixel_leads')
        .update({
          last_seen_at: new Date().toISOString(),
          page_views: (existingLead.page_views || 1) + 1,
          session_duration: session_duration || null,
          page_url, // Update to latest page
          referrer: referrer || null
        })
        .eq('id', existingLead.id);

      if (updateError) {
        console.error('❌ Error updating lead:', updateError);
        throw updateError;
      }

      console.log('✅ Updated existing lead');
      return new Response(
        JSON.stringify({ success: true, lead_id: existingLead.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get geo data from IP
    const geoData = await getGeoLocation(ip);

    // Create new lead
    const { data: newLead, error: insertError } = await supabaseClient
      .from('pixel_leads')
      .insert({
        creator_id,
        visitor_ip_hash: ipHash,
        visitor_id,
        page_url,
        referrer: referrer || null,
        user_agent: userAgent,
        session_duration: session_duration || null,
        page_views: page_views || 1,
        country: geoData.country,
        city: geoData.city,
        enrichment_status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating lead:', insertError);
      throw insertError;
    }

    console.log('✅ New lead captured:', newLead.id);

    return new Response(
      JSON.stringify({ success: true, lead_id: newLead.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Pixel tracking error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function hashIP(ip: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getGeoLocation(ip: string): Promise<{ country: string | null; city: string | null }> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    return {
      country: data.country || null,
      city: data.city || null
    };
  } catch (error) {
    console.error('Geo lookup failed:', error);
    return { country: null, city: null };
  }
}