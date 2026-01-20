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

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('Spotify callback received - code:', !!code, 'state:', state, 'error:', error);

    if (error) {
      console.error('Spotify OAuth error:', error);
      return new Response(
        generateHtmlResponse(false, 'Authorization denied'),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code || !state) {
      return new Response(
        generateHtmlResponse(false, 'Missing authorization code or state'),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Decode state to get user_id
    let userId: string;
    try {
      const stateData = JSON.parse(atob(state));
      userId = stateData.user_id;
    } catch (e) {
      console.error('Failed to decode state:', e);
      return new Response(
        generateHtmlResponse(false, 'Invalid state parameter'),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    console.log('Processing Spotify callback for user:', userId);

    // Exchange code for tokens
    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const redirectUri = `${supabaseUrl}/functions/v1/spotify-callback`;

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return new Response(
        generateHtmlResponse(false, 'Failed to exchange authorization code'),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const tokens = await tokenResponse.json();
    console.log('Spotify tokens received for user:', userId);

    // Get Spotify user profile
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    let spotifyProfile = null;
    if (profileResponse.ok) {
      spotifyProfile = await profileResponse.json();
      console.log('Spotify profile:', spotifyProfile.display_name, spotifyProfile.id);
    }

    // Store tokens in database
    const supabase = createClient(
      supabaseUrl!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Encrypt tokens before storing
    const encryptedAccessToken = await encryptToken(tokens.access_token);
    const encryptedRefreshToken = await encryptToken(tokens.refresh_token);

    // Upsert the Spotify connection
    const { error: upsertError } = await supabase
      .from('social_media_profiles')
      .upsert({
        user_id: userId,
        platform: 'spotify',
        platform_user_id: spotifyProfile?.id || 'unknown',
        username: spotifyProfile?.display_name || spotifyProfile?.id,
        profile_picture: spotifyProfile?.images?.[0]?.url,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        email: spotifyProfile?.email,
        purpose: 'analytics',
      }, {
        onConflict: 'user_id,platform,purpose',
      });

    if (upsertError) {
      console.error('Failed to store Spotify connection:', upsertError);
      return new Response(
        generateHtmlResponse(false, 'Failed to save connection'),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    console.log('Spotify connection saved for user:', userId);

    return new Response(
      generateHtmlResponse(true, 'Spotify connected successfully!'),
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('Spotify callback error:', error);
    return new Response(
      generateHtmlResponse(false, 'An unexpected error occurred'),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
});

function generateHtmlResponse(success: boolean, message: string): string {
  const color = success ? '#22c55e' : '#ef4444';
  const icon = success ? '✓' : '✕';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Spotify Connection</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: rgba(255,255,255,0.1);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }
    .icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: ${color};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      margin: 0 auto 20px;
    }
    h1 { margin: 0 0 10px; font-size: 24px; }
    p { margin: 0; opacity: 0.8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${icon}</div>
    <h1>${success ? 'Connected!' : 'Connection Failed'}</h1>
    <p>${message}</p>
    <p style="margin-top: 20px; font-size: 14px;">You can close this window now.</p>
  </div>
  <script>
    setTimeout(() => {
      if (window.opener) {
        window.opener.postMessage({ 
          type: 'spotify-oauth-${success ? 'success' : 'error'}',
          ${success ? 'success: true' : `error: '${message}'`}
        }, '*');
        window.close();
      } else {
        window.location.href = '/integrations';
      }
    }, 2000);
  </script>
</body>
</html>`;
}