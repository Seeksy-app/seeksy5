import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioUrl } = await req.json();

    if (!audioUrl) {
      throw new Error('Audio URL is required');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    console.log('Fetching audio file from:', audioUrl);

    // Fetch the audio file using streaming to avoid memory issues
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to fetch audio file');
    }

    // Stream the file directly instead of loading into memory
    const audioBody = audioResponse.body;
    if (!audioBody) {
      throw new Error('No audio data received');
    }

    // Create form data for ElevenLabs API
    const formData = new FormData();
    // Pass the stream directly to form data
    const blob = await audioResponse.blob();
    formData.append('audio', blob, 'audio.mp4');
    formData.append('model_id', 'eleven_multilingual_v2');

    console.log('Sending to ElevenLabs for transcription...');

    // Call ElevenLabs Speech-to-Text API (correct endpoint)
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', error);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Transcription completed successfully');

    return new Response(
      JSON.stringify({ 
        transcript: data.text,
        confidence: data.confidence 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error transcribing audio:', error);
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
