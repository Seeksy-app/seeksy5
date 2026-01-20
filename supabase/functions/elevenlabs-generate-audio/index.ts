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
    const { audioAdId, script, voiceId, voiceName } = await req.json();

    if (!audioAdId || !script || !voiceId) {
      throw new Error('Missing required fields: audioAdId, script, or voiceId');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!ELEVENLABS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`Generating audio for ad ${audioAdId} with voice ${voiceId}...`);

    // Clean script: Remove stage directions and formatting markers
    let cleanScript = script
      .replace(/\([^)]*\)/g, '') // Remove parenthetical directions like (Sound of...)
      .replace(/\*\*[^*]+:\*\*/g, '') // Remove **Narrator:** style markers
      .replace(/\*\*/g, '') // Remove any remaining ** markers
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Format phone numbers with pauses for slow, clear reading
    // Match phone numbers in various formats: 123-456-7890, (123) 456-7890, 123.456.7890, 1234567890
    cleanScript = cleanScript.replace(
      /(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g,
      (match: string) => {
        // Extract just the digits
        const digits = match.replace(/\D/g, '');
        // Format as: XXX <break time="500ms"/> XXX <break time="500ms"/> XXXX
        return `${digits.slice(0, 3)} <break time="500ms"/> ${digits.slice(3, 6)} <break time="500ms"/> ${digits.slice(6)}`;
      }
    );

    console.log('Cleaned script:', cleanScript);

    // Call ElevenLabs TTS API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanScript,
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
      
      let errorMessage = `ElevenLabs API error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail?.status === 'payment_issue') {
          errorMessage = 'ElevenLabs payment issue: Your ElevenLabs subscription has a failed or incomplete payment. Please complete your payment at elevenlabs.io to continue.';
        } else if (errorData.detail?.message) {
          errorMessage = `ElevenLabs error: ${errorData.detail.message}`;
        }
      } catch (e) {
        // If parsing fails, use the original error text if it's short enough
        if (errorText.length < 200) {
          errorMessage = `ElevenLabs error: ${errorText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    console.log('Audio generated successfully, uploading to storage...');

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

    // Upload to Supabase Storage
    const fileName = `${audioAd.advertiser_id}/${audioAdId}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from('audio-ads-generated')
      .upload(fileName, audioBlob, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('audio-ads-generated')
      .getPublicUrl(fileName);

    console.log('Audio uploaded successfully:', publicUrl);

    // Calculate duration (approximate based on text length and speaking rate)
    // Average speaking rate is ~150 words per minute
    const wordCount = script.split(/\s+/).length;
    const estimatedDuration = Math.ceil((wordCount / 150) * 60);

    // Update audio_ads record - set to 'pending' for advertiser approval
    const { error: updateError } = await supabase
      .from('audio_ads')
      .update({
        audio_url: publicUrl,
        duration_seconds: estimatedDuration,
        voice_name: voiceName,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', audioAdId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Failed to update audio ad: ${updateError.message}`);
    }

    console.log('Audio ad generation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl: publicUrl,
        duration: estimatedDuration,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating audio:', error);

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
