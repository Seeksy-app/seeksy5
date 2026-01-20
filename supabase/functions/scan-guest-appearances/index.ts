import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  platform: string;
  external_id: string;
  title: string;
  show_name: string | null;
  description: string | null;
  thumbnail_url: string | null;
  external_url: string;
  published_at: string | null;
  duration_seconds: number | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { searchName, platforms } = await req.json();
    
    if (!searchName) {
      throw new Error('Search name is required');
    }

    console.log(`Scanning for appearances of: ${searchName} on platforms:`, platforms);

    const results: SearchResult[] = [];

    // Search YouTube using YouTube Data API
    if (platforms.includes('youtube')) {
      const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
      if (youtubeApiKey) {
        try {
          const searchQuery = encodeURIComponent(`"${searchName}" podcast interview guest`);
          const ytResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&maxResults=25&key=${youtubeApiKey}`
          );
          
          if (ytResponse.ok) {
            const ytData = await ytResponse.json();
            
            for (const item of ytData.items || []) {
              // Get video details for duration
              const videoId = item.id.videoId;
              const detailsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${youtubeApiKey}`
              );
              
              let durationSeconds = null;
              if (detailsResponse.ok) {
                const detailsData = await detailsResponse.json();
                if (detailsData.items?.[0]?.contentDetails?.duration) {
                  // Parse ISO 8601 duration
                  const duration = detailsData.items[0].contentDetails.duration;
                  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                  if (match) {
                    const hours = parseInt(match[1] || '0');
                    const minutes = parseInt(match[2] || '0');
                    const seconds = parseInt(match[3] || '0');
                    durationSeconds = hours * 3600 + minutes * 60 + seconds;
                  }
                }
              }

              results.push({
                platform: 'youtube',
                external_id: videoId,
                title: item.snippet.title,
                show_name: item.snippet.channelTitle,
                description: item.snippet.description,
                thumbnail_url: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
                external_url: `https://www.youtube.com/watch?v=${videoId}`,
                published_at: item.snippet.publishedAt,
                duration_seconds: durationSeconds,
              });
            }
          }
        } catch (ytError) {
          console.error('YouTube search error:', ytError);
        }
      }
    }

    // Search Spotify using Spotify API
    if (platforms.includes('spotify')) {
      const spotifyClientId = Deno.env.get('SPOTIFY_CLIENT_ID');
      const spotifyClientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
      
      if (spotifyClientId && spotifyClientSecret) {
        try {
          // Get access token
          const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${btoa(`${spotifyClientId}:${spotifyClientSecret}`)}`
            },
            body: 'grant_type=client_credentials'
          });

          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;

            // Search for episodes
            const searchQuery = encodeURIComponent(searchName);
            const spotifyResponse = await fetch(
              `https://api.spotify.com/v1/search?q=${searchQuery}&type=episode&limit=25`,
              {
                headers: { 'Authorization': `Bearer ${accessToken}` }
              }
            );

            if (spotifyResponse.ok) {
              const spotifyData = await spotifyResponse.json();
              
              for (const episode of spotifyData.episodes?.items || []) {
                results.push({
                  platform: 'spotify',
                  external_id: episode.id,
                  title: episode.name,
                  show_name: episode.show?.name || null,
                  description: episode.description,
                  thumbnail_url: episode.images?.[0]?.url,
                  external_url: episode.external_urls?.spotify,
                  published_at: episode.release_date,
                  duration_seconds: Math.round((episode.duration_ms || 0) / 1000),
                });
              }
            }
          }
        } catch (spotifyError) {
          console.error('Spotify search error:', spotifyError);
        }
      }
    }

    console.log(`Found ${results.length} potential appearances`);

    // Save results to database (upsert to avoid duplicates)
    for (const result of results) {
      const { error: upsertError } = await supabase
        .from('guest_appearance_scans')
        .upsert({
          user_id: user.id,
          platform: result.platform,
          external_id: result.external_id,
          title: result.title,
          show_name: result.show_name,
          description: result.description,
          thumbnail_url: result.thumbnail_url,
          external_url: result.external_url,
          published_at: result.published_at,
          duration_seconds: result.duration_seconds,
          detection_method: 'metadata',
          is_verified: false,
        }, {
          onConflict: 'user_id,platform,external_id',
          ignoreDuplicates: true,
        });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scan error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
