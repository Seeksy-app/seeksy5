import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 create-voice-profile function invoked');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Parsing request body...');
    const body = await req.json();
    console.log('📦 Request body:', JSON.stringify(body, null, 2));
    
    // Create client with user's auth context
    console.log('🔐 Creating Supabase client with user auth...');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    console.log('👤 Getting authenticated user...');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError) {
      console.error('❌ Auth error:', authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    if (!user) {
      console.error('❌ No user found');
      throw new Error('Not authenticated - no user');
    }
    console.log('✅ User authenticated:', user.id);

    const {
      voiceName,
      elevenlabsVoiceId,
      sampleAudioUrl,
      isAvailableForAds,
      pricePerAd,
      usageTerms,
      profileImageUrl,
    } = body;

    if (!voiceName || !elevenlabsVoiceId) {
      console.error('❌ Missing required fields');
      throw new Error('Missing required fields: voiceName or elevenlabsVoiceId');
    }

    console.log('📝 Creating voice profile for user:', user.id);
    console.log('📝 Voice name:', voiceName);
    console.log('📝 ElevenLabs Voice ID:', elevenlabsVoiceId);

    // Use service role to insert (bypasses RLS)
    console.log('🔑 Creating admin client with service role...');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
      throw new Error('Service role key not configured');
    }
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey
    );
    console.log('✅ Admin client created');

    const insertData = {
      user_id: user.id,
      voice_name: voiceName,
      elevenlabs_voice_id: elevenlabsVoiceId,
      sample_audio_url: sampleAudioUrl,
      is_available_for_ads: isAvailableForAds || false,
      price_per_ad: pricePerAd || null,
      usage_terms: usageTerms || null,
      profile_image_url: profileImageUrl || null,
    };
    
    console.log('💾 Inserting voice profile:', JSON.stringify(insertData, null, 2));

    const { data: profile, error: insertError } = await supabaseAdmin
      .from('creator_voice_profiles')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert error:', JSON.stringify(insertError, null, 2));
      console.error('❌ Error details:', insertError.message, insertError.code, insertError.hint);
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    console.log('✅ Voice profile created successfully:', profile.id);

    return new Response(
      JSON.stringify({
        success: true,
        profile,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ FATAL ERROR in create-voice-profile:');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Full error:', JSON.stringify(error, null, 2));
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
