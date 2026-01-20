import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken } from "../_shared/token-encryption.ts";

serve(async (req) => {
  try {
    console.log('[zoom-callback] Processing OAuth callback');
    
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // user_id
    const error = url.searchParams.get('error');

    if (error) {
      console.error('[zoom-callback] OAuth error:', error);
      return new Response(null, {
        status: 302,
        headers: { Location: `https://seeksy.io/availability?error=zoom_oauth_failed` }
      });
    }

    if (!code || !state) {
      console.error('[zoom-callback] Missing code or state');
      throw new Error('Missing code or state');
    }

    // Validate state is a valid UUID (user_id)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(state)) {
      console.error('[zoom-callback] Invalid state format');
      throw new Error('Invalid state parameter');
    }

    const clientId = Deno.env.get('ZOOM_CLIENT_ID');
    const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/zoom-callback`;

    // Exchange code for tokens
    const credentials = btoa(`${clientId}:${clientSecret}`);
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[zoom-callback] Token exchange failed:', errorText);
      throw new Error('Failed to exchange token');
    }

    const tokens = await tokenResponse.json();
    console.log('[zoom-callback] Received Zoom tokens for user:', state);

    // Get user's Zoom info
    const userInfoResponse = await fetch('https://api.zoom.us/v2/users/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    
    const userInfo = await userInfoResponse.json();
    const zoomUserId = userInfo.id;
    const zoomEmail = userInfo.email;

    // Store tokens in database
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const expiryDate = new Date(Date.now() + (tokens.expires_in * 1000));

    // Encrypt tokens before storing
    const encryptedAccessToken = await encryptToken(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token 
      ? await encryptToken(tokens.refresh_token) 
      : null;
    
    console.log('[zoom-callback] Tokens encrypted successfully');

    // Check if connection already exists
    const { data: existing } = await supabaseAdmin
      .from('zoom_connections')
      .select('id')
      .eq('user_id', state)
      .single();

    if (existing) {
      // Update existing
      const { error: updateError } = await supabaseAdmin
        .from('zoom_connections')
        .update({
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expiry: expiryDate.toISOString(),
          zoom_user_id: zoomUserId,
          zoom_email: zoomEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      // Insert new
      const { error: insertError } = await supabaseAdmin
        .from('zoom_connections')
        .insert({
          user_id: state,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expiry: expiryDate.toISOString(),
          zoom_user_id: zoomUserId,
          zoom_email: zoomEmail,
        });

      if (insertError) throw insertError;
    }

    console.log('[zoom-callback] Successfully stored encrypted Zoom connection for user:', state);

    // Redirect back to availability page where users manage meeting settings
    return new Response(null, {
      status: 302,
      headers: { Location: `https://seeksy.io/availability?zoom_success=true` }
    });
  } catch (error) {
    console.error('[zoom-callback] Error:', error);
    return new Response(null, {
      status: 302,
      headers: { Location: `https://seeksy.io/integrations?error=zoom_connection_failed` }
    });
  }
});
