import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract YouTube video ID from various URL formats
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Fetch YouTube video metadata - try Data API first, fallback to oEmbed
async function fetchYouTubeMetadata(videoId: string) {
  const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
  
  // Try YouTube Data API first (has duration info)
  if (youtubeApiKey) {
    try {
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${youtubeApiKey}`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          const snippet = item.snippet;
          const contentDetails = item.contentDetails;
          
          // Parse ISO 8601 duration to seconds
          const duration = contentDetails?.duration;
          let durationSeconds = 0;
          if (duration) {
            const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (match) {
              const hours = parseInt(match[1] || '0');
              const minutes = parseInt(match[2] || '0');
              const seconds = parseInt(match[3] || '0');
              durationSeconds = hours * 3600 + minutes * 60 + seconds;
            }
          }
          
          console.log('YouTube API metadata fetched:', { title: snippet.title, duration: durationSeconds });
          
          return {
            title: snippet.title,
            thumbnail_url: snippet.thumbnails?.maxres?.url || 
                          snippet.thumbnails?.high?.url || 
                          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            author_name: snippet.channelTitle,
            description: snippet.description?.substring(0, 500),
            duration_seconds: durationSeconds,
          };
        }
      }
    } catch (error) {
      console.error('YouTube Data API error, falling back to oEmbed:', error);
    }
  }
  
  // Fallback to oEmbed (no API key needed, but no duration)
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      console.log('oEmbed failed, using defaults');
      return null;
    }
    
    const data = await response.json();
    return {
      title: data.title || `YouTube Video ${videoId}`,
      thumbnail_url: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      author_name: data.author_name,
      duration_seconds: null, // oEmbed doesn't provide duration
    };
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== import-youtube-video function started ===');
    
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { youtube_url, media_file_id } = body;

    console.log('Request body:', { youtube_url, media_file_id, user_id: user.id });

    // If we have a media_file_id, this is from the earlier create - just update status
    if (media_file_id && !youtube_url) {
      // This is a status check / background process trigger
      const { data: mediaFile, error: fetchError } = await supabaseClient
        .from('media_files')
        .select('*')
        .eq('id', media_file_id)
        .single();

      if (fetchError || !mediaFile) {
        return new Response(
          JSON.stringify({ status: 'error', message: 'Media file not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          status: 'queued', 
          media_file_id,
          message: 'YouTube import is being processed.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate YouTube URL
    if (!youtube_url) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'YouTube URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract video ID
    const videoId = extractYouTubeVideoId(youtube_url);
    if (!videoId) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Invalid YouTube URL. Please provide a valid YouTube video link.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracted video ID:', videoId);

    // Fetch metadata
    const metadata = await fetchYouTubeMetadata(videoId);
    const title = metadata?.title || `YouTube Import - ${videoId}`;
    const thumbnail = metadata?.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    console.log('Fetched metadata:', { title, thumbnail });

    // Create media_files row
    const { data: mediaFile, error: insertError } = await supabaseClient
      .from('media_files')
      .insert({
        user_id: user.id,
        file_name: title,
        file_type: 'video',
        file_url: youtube_url, // YouTube URL - can be played via embed
        source: 'youtube',
        external_id: videoId,
        original_source_url: youtube_url,
        thumbnail_url: thumbnail,
        duration_seconds: metadata?.duration_seconds || null,
        status: 'importing',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating media file:', insertError);
      return new Response(
        JSON.stringify({ status: 'error', message: 'Failed to create media record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Created media file:', mediaFile.id);

    // For now, mark as ready after metadata fetch
    // In production, this would trigger a background job for actual video download
    // Since we can't run yt-dlp in edge functions, we'll mark it ready with the YouTube URL
    // The video can be played directly or processed later
    
    const { error: updateError } = await supabaseClient
      .from('media_files')
      .update({
        status: 'ready',
        file_url: `https://www.youtube.com/watch?v=${videoId}`,
      })
      .eq('id', mediaFile.id);

    if (updateError) {
      console.error('Error updating media file status:', updateError);
    }

    return new Response(
      JSON.stringify({
        status: 'queued',
        media_file_id: mediaFile.id,
        message: 'YouTube video imported successfully. It may take a few moments to be fully ready.',
        video_id: videoId,
        title,
        thumbnail_url: thumbnail,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in import-youtube-video:', error);
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
