import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioAdId, greetingScript, voiceId } = await req.json();

    if (!audioAdId || !greetingScript || !voiceId) {
      throw new Error('Missing required fields: audioAdId, greetingScript, or voiceId');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!ELEVENLABS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`Generating greeting audio for ad ${audioAdId}...`);

    // Call ElevenLabs TTS API for greeting
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: greetingScript,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    console.log('Greeting audio generated successfully, uploading to storage...');

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer();
    const audioBlob = new Uint8Array(audioBuffer);

    // Get advertiser ID from audio_ads table
    const { data: audioAd, error: fetchError } = await supabase
      .from('audio_ads')
      .select('advertiser_id')
      .eq('id', audioAdId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch audio ad: ${fetchError.message}`);
    }

    // Upload greeting to Supabase Storage
    const fileName = `${audioAd.advertiser_id}/${audioAdId}_greeting.mp3`;
    const { error: uploadError } = await supabase.storage
      .from('audio-ads-generated')
      .upload(fileName, audioBlob, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload greeting: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('audio-ads-generated')
      .getPublicUrl(fileName);

    console.log('Greeting uploaded successfully:', publicUrl);

    // Update audio_ads record with greeting
    const { error: updateError } = await supabase
      .from('audio_ads')
      .update({
        greeting_audio_url: publicUrl,
        greeting_script: greetingScript,
        greeting_voice_id: voiceId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', audioAdId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Failed to update audio ad: ${updateError.message}`);
    }

    console.log('Greeting generation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        greetingUrl: publicUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating greeting:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
