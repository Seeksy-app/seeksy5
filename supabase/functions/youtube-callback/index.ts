import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken } from "../_shared/token-encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const productionRedirectBase = 'https://seeksy.io';

  try {
    console.log('[youtube-callback] Processing OAuth callback');
    
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('[youtube-callback] OAuth error:', error);
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    if (!state) {
      throw new Error('No state parameter received');
    }

    // Decode state to get user_id
    let userId: string;
    try {
      const stateData = JSON.parse(atob(state));
      userId = stateData.user_id;
      if (!userId) {
        throw new Error('No user_id in state');
      }
      
      // Validate userId is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new Error('Invalid user_id format');
      }
      
      console.log('[youtube-callback] Decoded user_id from state:', userId);
    } catch (e) {
      console.error('[youtube-callback] Failed to decode state:', e);
      throw new Error('Invalid state parameter');
    }

    const clientId = Deno.env.get('YOUTUBE_CLIENT_ID');
    const clientSecret = Deno.env.get('YOUTUBE_CLIENT_SECRET');

    if (!clientId || !clientSecret || !supabaseUrl) {
      throw new Error('Missing YouTube credentials');
    }

    const redirectUri = `${supabaseUrl}/functions/v1/youtube-callback`;

    // Exchange code for tokens
    console.log('[youtube-callback] Exchanging code for tokens...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('[youtube-callback] Token exchange failed:', errorData);
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();
    console.log('[youtube-callback] Tokens received');

    // Fetch ALL YouTube channels for this Google account
    console.log('[youtube-callback] Fetching YouTube channels...');
    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!channelResponse.ok) {
      const errorData = await channelResponse.text();
      console.error('[youtube-callback] Channel fetch failed:', errorData);
      throw new Error('Failed to fetch YouTube channel data');
    }

    const channelData = await channelResponse.json();

    if (!channelData.items || channelData.items.length === 0) {
      throw new Error('No YouTube channel found for this account');
    }

    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Check how many channels this account has
    const channels = channelData.items.map((channel: any) => ({
      id: channel.id,
      title: channel.snippet?.title || 'Unknown Channel',
      thumbnail: channel.snippet?.thumbnails?.high?.url || channel.snippet?.thumbnails?.default?.url || '',
      subscriberCount: parseInt(channel.statistics?.subscriberCount || '0', 10),
      videoCount: parseInt(channel.statistics?.videoCount || '0', 10),
    }));

    console.log(`[youtube-callback] Found ${channels.length} channel(s)`);

    // If only 1 channel, auto-connect (existing behavior)
    if (channels.length === 1) {
      const channel = channels[0];
      return await connectSingleChannel(supabase, supabaseUrl, userId, channel, tokens, productionRedirectBase);
    }

    // Multiple channels: store session and redirect to selection UI
    // Encrypt tokens before storing in session
    console.log('[youtube-callback] Multiple channels, creating selection session with encrypted tokens...');
    
    const encryptedAccessToken = await encryptToken(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token 
      ? await encryptToken(tokens.refresh_token) 
      : null;
    
    const { data: session, error: sessionError } = await supabase
      .from('youtube_oauth_sessions')
      .insert({
        user_id: userId,
        channels: channels,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: tokens.expires_in 
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null,
      })
      .select('id')
      .single();

    if (sessionError) {
      console.error('[youtube-callback] Failed to create session:', sessionError);
      throw new Error('Failed to create channel selection session');
    }

    console.log('[youtube-callback] Session created with encrypted tokens:', session.id);

    // Redirect to selection UI
    const redirectUrl = new URL('/social-analytics', productionRedirectBase);
    redirectUrl.searchParams.set('connected', 'youtube');
    redirectUrl.searchParams.set('tab', 'youtube');
    redirectUrl.searchParams.set('yt_select_session', session.id);
    
    console.log('[youtube-callback] Redirecting to channel selection');
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl.toString(),
      },
    });
  } catch (error) {
    console.error('[youtube-callback] Error:', error);
    
    const redirectUrl = new URL('/social-analytics', productionRedirectBase);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    redirectUrl.searchParams.set('youtube_error', errorMessage);
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl.toString(),
      },
    });
  }
});

async function connectSingleChannel(
  supabase: any,
  supabaseUrl: string,
  userId: string,
  channel: { id: string; title: string; thumbnail: string; subscriberCount: number; videoCount: number },
  tokens: { access_token: string; refresh_token?: string; expires_in?: number },
  productionRedirectBase: string
) {
  console.log('[youtube-callback] Auto-connecting single channel:', channel.title);

  // Encrypt tokens before storing
  const encryptedAccessToken = await encryptToken(tokens.access_token);
  const encryptedRefreshToken = tokens.refresh_token 
    ? await encryptToken(tokens.refresh_token) 
    : null;
  
  console.log('[youtube-callback] Tokens encrypted');

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from('social_media_profiles')
    .select('id')
    .eq('user_id', userId)
    .eq('platform', 'youtube')
    .eq('platform_user_id', channel.id)
    .single();

  const profileData = {
    user_id: userId,
    platform: 'youtube',
    platform_user_id: channel.id,
    username: channel.title,
    profile_picture: channel.thumbnail,
    followers_count: channel.subscriberCount,
    media_count: channel.videoCount,
    access_token: encryptedAccessToken,
    refresh_token: encryptedRefreshToken,
    token_expires_at: tokens.expires_in 
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    connected_at: new Date().toISOString(),
    last_sync_at: new Date().toISOString(),
    sync_status: 'pending',
  };

  let savedProfile;
  if (existingProfile) {
    console.log('[youtube-callback] Updating existing YouTube profile:', existingProfile.id);
    const { data, error: updateError } = await supabase
      .from('social_media_profiles')
      .update(profileData)
      .eq('id', existingProfile.id)
      .select()
      .single();

    if (updateError) {
      console.error('[youtube-callback] Failed to update profile:', updateError);
      throw new Error('Failed to update YouTube profile');
    }
    savedProfile = data;
  } else {
    console.log('[youtube-callback] Creating new YouTube profile for user:', userId);
    const { data, error: insertError } = await supabase
      .from('social_media_profiles')
      .insert(profileData)
      .select()
      .single();

    if (insertError) {
      console.error('[youtube-callback] Failed to insert profile:', insertError);
      throw new Error('Failed to save YouTube profile');
    }
    savedProfile = data;
  }

  console.log('[youtube-callback] Profile saved with encrypted tokens:', savedProfile?.id);

  // Trigger sync (fire and forget)
  try {
    const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-youtube-channel-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        user_id: userId,
        profile_id: savedProfile?.id,
      }),
    });
    console.log('[youtube-callback] Sync triggered, status:', syncResponse.status);
  } catch (syncError) {
    console.error('[youtube-callback] Failed to trigger sync (non-blocking):', syncError);
  }

  // Redirect to production URL with tab param
  const redirectUrl = new URL('/social-analytics', productionRedirectBase);
  redirectUrl.searchParams.set('connected', 'youtube');
  redirectUrl.searchParams.set('tab', 'youtube');
  
  console.log('[youtube-callback] Redirecting to:', redirectUrl.toString());
  return new Response(null, {
    status: 302,
    headers: {
      'Location': redirectUrl.toString(),
    },
  });
}
