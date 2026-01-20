import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { asset_id, audio_url, language = 'en', source_type = 'upload' } = await req.json();

    if (!audio_url) {
      throw new Error('Missing required field: audio_url');
    }

    console.log('Starting transcription for asset:', asset_id, 'source:', source_type, 'url:', audio_url);

    let transcriptText = '';
    let aiModel = 'elevenlabs-stt-v1';
    let wordTimestamps = null;
    let transcriptionError: string | null = null;

    // Try ElevenLabs first
    try {
      const elevenlabsKey = Deno.env.get('ELEVENLABS_API_KEY');
      
      if (!elevenlabsKey) {
        throw new Error('ELEVENLABS_API_KEY not configured');
      }

      console.log('Using ElevenLabs speech-to-text...');
      
      // Fetch audio file
      console.log('Fetching audio from URL...');
      const audioResponse = await fetch(audio_url);
      
      if (!audioResponse.ok) {
        throw new Error(`Failed to fetch audio file: ${audioResponse.status} ${audioResponse.statusText}`);
      }
      
      const audioBlob = await audioResponse.blob();
      console.log('Audio fetched, size:', audioBlob.size, 'bytes');
      
      // Create form data for ElevenLabs
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.mp4');
      formData.append('model_id', 'eleven_multilingual_v2');
      formData.append('language_code', language);

      console.log('Sending to ElevenLabs API...');
      const elevenlabsResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': elevenlabsKey,
        },
        body: formData,
      });

      if (!elevenlabsResponse.ok) {
        const errorText = await elevenlabsResponse.text();
        console.error('ElevenLabs API error:', elevenlabsResponse.status, errorText);
        throw new Error(`ElevenLabs API error (${elevenlabsResponse.status}): ${errorText}`);
      }

      const result = await elevenlabsResponse.json();
      transcriptText = result.text || '';
      
      if (!transcriptText) {
        throw new Error('ElevenLabs returned empty transcript');
      }
      
      console.log('ElevenLabs transcription successful, length:', transcriptText.length);
    } catch (elevenlabsError) {
      const errorMsg = elevenlabsError instanceof Error ? elevenlabsError.message : 'Unknown error';
      transcriptionError = errorMsg;
      console.error('ElevenLabs transcription failed:', errorMsg);
      
      // CRITICAL: Don't use fallback - fail fast so user knows transcription failed
      throw new Error(`Transcription failed: ${errorMsg}`);
    }

    // Store transcript in database
    const { data: transcript, error: dbError } = await supabaseClient
      .from('transcripts')
      .insert({
        asset_id,
        user_id: user.id,
        source_type,
        language,
        raw_text: transcriptText,
        ai_model: aiModel,
        word_timestamps: wordTimestamps,
        metadata: {
          audio_url,
          created_via: 'transcribe-audio-function',
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Transcript stored successfully:', transcript.id);

    return new Response(
      JSON.stringify({
        success: true,
        transcript,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error transcribing audio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Log full error details for debugging
    console.error('Full error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name,
    });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
