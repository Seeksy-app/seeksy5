import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Handle empty body gracefully (GET requests or empty POST)
    let body: { action?: string; code?: string; redirectUri?: string } = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // No body or invalid JSON
    }
    
    const { action, code, redirectUri } = body;
    
    const appKey = Deno.env.get('DROPBOX_APP_KEY');
    const appSecret = Deno.env.get('DROPBOX_APP_SECRET');
    
    if (!appKey || !appSecret) {
      throw new Error('Dropbox credentials not configured');
    }

    if (action === 'get_auth_url') {
      if (!redirectUri) {
        throw new Error('redirectUri is required');
      }
      // Generate OAuth URL for Dropbox
      console.log('Generating Dropbox auth URL with redirect_uri:', redirectUri);
      const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${appKey}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&token_access_type=offline`;
      console.log('Generated auth URL:', authUrl);
      
      return new Response(
        JSON.stringify({ authUrl, debug_redirect_uri: redirectUri }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'exchange_code') {
      if (!code || !redirectUri) {
        throw new Error('code and redirectUri are required');
      }
      // Exchange code for access token
      const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: appKey,
          client_secret: appSecret,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error('Token exchange error:', error);
        throw new Error('Failed to exchange authorization code');
      }

      const tokens = await tokenResponse.json();
      
      // Store token in social_media_profiles table
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
        );
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if profile exists
          const { data: existing } = await supabase
            .from('social_media_profiles')
            .select('id')
            .eq('user_id', user.id)
            .eq('platform', 'dropbox')
            .single();

          if (existing) {
            await supabase.from('social_media_profiles').update({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              token_expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
            }).eq('id', existing.id);
          } else {
            await supabase.from('social_media_profiles').insert({
              user_id: user.id,
              platform: 'dropbox',
              username: tokens.account_id,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              token_expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
            });
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, account_id: tokens.account_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Dropbox auth error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
