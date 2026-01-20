import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken } from "../_shared/token-encryption.ts";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Parse state to get userId and returnPath
    let userId: string | null = null;
    let returnPath = '/email-settings';
    
    if (stateParam) {
      try {
        const decoded = atob(stateParam);
        const stateData = JSON.parse(decoded);
        userId = stateData.userId;
        returnPath = stateData.returnPath || '/email-settings';
      } catch {
        // Fallback: state might be just the user_id (old format)
        userId = stateParam;
      }
    }

    console.log('Gmail callback - userId:', userId, 'returnPath:', returnPath);

    if (error) {
      console.error('OAuth error:', error);
      return new Response(null, {
        status: 302,
        headers: { Location: `https://seeksy.io${returnPath}?error=oauth_failed` }
      });
    }

    if (!code || !userId) {
      throw new Error('Missing code or state');
    }

    const clientId = Deno.env.get('GMAIL_CLIENT_ID');
    const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/gmail-callback`;

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
      console.error('Token exchange failed:', errorText);
      throw new Error('Failed to exchange token');
    }

    const tokens = await tokenResponse.json();
    console.log('Received Gmail tokens for user:', userId);

    // Get user's email
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    
    const userInfo = await userInfoResponse.json();
    const email = userInfo.email;

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
    
    console.log('Tokens encrypted successfully');

    // Check if this email account already exists for this user
    const { data: existing } = await supabaseAdmin
      .from('email_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('email_address', email)
      .maybeSingle();

    if (existing) {
      // Update existing account tokens
      const { error: updateError } = await supabaseAdmin
        .from('email_accounts')
        .update({
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: expiryDate.toISOString(),
          is_active: true,
          connected_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      // Check if user has any accounts to determine if this should be default
      const { data: userAccounts } = await supabaseAdmin
        .from('email_accounts')
        .select('id')
        .eq('user_id', userId);
      
      const isFirstAccount = !userAccounts || userAccounts.length === 0;
      
      // Insert new account
      const { error: insertError } = await supabaseAdmin
        .from('email_accounts')
        .insert({
          user_id: userId,
          email_address: email,
          provider: 'gmail',
          display_name: userInfo.name || email,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: expiryDate.toISOString(),
          is_active: true,
          is_default: isFirstAccount,
          connected_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;
    }

    console.log('Successfully stored encrypted Gmail account for user:', userId);

    // Determine the base URL - use origin from referer or fall back to seeksy.io
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // Extract the project ref from SUPABASE_URL to build the correct Lovable preview URL
    const projectRef = supabaseUrl.includes('.supabase.co') 
      ? supabaseUrl.replace('https://', '').replace('.supabase.co', '')
      : null;
    
    // Use Lovable preview URL if we can detect it, otherwise fallback to seeksy.io
    const baseUrl = projectRef 
      ? `https://${projectRef}.lovableproject.com`
      : 'https://seeksy.io';
    
    return new Response(null, {
      status: 302,
      headers: { Location: `${baseUrl}${returnPath}?success=gmail_connected` }
    });
  } catch (error) {
    console.error('Error in gmail-callback:', error);
    return new Response(null, {
      status: 302,
      headers: { Location: `https://seeksy.io/email-settings?error=connection_failed` }
    });
  }
});