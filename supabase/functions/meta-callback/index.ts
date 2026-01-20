import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { encryptToken } from "../_shared/token-encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Production redirect URL
const FRONTEND_URL = 'https://seeksy.io';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[meta-callback] Processing Meta OAuth callback');

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // user_id
    const error = url.searchParams.get('error');

    if (error) {
      console.error('[meta-callback] OAuth error:', error);
      return Response.redirect(`${FRONTEND_URL}/social-analytics?error=${error}`, 302);
    }

    if (!code || !state) {
      console.error('[meta-callback] Missing code or state parameter');
      return Response.redirect(`${FRONTEND_URL}/social-analytics?error=missing_params`, 302);
    }

    // Validate state is a valid UUID (user_id)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(state)) {
      console.error('[meta-callback] Invalid state format');
      return Response.redirect(`${FRONTEND_URL}/social-analytics?error=invalid_state`, 302);
    }

    console.log('[meta-callback] User ID from state:', state);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const metaAppId = Deno.env.get('META_APP_ID');
    const metaAppSecret = Deno.env.get('META_APP_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/meta-callback`;

    if (!metaAppId || !metaAppSecret) {
      console.error('[meta-callback] Meta credentials not configured');
      return Response.redirect(`${FRONTEND_URL}/social-analytics?error=config_error`, 302);
    }

    // Exchange code for access token
    console.log('[meta-callback] Exchanging code for access token');
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', metaAppId);
    tokenUrl.searchParams.set('client_secret', metaAppSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('[meta-callback] Token exchange failed:', tokenData);
      return Response.redirect(`${FRONTEND_URL}/social-analytics?error=token_failed`, 302);
    }

    const accessToken = tokenData.access_token;
    console.log('[meta-callback] Access token obtained successfully');

    // Get user's Facebook pages
    console.log('[meta-callback] Fetching user pages');
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,picture,fan_count,followers_count&access_token=${accessToken}`
    );
    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok) {
      console.error('[meta-callback] Failed to fetch pages:', pagesData);
      return Response.redirect(`${FRONTEND_URL}/social-analytics?error=pages_failed`, 302);
    }

    const pages = pagesData.data || [];
    console.log('[meta-callback] Found pages:', pages.length);

    // Process Instagram Business Accounts
    let instagramConnected = false;
    for (const page of pages) {
      try {
        console.log('[meta-callback] Checking page for Instagram:', page.name, page.id);
        
        const igResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account{id,username,profile_picture_url,followers_count,follows_count,media_count,biography}&access_token=${page.access_token}`
        );
        const igData = await igResponse.json();

        if (igData.instagram_business_account) {
          const igAccount = igData.instagram_business_account;
          console.log('[meta-callback] Found Instagram account:', igAccount.username);

          // Encrypt the page access token before storing
          const encryptedAccessToken = await encryptToken(page.access_token);
          console.log('[meta-callback] Instagram token encrypted');

          // Insert into social_media_profiles table
          const { error: insertError } = await supabaseClient
            .from('social_media_profiles')
            .upsert({
              user_id: state,
              platform: 'instagram',
              platform_user_id: igAccount.id,
              username: igAccount.username,
              profile_picture: igAccount.profile_picture_url,
              account_type: 'business',
              biography: igAccount.biography || null,
              followers_count: igAccount.followers_count || 0,
              follows_count: igAccount.follows_count || 0,
              media_count: igAccount.media_count || 0,
              access_token: encryptedAccessToken,
              connected_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              sync_status: 'pending',
            }, {
              onConflict: 'user_id,platform,platform_user_id',
            });

          if (insertError) {
            console.error('[meta-callback] Error inserting Instagram profile:', insertError);
          } else {
            console.log('[meta-callback] Successfully stored encrypted Instagram profile:', igAccount.username);
            instagramConnected = true;
          }
        }
      } catch (err) {
        console.error('[meta-callback] Error processing page for Instagram:', page.id, err);
      }
    }

    // Process Facebook Pages for direct connection
    // Build list of pages with their data
    const fbPages = pages.map((page: any) => ({
      id: page.id,
      name: page.name,
      picture: page.picture?.data?.url || '',
      fans: page.fan_count || page.followers_count || 0,
      access_token: page.access_token,
    }));

    console.log('[meta-callback] Facebook pages available:', fbPages.length);

    // Determine redirect behavior for Facebook
    let fbRedirectParam = '';
    
    if (fbPages.length === 1) {
      // Auto-connect single Facebook Page
      const page = fbPages[0];
      console.log('[meta-callback] Auto-connecting single Facebook Page:', page.name);

      // Encrypt the page access token before storing
      const encryptedAccessToken = await encryptToken(page.access_token);
      console.log('[meta-callback] Facebook token encrypted');

      const { error: fbInsertError } = await supabaseClient
        .from('social_media_profiles')
        .upsert({
          user_id: state,
          platform: 'facebook',
          platform_user_id: page.id,
          username: page.name,
          profile_picture: page.picture,
          account_type: 'page',
          followers_count: page.fans,
          access_token: encryptedAccessToken,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sync_status: 'pending',
        }, {
          onConflict: 'user_id,platform,platform_user_id',
        });

      if (fbInsertError) {
        console.error('[meta-callback] Error inserting Facebook Page:', fbInsertError);
      } else {
        console.log('[meta-callback] Successfully stored encrypted Facebook Page:', page.name);
        fbRedirectParam = '&fb_connected=true';
      }
    } else if (fbPages.length > 1) {
      // Multiple pages - create selection session (tokens stored temporarily, encrypted when final selection made)
      console.log('[meta-callback] Multiple Facebook Pages, creating selection session');

      const { data: session, error: sessionError } = await supabaseClient
        .from('facebook_oauth_sessions')
        .insert({
          user_id: state,
          pages: fbPages,
          access_token: accessToken,
        })
        .select('id')
        .single();

      if (sessionError) {
        console.error('[meta-callback] Failed to create FB session:', sessionError);
      } else {
        console.log('[meta-callback] FB session created:', session.id);
        fbRedirectParam = `&fb_select_session=${session.id}`;
      }
    }

    // Trigger Instagram sync if connected
    if (instagramConnected) {
      try {
        console.log('[meta-callback] Triggering Instagram data sync for user:', state);
        await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/meta-sync-social-data`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({ user_id: state, platform: 'instagram' }),
          }
        );
        console.log('[meta-callback] Instagram sync triggered');
      } catch (syncErr) {
        console.error('[meta-callback] Error triggering Instagram sync:', syncErr);
      }
    }

    // Trigger Facebook sync if single page was auto-connected
    if (fbPages.length === 1) {
      try {
        console.log('[meta-callback] Triggering Facebook data sync for user:', state);
        await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/meta-sync-social-data`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({ user_id: state, platform: 'facebook' }),
          }
        );
        console.log('[meta-callback] Facebook sync triggered');
      } catch (syncErr) {
        console.error('[meta-callback] Error triggering Facebook sync:', syncErr);
      }
    }

    // Determine primary redirect based on what was connected
    let redirectUrl: string;
    if (instagramConnected) {
      redirectUrl = `${FRONTEND_URL}/social-analytics?connected=instagram&tab=instagram${fbRedirectParam}`;
    } else if (fbPages.length > 0) {
      redirectUrl = `${FRONTEND_URL}/social-analytics?connected=facebook&tab=facebook${fbRedirectParam}`;
    } else {
      redirectUrl = `${FRONTEND_URL}/social-analytics?error=no_accounts`;
    }

    console.log('[meta-callback] Redirecting to:', redirectUrl);
    return Response.redirect(redirectUrl, 302);
  } catch (error) {
    console.error('[meta-callback] Unhandled error:', error);
    return Response.redirect(`${FRONTEND_URL}/social-analytics?error=unknown`, 302);
  }
});
