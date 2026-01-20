import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_BUSINESS_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_BUSINESS_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  
  try {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('Analytics OAuth callback received:', { 
      hasCode: !!code, 
      hasState: !!state, 
      error 
    });

    if (error) {
      console.error('OAuth error from Google:', error);
      return Response.redirect(`https://preview--seeksy.lovable.app/admin/analytics?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return new Response(JSON.stringify({ error: 'Missing code or state parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse state to get user_id, workspace_id, products
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      stateData = { 
        user_id: state, 
        workspace_id: null, 
        products: [],
        redirect_url: 'https://preview--seeksy.lovable.app/admin/analytics' 
      };
    }

    const { user_id, workspace_id, products, redirect_url } = stateData;

    if (!user_id || !workspace_id) {
      return new Response(JSON.stringify({ error: 'Invalid state - missing user_id or workspace_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Exchange code for tokens
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const redirectUri = `${SUPABASE_URL}/functions/v1/google-analytics-callback`;

    console.log('Exchanging code for tokens...');

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData);
      return Response.redirect(`${redirect_url || 'https://preview--seeksy.lovable.app/admin/analytics'}?error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`);
    }

    console.log('Token exchange successful');

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

    // Get user info from Google
    let googleEmail = '';
    
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      });
      
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        googleEmail = userInfo.email || '';
        console.log('Got Google user info:', { email: googleEmail });
      }
    } catch (err) {
      console.warn('Could not fetch user info:', err);
    }

    // Store tokens in google_connections table
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Check if connection already exists for this workspace
    const { data: existingConnection } = await supabase
      .from('google_connections')
      .select('id, enabled_products')
      .eq('workspace_id', workspace_id)
      .eq('provider', 'google')
      .single();

    if (existingConnection) {
      // Merge enabled_products
      const existingProducts = existingConnection.enabled_products || [];
      const mergedProducts = [...new Set([...existingProducts, ...products])];

      const { error: updateError } = await supabase
        .from('google_connections')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || undefined,
          expires_at: expiresAt,
          enabled_products: mergedProducts,
          google_account_email: googleEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id);

      if (updateError) {
        console.error('Error updating connection:', updateError);
        return Response.redirect(`${redirect_url}?error=${encodeURIComponent('Failed to update connection')}`);
      }
    } else {
      // Create new connection
      const { error: insertError } = await supabase
        .from('google_connections')
        .insert({
          workspace_id,
          provider: 'google',
          enabled_products: products,
          google_account_email: googleEmail,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt,
        });

      if (insertError) {
        console.error('Error creating connection:', insertError);
        return Response.redirect(`${redirect_url}?error=${encodeURIComponent('Failed to store connection')}`);
      }
    }

    // Log the connection in audit log
    for (const product of products) {
      await supabase
        .from('gbp_audit_log')
        .insert({
          actor_user_id: user_id,
          action_type: product === 'gsc' ? 'GSC_CONNECT' : 'GA4_CONNECT',
          status: 'success',
          request_json: { email: googleEmail, workspace_id, product },
        });
    }

    console.log('Connection stored successfully, redirecting...');

    // Redirect back to Analytics page
    return Response.redirect(`${redirect_url || 'https://preview--seeksy.lovable.app/admin/analytics'}?analytics_connected=true`);

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Analytics OAuth callback error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
