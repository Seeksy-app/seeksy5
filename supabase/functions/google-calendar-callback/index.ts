import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken } from "../_shared/token-encryption.ts";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // user_id
    const error = url.searchParams.get('error');

    console.log('[google-calendar-callback] Processing OAuth callback');

    if (error) {
      console.error('[google-calendar-callback] OAuth error:', error);
      return new Response(null, {
        status: 302,
        headers: { Location: `https://seeksy.io/integrations?error=oauth_failed` }
      });
    }

    if (!code || !state) {
      console.error('[google-calendar-callback] Missing code or state');
      throw new Error('Missing code or state');
    }

    // Validate state is a valid UUID (user_id)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(state)) {
      console.error('[google-calendar-callback] Invalid state format');
      throw new Error('Invalid state parameter');
    }

    const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[google-calendar-callback] Token exchange failed:', errorText);
      throw new Error('Failed to exchange token');
    }

    const tokens = await tokenResponse.json();
    console.log('[google-calendar-callback] Received tokens for user:', state);

    // Get user's calendar email
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    
    const userInfo = await userInfoResponse.json();
    const calendarEmail = userInfo.email;

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
    
    console.log('[google-calendar-callback] Tokens encrypted successfully');

    // Check if connection already exists
    const { data: existing } = await supabaseAdmin
      .from('calendar_connections')
      .select('id')
      .eq('user_id', state)
      .eq('provider', 'google')
      .single();

    if (existing) {
      // Update existing
      const { error: updateError } = await supabaseAdmin
        .from('calendar_connections')
        .update({
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expiry: expiryDate.toISOString(),
          calendar_email: calendarEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      // Insert new
      const { error: insertError } = await supabaseAdmin
        .from('calendar_connections')
        .insert({
          user_id: state,
          provider: 'google',
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expiry: expiryDate.toISOString(),
          calendar_email: calendarEmail,
        });

      if (insertError) throw insertError;
    }

    console.log('[google-calendar-callback] Successfully stored encrypted calendar connection for user:', state);

    // Redirect back to integrations page on custom domain
    return new Response(null, {
      status: 302,
      headers: { Location: `https://seeksy.io/integrations?google_success=true` }
    });
  } catch (error) {
    console.error('[google-calendar-callback] Error:', error);
    return new Response(null, {
      status: 302,
      headers: { Location: `https://seeksy.io/integrations?error=google_connection_failed` }
    });
  }
});
