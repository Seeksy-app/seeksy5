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
    const { voiceName, audioUrl, description, cloneType = 'instant' } = await req.json();

    if (!voiceName || !audioUrl) {
      throw new Error('Missing required fields: voiceName or audioUrl');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!ELEVENLABS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`Cloning voice (${cloneType}): ${voiceName} from ${audioUrl}`);

    // Fetch the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to fetch audio file');
    }

    const audioBlob = await audioResponse.blob();
    
    // Prepare form data for ElevenLabs voice cloning
    const formData = new FormData();
    formData.append('name', voiceName);
    formData.append('files', audioBlob, 'voice_sample.mp3');
    if (description) {
      formData.append('description', description);
    }

    // Choose endpoint based on clone type
    // Instant: standard voice cloning (quick, 10 seconds audio)
    // Professional: PVC endpoint (high-quality, 30+ minutes audio)
    const endpoint = cloneType === 'professional' 
      ? 'https://api.elevenlabs.io/v1/voice-generation/create-voice'
      : 'https://api.elevenlabs.io/v1/voices/add';

    // Call ElevenLabs API to clone voice
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Voice cloned successfully:', data);

    return new Response(
      JSON.stringify({
        success: true,
        voiceId: data.voice_id,
        voiceName: voiceName,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error cloning voice:', error);
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
