import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Reuse existing Google Business OAuth credentials
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_BUSINESS_CLIENT_ID');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

// Read-only scopes for GSC and GA4
const SCOPE_MAP = {
  gsc: 'https://www.googleapis.com/auth/webmasters.readonly',
  ga4: 'https://www.googleapis.com/auth/analytics.readonly',
};

const BASE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'openid',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, workspace_id, products, redirect_url } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!workspace_id) {
      return new Response(JSON.stringify({ error: 'workspace_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return new Response(JSON.stringify({ error: 'products array is required (gsc, ga4)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!GOOGLE_CLIENT_ID) {
      console.error('GOOGLE_BUSINESS_CLIENT_ID not configured');
      return new Response(JSON.stringify({ error: 'OAuth not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build scopes based on selected products
    const productScopes = products
      .filter((p: string) => SCOPE_MAP[p as keyof typeof SCOPE_MAP])
      .map((p: string) => SCOPE_MAP[p as keyof typeof SCOPE_MAP]);

    const allScopes = [...BASE_SCOPES, ...productScopes].join(' ');

    const state = btoa(JSON.stringify({
      user_id,
      workspace_id,
      products,
      redirect_url: redirect_url || 'https://preview--seeksy.lovable.app/admin/analytics'
    }));

    const redirectUri = `${SUPABASE_URL}/functions/v1/google-analytics-callback`;

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', allScopes);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    console.log('Generated Analytics OAuth URL for user:', user_id, 'workspace:', workspace_id, 'products:', products);

    return new Response(JSON.stringify({ auth_url: authUrl.toString() }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Analytics Auth error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
