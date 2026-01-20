import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorReason = url.searchParams.get('error_reason');

    const META_APP_ID = Deno.env.get('META_APP_ID');
    const META_APP_SECRET = Deno.env.get('META_APP_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://seeksy.io';

    if (error) {
      console.error(`[instagram-callback] OAuth error: ${error} - ${errorReason}`);
      return Response.redirect(`${FRONTEND_URL}/broadcast-monitoring?error=instagram_denied`);
    }

    if (!code || !state) {
      console.error('[instagram-callback] Missing code or state');
      return Response.redirect(`${FRONTEND_URL}/broadcast-monitoring?error=missing_params`);
    }

    // Decode state
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch (e) {
      console.error('[instagram-callback] Invalid state:', e);
      return Response.redirect(`${FRONTEND_URL}/broadcast-monitoring?error=invalid_state`);
    }

    const { userId, purpose } = stateData;
    console.log(`[instagram-callback] Processing callback for user ${userId}`);

    // Exchange code for access token
    const redirectUri = `${SUPABASE_URL}/functions/v1/instagram-callback`;
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', META_APP_ID!);
    tokenUrl.searchParams.set('client_secret', META_APP_SECRET!);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('[instagram-callback] Token exchange error:', tokenData.error);
      return Response.redirect(`${FRONTEND_URL}/broadcast-monitoring?error=token_exchange_failed`);
    }

    const { access_token } = tokenData;
    console.log('[instagram-callback] Got Facebook access token');

    // Get user's Instagram Business Account via Facebook Pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${access_token}`
    );
    const pagesData = await pagesResponse.json();

    let instagramAccountId = null;
    let instagramUsername = null;
    let pageAccessToken = access_token;

    // Find Instagram account connected to a Facebook Page
    if (pagesData.data && pagesData.data.length > 0) {
      for (const page of pagesData.data) {
        const igResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token || access_token}`
        );
        const igData = await igResponse.json();
        
        if (igData.instagram_business_account) {
          instagramAccountId = igData.instagram_business_account.id;
          pageAccessToken = page.access_token || access_token;
          
          // Get Instagram username
          const igProfileResponse = await fetch(
            `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=username,name,profile_picture_url&access_token=${pageAccessToken}`
          );
          const igProfile = await igProfileResponse.json();
          instagramUsername = igProfile.username;
          
          console.log(`[instagram-callback] Found Instagram account: ${instagramUsername} (${instagramAccountId})`);
          break;
        }
      }
    }

    if (!instagramAccountId) {
      console.error('[instagram-callback] No Instagram Business Account found');
      return Response.redirect(`${FRONTEND_URL}/broadcast-monitoring?error=no_instagram_business_account`);
    }

    // Store in database
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Upsert social media profile
    const { error: upsertError } = await supabase
      .from('social_media_profiles')
      .upsert({
        user_id: userId,
        platform: 'instagram',
        platform_user_id: instagramAccountId,
        username: instagramUsername,
        access_token: pageAccessToken,
        purpose: purpose || 'content_protection',
        connected_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,platform,purpose'
      });

    if (upsertError) {
      console.error('[instagram-callback] Database error:', upsertError);
      return Response.redirect(`${FRONTEND_URL}/broadcast-monitoring?error=database_error`);
    }

    console.log(`[instagram-callback] Successfully connected Instagram for user ${userId}`);
    return Response.redirect(`${FRONTEND_URL}/broadcast-monitoring?instagram=connected`);
  } catch (error) {
    console.error('[instagram-callback] Error:', error);
    const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://seeksy.io';
    return Response.redirect(`${FRONTEND_URL}/broadcast-monitoring?error=unknown`);
  }
});
