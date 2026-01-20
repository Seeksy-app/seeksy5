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
    console.log('[youtube-callback-content-protection] Processing OAuth callback');
    
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('[youtube-callback-content-protection] OAuth error:', error);
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    if (!state) {
      throw new Error('No state parameter received');
    }

    // Decode state to get user_id and purpose
    let userId: string;
    try {
      const stateData = JSON.parse(atob(state));
      userId = stateData.user_id;
      if (!userId) {
        throw new Error('No user_id in state');
      }
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new Error('Invalid user_id format');
      }
      
      console.log('[youtube-callback-content-protection] User ID:', userId);
    } catch (e) {
      console.error('[youtube-callback-content-protection] Failed to decode state:', e);
      throw new Error('Invalid state parameter');
    }

    const clientId = Deno.env.get('YOUTUBE_CLIENT_ID');
    const clientSecret = Deno.env.get('YOUTUBE_CLIENT_SECRET');

    if (!clientId || !clientSecret || !supabaseUrl) {
      throw new Error('Missing YouTube credentials');
    }

    const redirectUri = `${supabaseUrl}/functions/v1/youtube-callback-content-protection`;

    // Exchange code for tokens
    console.log('[youtube-callback-content-protection] Exchanging code for tokens...');
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
      console.error('[youtube-callback-content-protection] Token exchange failed:', errorData);
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();
    console.log('[youtube-callback-content-protection] Tokens received');

    // Fetch YouTube channel for this account
    console.log('[youtube-callback-content-protection] Fetching YouTube channel...');
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
      console.error('[youtube-callback-content-protection] Channel fetch failed:', errorData);
      throw new Error('Failed to fetch YouTube channel data');
    }

    const channelData = await channelResponse.json();

    if (!channelData.items || channelData.items.length === 0) {
      throw new Error('No YouTube channel found for this account');
    }

    const channel = channelData.items[0];
    console.log('[youtube-callback-content-protection] Channel:', channel.snippet?.title);

    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Encrypt tokens before storing
    const encryptedAccessToken = await encryptToken(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token 
      ? await encryptToken(tokens.refresh_token) 
      : null;

    // Check if content_protection connection already exists for this user
    const { data: existingProfile } = await supabase
      .from('social_media_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'youtube')
      .eq('purpose', 'content_protection')
      .single();

    const profileData = {
      user_id: userId,
      platform: 'youtube',
      platform_user_id: channel.id,
      username: channel.snippet?.title || 'Unknown Channel',
      profile_picture: channel.snippet?.thumbnails?.high?.url || channel.snippet?.thumbnails?.default?.url || '',
      followers_count: parseInt(channel.statistics?.subscriberCount || '0', 10),
      media_count: parseInt(channel.statistics?.videoCount || '0', 10),
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      token_expires_at: tokens.expires_in 
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      connected_at: new Date().toISOString(),
      last_sync_at: new Date().toISOString(),
      sync_status: 'active',
      purpose: 'content_protection',
    };

    if (existingProfile) {
      console.log('[youtube-callback-content-protection] Updating existing profile:', existingProfile.id);
      const { error: updateError } = await supabase
        .from('social_media_profiles')
        .update(profileData)
        .eq('id', existingProfile.id);

      if (updateError) {
        console.error('[youtube-callback-content-protection] Update failed:', updateError);
        throw new Error('Failed to update YouTube profile');
      }
    } else {
      console.log('[youtube-callback-content-protection] Creating new profile');
      const { error: insertError } = await supabase
        .from('social_media_profiles')
        .insert(profileData);

      if (insertError) {
        console.error('[youtube-callback-content-protection] Insert failed:', insertError);
        throw new Error('Failed to save YouTube profile');
      }
    }

    console.log('[youtube-callback-content-protection] Profile saved successfully');

    // Redirect to content protection page
    const redirectUrl = new URL('/content-protection', productionRedirectBase);
    redirectUrl.searchParams.set('connected', 'youtube');
    
    console.log('[youtube-callback-content-protection] Redirecting to:', redirectUrl.toString());
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl.toString(),
      },
    });
  } catch (error) {
    console.error('[youtube-callback-content-protection] Error:', error);
    
    const redirectUrl = new URL('/content-protection', productionRedirectBase);
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
