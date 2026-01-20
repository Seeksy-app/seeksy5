import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encryptToken } from "../_shared/token-encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[microsoft-callback] Processing OAuth callback');
    
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('[microsoft-callback] OAuth error:', error);
      return Response.redirect(`https://seeksy.io/integrations?error=microsoft_auth_failed`);
    }

    if (!code || !state) {
      console.error('[microsoft-callback] Missing code or state parameter');
      return Response.redirect(`https://seeksy.io/integrations?error=missing_params`);
    }

    // Decode state to get user ID
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch (e) {
      console.error('[microsoft-callback] Invalid state format');
      return Response.redirect(`https://seeksy.io/integrations?error=invalid_state`);
    }
    
    const userId = stateData.userId;

    // Validate userId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!userId || !uuidRegex.test(userId)) {
      console.error('[microsoft-callback] Invalid userId in state');
      return Response.redirect(`https://seeksy.io/integrations?error=invalid_state`);
    }

    console.log('[microsoft-callback] Processing for user:', userId);

    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const redirectUri = `${supabaseUrl}/functions/v1/microsoft-callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('[microsoft-callback] Token exchange failed:', errorData);
      return Response.redirect(`https://seeksy.io/integrations?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    console.log('[microsoft-callback] Successfully exchanged code for tokens');

    // Get user's email from Microsoft Graph API
    const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    let microsoftEmail = null;
    if (graphResponse.ok) {
      const userData = await graphResponse.json();
      microsoftEmail = userData.userPrincipalName || userData.mail;
      console.log('[microsoft-callback] Retrieved Microsoft email:', microsoftEmail);
    }

    // Encrypt tokens before storing
    const encryptedAccessToken = await encryptToken(tokenData.access_token);
    const encryptedRefreshToken = tokenData.refresh_token 
      ? await encryptToken(tokenData.refresh_token) 
      : null;
    
    console.log('[microsoft-callback] Tokens encrypted successfully');

    // Store tokens in database using service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    // Check if connection already exists
    const { data: existing } = await supabase
      .from('microsoft_connections')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from('microsoft_connections')
        .update({
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expiry: expiresAt,
          microsoft_email: microsoftEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('[microsoft-callback] Error updating Microsoft connection:', updateError);
        return Response.redirect(`https://seeksy.io/integrations?error=database_error`);
      }
    } else {
      // Insert new connection
      const { error: insertError } = await supabase
        .from('microsoft_connections')
        .insert({
          user_id: userId,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expiry: expiresAt,
          microsoft_email: microsoftEmail,
        });

      if (insertError) {
        console.error('[microsoft-callback] Error storing Microsoft connection:', insertError);
        return Response.redirect(`https://seeksy.io/integrations?error=database_error`);
      }
    }

    console.log('[microsoft-callback] Successfully stored encrypted Microsoft connection');
    return Response.redirect(`https://seeksy.io/integrations?microsoft_success=true`);
  } catch (error) {
    console.error('[microsoft-callback] Error:', error);
    return Response.redirect(`https://seeksy.io/integrations?error=callback_error`);
  }
});
