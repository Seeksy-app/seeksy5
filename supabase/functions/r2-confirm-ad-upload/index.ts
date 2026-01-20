import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      fileName, 
      fileUrl, 
      fileType, 
      fileSize, 
      userId,
      advertiserId,
      adDescription,
      ctaUrl,
      ctaText,
      duration,
      thumbnailUrl
    } = await req.json();

    if (!fileName || !fileUrl || !userId || !advertiserId) {
      throw new Error('Missing required fields: fileName, fileUrl, userId, advertiserId');
    }

    console.log('Confirming ad upload for:', fileName, 'advertiser:', advertiserId);

    // Verify user owns this advertiser account
    const { data: advertiser, error: advertiserError } = await supabase
      .from('advertisers')
      .select('id, user_id')
      .eq('id', advertiserId)
      .eq('user_id', userId)
      .single();

    if (advertiserError || !advertiser) {
      console.error('Advertiser verification error:', advertiserError);
      throw new Error('Unauthorized: Advertiser account not found or does not belong to user');
    }

    // Create audio ad record using service role (bypasses RLS)
    const { data: audioAd, error: dbError } = await supabase
      .from('audio_ads')
      .insert({
        advertiser_id: advertiserId,
        ad_type: 'standard',
        audio_url: fileUrl,
        thumbnail_url: thumbnailUrl || null,
        script: adDescription || 'Uploaded pre-made ad',
        voice_id: 'uploaded',
        status: 'completed',
        duration_seconds: duration || null,
        conversation_config: {
          cta_url: ctaUrl,
          cta_text: ctaText,
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Audio ad record created:', audioAd.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        audioAd 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error confirming ad upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: String(error)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
