import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[meta-auth] Initiating Meta OAuth flow');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const metaAppId = Deno.env.get('META_APP_ID');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/meta-callback`;

    if (!metaAppId) {
      throw new Error('META_APP_ID not configured');
    }

    // Required permissions for Facebook Pages only
    // Note: instagram_manage_insights and instagram_basic are causing scope errors
    // Using minimal Facebook Page scopes for now
    const scopes = [
      'public_profile',
      'pages_show_list',
      'pages_read_engagement',
      'business_management',
    ].join(',');

    // Build Meta OAuth URL
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.set('client_id', metaAppId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', user.id); // Pass user ID as state for callback
    authUrl.searchParams.set('response_type', 'code');

    // Debug logging for OAuth URL parameters
    console.log('[meta-auth] ===== OAuth URL Debug =====');
    console.log('[meta-auth] META_APP_ID (client_id):', metaAppId);
    console.log('[meta-auth] Redirect URI:', redirectUri);
    console.log('[meta-auth] Scopes:', scopes);
    console.log('[meta-auth] State (user_id):', user.id);
    console.log('[meta-auth] Full OAuth URL:', authUrl.toString());
    console.log('[meta-auth] =============================');

    return new Response(JSON.stringify({ authUrl: authUrl.toString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[meta-auth] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
