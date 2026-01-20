import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationResult {
  valid: boolean;
  errorCode?: 'VOICE_SAMPLE_TOO_SHORT' | 'VOICE_SAMPLE_TOO_QUIET' | 'VOICE_MATCH_TOO_LOW' | 'VOICE_ATTEMPTS_LIMIT_REACHED';
  errorMessage?: string;
  score?: number;
  voicedSeconds?: number;
}

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
      throw new Error('Not authenticated');
    }

    const { audioData, recordingDuration, selectedPrompt } = await req.json();

    if (!audioData || !recordingDuration) {
      throw new Error('Audio data and recording duration are required');
    }

    console.log('[verify-voice-quality] Validating voice sample for user:', user.id);
    console.log('[verify-voice-quality] Recording duration:', recordingDuration);

    // Check attempt limit (5 attempts per 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentAttempts, error: attemptsError } = await supabaseClient
      .from('voice_verification_attempts')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', twentyFourHoursAgo);

    if (attemptsError) {
      console.error('[verify-voice-quality] Error checking attempts:', attemptsError);
    }

    if (recentAttempts && recentAttempts.length >= 5) {
      return new Response(
        JSON.stringify({
          valid: false,
          errorCode: 'VOICE_ATTEMPTS_LIMIT_REACHED',
          errorMessage: "You've reached the limit for voice verification attempts today. Please try again in 24 hours."
        } as ValidationResult),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Decode base64 audio
    const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
    
    // Validate minimum speech duration (8-10 seconds)
    if (recordingDuration < 8) {
      // Log attempt
      await supabaseClient
        .from('voice_verification_attempts')
        .insert({
          user_id: user.id,
          success: false,
          error_code: 'VOICE_SAMPLE_TOO_SHORT',
          recording_duration: recordingDuration,
          selected_prompt: selectedPrompt
        });

      return new Response(
        JSON.stringify({
          valid: false,
          errorCode: 'VOICE_SAMPLE_TOO_SHORT',
          errorMessage: "We couldn't hear enough clear speech to verify your voice. Please try again from a quieter place and read the full sentence on screen."
        } as ValidationResult),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Basic audio energy check (simplified VAD)
    // In production, you'd use a proper voice activity detection library
    const sampleRate = 16000; // Assumed sample rate
    const expectedSamples = recordingDuration * sampleRate;
    const actualSamples = audioBuffer.length;
    
    // Calculate average amplitude
    let totalAmplitude = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      totalAmplitude += Math.abs(audioBuffer[i] - 128);
    }
    const avgAmplitude = totalAmplitude / audioBuffer.length;
    
    // Threshold for quiet detection (~-35 dB equivalent)
    const quietThreshold = 15;
    
    if (avgAmplitude < quietThreshold) {
      // Log attempt
      await supabaseClient
        .from('voice_verification_attempts')
        .insert({
          user_id: user.id,
          success: false,
          error_code: 'VOICE_SAMPLE_TOO_QUIET',
          recording_duration: recordingDuration,
          selected_prompt: selectedPrompt
        });

      return new Response(
        JSON.stringify({
          valid: false,
          errorCode: 'VOICE_SAMPLE_TOO_QUIET',
          errorMessage: "We couldn't hear enough clear speech to verify your voice. Please try again from a quieter place and read the full sentence on screen."
        } as ValidationResult),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Calculate voice match score (simplified version)
    // In production, integrate with actual voice biometrics service
    const VOICE_MATCH_THRESHOLD = 0.85;
    const mockScore = 0.75 + (Math.random() * 0.2); // Mock score between 0.75-0.95
    
    if (mockScore < VOICE_MATCH_THRESHOLD) {
      // Log attempt
      await supabaseClient
        .from('voice_verification_attempts')
        .insert({
          user_id: user.id,
          success: false,
          error_code: 'VOICE_MATCH_TOO_LOW',
          recording_duration: recordingDuration,
          selected_prompt: selectedPrompt,
          match_score: mockScore
        });

      return new Response(
        JSON.stringify({
          valid: false,
          errorCode: 'VOICE_MATCH_TOO_LOW',
          errorMessage: "We couldn't confirm a strong enough match to your voice. Try again speaking clearly in your normal voice and reading the full sentence.",
          score: mockScore
        } as ValidationResult),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Success - log attempt
    await supabaseClient
      .from('voice_verification_attempts')
      .insert({
        user_id: user.id,
        success: true,
        recording_duration: recordingDuration,
        selected_prompt: selectedPrompt,
        match_score: mockScore
      });

    return new Response(
      JSON.stringify({
        valid: true,
        score: mockScore,
        voicedSeconds: recordingDuration
      } as ValidationResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[verify-voice-quality] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        valid: false
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
