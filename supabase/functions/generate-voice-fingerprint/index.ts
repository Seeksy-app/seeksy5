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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      throw new Error('Not authenticated');
    }

    const { audioSignature, sourceType, sourceId, sampleDuration } = await req.json();

    if (!audioSignature || !sourceType) {
      throw new Error('Audio signature and source type are required');
    }

    console.log('Generating voice fingerprint for user:', user.id);

    // Generate SHA-256 hash from audio signature
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(audioSignature));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fingerprintHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Calculate confidence score based on audio quality metrics
    const confidenceScore = calculateConfidenceScore(audioSignature);

    // Check if this is the user's first fingerprint
    const { data: existingFingerprints } = await supabaseClient
      .from('creator_voice_fingerprints')
      .select('id')
      .eq('user_id', user.id);

    const isPrimary = !existingFingerprints || existingFingerprints.length === 0;

    // Create fingerprint record
    const { data: fingerprint, error: fingerprintError } = await supabaseClient
      .from('creator_voice_fingerprints')
      .insert({
        user_id: user.id,
        fingerprint_hash: fingerprintHash,
        audio_signature: audioSignature,
        source_type: sourceType,
        source_id: sourceId,
        sample_duration_seconds: sampleDuration,
        confidence_score: confidenceScore,
        is_primary: isPrimary,
      })
      .select()
      .single();

    if (fingerprintError) {
      console.error('Error creating fingerprint:', fingerprintError);
      throw fingerprintError;
    }

    console.log('Voice fingerprint created successfully:', fingerprint.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        fingerprint: {
          id: fingerprint.id,
          hash: fingerprint.fingerprint_hash,
          confidenceScore: fingerprint.confidence_score,
          isPrimary: fingerprint.is_primary,
        },
        message: 'Voice fingerprint generated successfully',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-voice-fingerprint:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

function calculateConfidenceScore(audioSignature: any): number {
  // Calculate confidence based on:
  // - Sample duration (longer = more confident)
  // - Frequency distribution quality
  // - Signal-to-noise ratio
  // - Voice clarity metrics
  
  let score = 0.5; // Base score
  
  if (audioSignature.duration >= 10) score += 0.2; // Good sample length
  if (audioSignature.duration >= 30) score += 0.1; // Excellent sample length
  
  if (audioSignature.frequencyData && audioSignature.frequencyData.length > 100) {
    score += 0.1; // Rich frequency data
  }
  
  if (audioSignature.snr && audioSignature.snr > 20) {
    score += 0.1; // Good signal-to-noise ratio
  }
  
  return Math.min(score, 1.0); // Cap at 1.0
}
