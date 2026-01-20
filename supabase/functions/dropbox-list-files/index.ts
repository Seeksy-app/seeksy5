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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Not authenticated');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get Dropbox token from social_media_profiles
    const { data: profile } = await supabase
      .from('social_media_profiles')
      .select('access_token, refresh_token, token_expires_at')
      .eq('user_id', user.id)
      .eq('platform', 'dropbox')
      .single();

    if (!profile?.access_token) {
      throw new Error('Dropbox not connected. Please connect your Dropbox account first.');
    }
    
    const integration = {
      access_token: profile.access_token,
      refresh_token: profile.refresh_token,
      expires_at: profile.token_expires_at
    };

    let accessToken = integration.access_token;

    // Check if token is expired and refresh if needed
    if (integration.expires_at && new Date(integration.expires_at) < new Date()) {
      const appKey = Deno.env.get('DROPBOX_APP_KEY');
      const appSecret = Deno.env.get('DROPBOX_APP_SECRET');
      
      const refreshResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: integration.refresh_token,
          client_id: appKey!,
          client_secret: appSecret!,
        }),
      });

      if (refreshResponse.ok) {
        const newTokens = await refreshResponse.json();
        accessToken = newTokens.access_token;
        
        await supabase.from('social_media_profiles').update({
          access_token: newTokens.access_token,
          token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        }).eq('user_id', user.id).eq('platform', 'dropbox');
      }
    }

    const { path = '', cursor } = await req.json();

    // List files from Dropbox
    const listResponse = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: path || '',
        recursive: false,
        include_media_info: true,
        include_deleted: false,
        include_has_explicit_shared_members: false,
      }),
    });

    if (!listResponse.ok) {
      const error = await listResponse.text();
      console.error('Dropbox list error:', error);
      throw new Error('Failed to list Dropbox files');
    }

    const result = await listResponse.json();
    
    // Filter to only video files
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
    const files = result.entries.filter((entry: any) => {
      if (entry['.tag'] === 'folder') return true;
      const name = entry.name.toLowerCase();
      return videoExtensions.some(ext => name.endsWith(ext));
    });

    return new Response(
      JSON.stringify({ 
        files,
        hasMore: result.has_more,
        cursor: result.cursor 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Dropbox list files error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
