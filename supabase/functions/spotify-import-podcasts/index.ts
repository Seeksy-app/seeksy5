import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptToken, encryptToken } from "../_shared/token-encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SpotifyShow {
  id: string;
  name: string;
  description: string;
  publisher: string;
  images: Array<{ url: string; height: number; width: number }>;
  external_urls: { spotify: string };
  total_episodes: number;
}

interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  release_date: string;
  duration_ms: number;
  audio_preview_url: string | null;
  external_urls: { spotify: string };
  images: Array<{ url: string; height: number; width: number }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Importing Spotify podcasts for user:', user.id);

    // Get user's Spotify connection
    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: spotifyConnection, error: connectionError } = await serviceClient
      .from('social_media_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'spotify')
      .maybeSingle();

    if (connectionError || !spotifyConnection) {
      return new Response(
        JSON.stringify({ error: 'Spotify not connected. Please connect your Spotify account first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt tokens
    let accessToken = await decryptToken(spotifyConnection.access_token);
    const refreshToken = await decryptToken(spotifyConnection.refresh_token);
    const tokenExpiry = new Date(spotifyConnection.token_expires_at);
    
    if (tokenExpiry <= new Date()) {
      console.log('Spotify token expired, refreshing...');
      accessToken = await refreshSpotifyToken(refreshToken, serviceClient, user.id);
    }

    // Fetch user's saved shows (podcasts)
    const showsResponse = await fetch('https://api.spotify.com/v1/me/shows?limit=50', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!showsResponse.ok) {
      const errorText = await showsResponse.text();
      console.error('Failed to fetch Spotify shows:', errorText);
      throw new Error('Failed to fetch podcasts from Spotify');
    }

    const showsData = await showsResponse.json();
    console.log(`Found ${showsData.items?.length || 0} saved shows`);

    const importedContent: any[] = [];

    // Import each show and its episodes
    for (const item of showsData.items || []) {
      const show: SpotifyShow = item.show;
      
      // Fetch episodes for this show
      const episodesResponse = await fetch(
        `https://api.spotify.com/v1/shows/${show.id}/episodes?limit=20`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      let episodes: SpotifyEpisode[] = [];
      if (episodesResponse.ok) {
        const episodesData = await episodesResponse.json();
        episodes = episodesData.items || [];
      }

      // Register content for protection
      for (const episode of episodes) {
        const { data: existingContent } = await serviceClient
          .from('protected_content')
          .select('id')
          .eq('user_id', user.id)
          .eq('source', 'spotify')
          .eq('external_id', episode.id)
          .maybeSingle();

        if (!existingContent) {
          // Generate file hash for uniqueness
          const hashInput = `spotify-${episode.id}-${episode.name}`;
          const encoder = new TextEncoder();
          const hashData = encoder.encode(hashInput);
          const hashBuffer = await crypto.subtle.digest('SHA-256', hashData);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

          const { data: newContent, error: insertError } = await serviceClient
            .from('protected_content')
            .insert({
              user_id: user.id,
              content_type: 'audio',
              title: episode.name,
              source: 'spotify',
              external_id: episode.id,
              original_file_url: episode.external_urls.spotify,
              file_hash: fileHash,
              duration_seconds: Math.floor(episode.duration_ms / 1000),
              proof_status: 'pending',
              metadata: {
                show_id: show.id,
                show_name: show.name,
                publisher: show.publisher,
                description: episode.description,
                release_date: episode.release_date,
                audio_preview_url: episode.audio_preview_url,
                thumbnail: episode.images?.[0]?.url || show.images?.[0]?.url,
              },
            })
            .select()
            .single();

          if (insertError) {
            console.error(`Failed to import episode ${episode.name}:`, insertError);
          } else if (newContent) {
            importedContent.push(newContent);
            console.log(`Imported episode: ${episode.name}`);
          }
        }
      }
    }

    console.log(`Successfully imported ${importedContent.length} episodes for content protection`);

    return new Response(
      JSON.stringify({
        success: true,
        imported: importedContent.length,
        message: `Imported ${importedContent.length} episodes for content protection`,
        content: importedContent.slice(0, 10), // Return first 10 for preview
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Spotify import error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function refreshSpotifyToken(refreshToken: string, supabase: any, userId: string): Promise<string> {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Spotify token');
  }

  const tokens = await response.json();

  // Encrypt new tokens before storing
  const encryptedAccessToken = await encryptToken(tokens.access_token);
  const encryptedRefreshToken = await encryptToken(tokens.refresh_token || refreshToken);

  // Update tokens in database
  await supabase
    .from('social_media_profiles')
    .update({
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    })
    .eq('user_id', userId)
    .eq('platform', 'spotify');

  return tokens.access_token;
}