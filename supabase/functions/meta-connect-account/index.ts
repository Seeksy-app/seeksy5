import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { platform, code, redirectUri } = await req.json();

    if (!platform || !code || !redirectUri) {
      throw new Error('Missing platform, code, or redirectUri');
    }

    const metaAppId = Deno.env.get('META_APP_ID');
    const metaAppSecret = Deno.env.get('META_APP_SECRET');

    if (!metaAppId || !metaAppSecret) {
      throw new Error('Meta credentials not configured');
    }

    // Exchange code for access token - use the SAME redirect_uri as the initial OAuth request
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${metaAppId}&` +
      `client_secret=${metaAppSecret}&` +
      `code=${code}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}`
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Meta token exchange failed:', errorData);
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user's Instagram Business accounts
    let platformUserId = '';
    let platformUsername = '';
    let isBusinessAccount = false;
    let accountMetadata: any = {};

    if (platform === 'instagram') {
      // Get Facebook Pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
      );
      const pagesData = await pagesResponse.json();
      
      console.log('Facebook Pages response:', JSON.stringify(pagesData, null, 2));

      if (pagesData.data && pagesData.data.length > 0) {
        // Try each page to find one with an Instagram Business Account
        let foundInstagram = false;
        
        for (const page of pagesData.data) {
          const pageId = page.id;
          const igResponse = await fetch(
            `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
          );
          const igData = await igResponse.json();
          
          console.log(`Instagram check for page ${pageId}:`, JSON.stringify(igData, null, 2));

          if (igData.instagram_business_account) {
            platformUserId = igData.instagram_business_account.id;
            foundInstagram = true;
            
            // Get Instagram account details
            const igAccountResponse = await fetch(
              `https://graph.facebook.com/v18.0/${platformUserId}?fields=username,name,profile_picture_url&access_token=${accessToken}`
            );
            const igAccountData = await igAccountResponse.json();
            
            console.log('Instagram account details:', JSON.stringify(igAccountData, null, 2));
            
            platformUsername = igAccountData.username || '';
            isBusinessAccount = true;
            accountMetadata = {
              name: igAccountData.name,
              profile_picture_url: igAccountData.profile_picture_url,
              page_id: pageId,
            };
            
            break; // Found Instagram, stop checking other pages
          }
        }
        
        if (!foundInstagram) {
          throw new Error('No Instagram Business Account found linked to your Facebook Pages. Please link your Instagram Business account to a Facebook Page in your Instagram settings.');
        }
      } else {
        throw new Error('No Facebook Pages found. Please create a Facebook Page and link your Instagram Business account to it.');
      }
    } else if (platform === 'facebook') {
      // Get Facebook Pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
      );
      const pagesData = await pagesResponse.json();

      if (pagesData.data && pagesData.data.length > 0) {
        const page = pagesData.data[0];
        platformUserId = page.id;
        platformUsername = page.name;
        isBusinessAccount = true;
        accountMetadata = {
          category: page.category,
          access_token: page.access_token, // Page-specific token
        };
      }
    }

    if (!platformUserId) {
      throw new Error(`No ${platform} account found`);
    }

    // Get long-lived token (60 days)
    const longLivedTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${metaAppId}&` +
      `client_secret=${metaAppSecret}&` +
      `fb_exchange_token=${accessToken}`
    );

    const longLivedTokenData = await longLivedTokenResponse.json();
    const longLivedToken = longLivedTokenData.access_token;
    const expiresIn = longLivedTokenData.expires_in || 5184000; // Default to 60 days in seconds

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    
    console.log('Long-lived token obtained, expires in:', expiresIn, 'seconds');

    // Store in social_media_accounts (legacy table)
    const { data: socialAccount, error: insertError } = await supabase
      .from('social_media_accounts')
      .upsert({
        user_id: user.id,
        platform,
        platform_user_id: platformUserId,
        platform_username: platformUsername,
        access_token: longLivedToken,
        token_expires_at: expiresAt,
        is_business_account: isBusinessAccount,
        account_metadata: accountMetadata,
      }, {
        onConflict: 'user_id,platform,platform_user_id'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    // Also create/update social_media_profiles for new social graph sync system
    const { data: socialProfile, error: profileError } = await supabase
      .from('social_media_profiles')
      .upsert({
        user_id: user.id,
        platform,
        platform_user_id: platformUserId,
        username: platformUsername,
        profile_picture: accountMetadata?.profile_picture_url || null,
        account_type: isBusinessAccount ? 'business' : 'personal',
        access_token: longLivedToken,
        token_expires_at: expiresAt,
        connected_at: new Date().toISOString(),
        sync_status: 'pending',
      }, {
        onConflict: 'user_id,platform,platform_user_id'
      })
      .select()
      .single();

    if (profileError) {
      console.error('Social profile insert error:', profileError);
      // Don't fail if social_media_profiles insert fails - legacy table is primary
    }

    console.log(`${platform} account connected for user ${user.id}: @${platformUsername}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        account: {
          platform,
          username: platformUsername,
          is_business_account: isBusinessAccount,
        },
        profile_id: socialProfile?.id || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in meta-connect-account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
