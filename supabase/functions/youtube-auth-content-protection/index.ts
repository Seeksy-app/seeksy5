import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('YOUTUBE_CLIENT_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    if (!clientId || !supabaseUrl) {
      console.error('[youtube-auth-content-protection] Missing credentials');
      throw new Error('Missing YouTube credentials');
    }

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[youtube-auth-content-protection] Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('[youtube-auth-content-protection] Initiated for user:', user.id);

    // Use a separate callback for content protection
    const redirectUri = `${supabaseUrl}/functions/v1/youtube-callback-content-protection`;
    
    // YouTube OAuth scopes for reading channel and video data
    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
    ].join(' ');

    // Encode user_id and purpose in state parameter
    const state = btoa(JSON.stringify({ 
      user_id: user.id,
      purpose: 'content_protection'
    }));

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    console.log('[youtube-auth-content-protection] Generated auth URL');

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[youtube-auth-content-protection] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
