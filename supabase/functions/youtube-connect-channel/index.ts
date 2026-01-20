import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    console.log('[youtube-connect-channel] Starting request...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { session_id, channel_id } = body;

    console.log('[youtube-connect-channel] Request body:', { session_id, channel_id });

    if (!session_id || !channel_id) {
      console.error('[youtube-connect-channel] Missing required fields:', { session_id, channel_id });
      return new Response(
        JSON.stringify({ error: 'Missing session_id or channel_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[youtube-connect-channel] Connecting channel:', channel_id, 'for session:', session_id);

    // Fetch the session
    const { data: session, error: sessionError } = await supabase
      .from('youtube_oauth_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      console.error('[youtube-connect-channel] Session not found:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Session not found or expired', details: sessionError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[youtube-connect-channel] Session found:', {
      id: session.id,
      user_id: session.user_id,
      channels_count: (session.channels as unknown[])?.length,
      has_access_token: !!session.access_token,
      has_refresh_token: !!session.refresh_token,
      created_at: session.created_at,
      used_at: session.used_at,
    });

    // Check if session is already used
    if (session.used_at) {
      return new Response(
        JSON.stringify({ error: 'Session already used' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session is expired (10 minutes)
    const sessionAge = Date.now() - new Date(session.created_at).getTime();
    if (sessionAge > 10 * 60 * 1000) {
      return new Response(
        JSON.stringify({ error: 'Session expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the selected channel in the session
    const channels = session.channels as Array<{
      id: string;
      title: string;
      thumbnail: string;
      subscriberCount: number;
      videoCount: number;
    }>;

    const selectedChannel = channels.find(c => c.id === channel_id);
    if (!selectedChannel) {
      console.error('[youtube-connect-channel] Channel not found in session. Available channels:', channels.map(c => c.id));
      return new Response(
        JSON.stringify({ error: 'Channel not found in session' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[youtube-connect-channel] Selected channel:', {
      id: selectedChannel.id,
      title: selectedChannel.title,
      subscriberCount: selectedChannel.subscriberCount,
    });

    // Check if profile already exists for this channel
    const { data: existingProfile } = await supabase
      .from('social_media_profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', 'youtube')
      .eq('platform_user_id', channel_id)
      .single();

    const profileData = {
      user_id: user.id,
      platform: 'youtube',
      platform_user_id: channel_id,
      username: selectedChannel.title,
      profile_picture: selectedChannel.thumbnail,
      followers_count: selectedChannel.subscriberCount,
      media_count: selectedChannel.videoCount,
      access_token: session.access_token,
      refresh_token: session.refresh_token || null,
      token_expires_at: session.expires_at,
      connected_at: new Date().toISOString(),
      last_sync_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    console.log('[youtube-connect-channel] Profile data to save:', {
      ...profileData,
      access_token: profileData.access_token ? '[REDACTED]' : null,
      refresh_token: profileData.refresh_token ? '[REDACTED]' : null,
    });

    let savedProfile;
    if (existingProfile) {
      console.log('Updating existing YouTube profile:', existingProfile.id);
      const { data, error: updateError } = await supabase
        .from('social_media_profiles')
        .update(profileData)
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (updateError) {
        console.error('[youtube-connect-channel] Failed to update profile:', {
          error: updateError,
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        });
        return new Response(
          JSON.stringify({ error: 'Failed to update profile', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('[youtube-connect-channel] Profile updated successfully:', data?.id);
      savedProfile = data;
    } else {
      // Remove any existing YouTube profile for this user (different channel)
      await supabase
        .from('social_media_profiles')
        .delete()
        .eq('user_id', user.id)
        .eq('platform', 'youtube');

      console.log('Creating new YouTube profile');
      const { data, error: insertError } = await supabase
        .from('social_media_profiles')
        .insert(profileData)
        .select()
        .single();

      if (insertError) {
        console.error('[youtube-connect-channel] Failed to insert profile:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        });
        return new Response(
          JSON.stringify({ error: 'Failed to save profile', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('[youtube-connect-channel] Profile inserted successfully:', data?.id);
      savedProfile = data;
    }

    // Mark session as used
    await supabase
      .from('youtube_oauth_sessions')
      .update({ used_at: new Date().toISOString() })
      .eq('id', session_id);

    console.log('Profile saved, triggering sync...');

    // Trigger sync
    try {
      await fetch(`${supabaseUrl}/functions/v1/sync-youtube-channel-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          profile_id: savedProfile?.id,
        }),
      });
    } catch (syncError) {
      console.error('Sync trigger failed (non-blocking):', syncError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        channel: {
          id: selectedChannel.id,
          title: selectedChannel.title,
          thumbnail: selectedChannel.thumbnail,
          subscriberCount: selectedChannel.subscriberCount,
        },
        profile_id: savedProfile?.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error connecting channel:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
