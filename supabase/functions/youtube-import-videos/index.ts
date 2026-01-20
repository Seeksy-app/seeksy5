import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptToken } from "../_shared/token-encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    console.log('[youtube-import-videos] Starting import for user:', user.id);

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get YouTube connection for content protection (prefer content_protection purpose)
    let { data: youtubeProfile, error: profileError } = await supabase
      .from('social_media_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'youtube')
      .eq('purpose', 'content_protection')
      .maybeSingle();

    // If no content_protection connection, try analytics connection
    if (!youtubeProfile) {
      const { data: analyticsProfile } = await supabase
        .from('social_media_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'youtube')
        .eq('purpose', 'analytics')
        .maybeSingle();
      
      youtubeProfile = analyticsProfile;
    }

    if (profileError || !youtubeProfile) {
      console.error('[youtube-import-videos] No YouTube connection found');
      return new Response(
        JSON.stringify({ error: 'YouTube account not connected. Please connect your YouTube account first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[youtube-import-videos] Using YouTube profile:', youtubeProfile.id, 'purpose:', youtubeProfile.purpose);

    // Decrypt and refresh token if needed
    let accessToken: string;
    try {
      accessToken = await decryptToken(youtubeProfile.access_token);
    } catch (e) {
      console.error('[youtube-import-videos] Failed to decrypt token:', e);
      throw new Error('Failed to decrypt access token');
    }

    const tokenExpiry = youtubeProfile.token_expires_at ? new Date(youtubeProfile.token_expires_at) : null;
    
    if (tokenExpiry && tokenExpiry < new Date() && youtubeProfile.refresh_token) {
      console.log('[youtube-import-videos] Token expired, refreshing...');
      const decryptedRefreshToken = await decryptToken(youtubeProfile.refresh_token);
      
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('YOUTUBE_CLIENT_ID') || '',
          client_secret: Deno.env.get('YOUTUBE_CLIENT_SECRET') || '',
          refresh_token: decryptedRefreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        console.error('[youtube-import-videos] Token refresh failed');
        return new Response(
          JSON.stringify({ error: 'YouTube token expired. Please reconnect your YouTube account.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokens = await refreshResponse.json();
      accessToken = tokens.access_token;
      
      // Note: We should encrypt the new token, but for simplicity we'll just use it
      console.log('[youtube-import-videos] Token refreshed successfully');
    }

    // Fetch user's videos from YouTube
    console.log('[youtube-import-videos] Fetching videos from YouTube...');
    const videosResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=50&order=date',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!videosResponse.ok) {
      const errorText = await videosResponse.text();
      console.error('[youtube-import-videos] Failed to fetch videos:', errorText);
      throw new Error('Failed to fetch videos from YouTube');
    }

    const videosData = await videosResponse.json();
    const videoIds = videosData.items?.map((v: any) => v.id?.videoId).filter(Boolean);

    if (!videoIds || videoIds.length === 0) {
      console.log('[youtube-import-videos] No videos found');
      return new Response(
        JSON.stringify({ message: 'No videos found on your YouTube channel.', imported: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get video details with statistics
    const statsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!statsResponse.ok) {
      throw new Error('Failed to fetch video details');
    }

    const statsData = await statsResponse.json();
    const videos = statsData.items || [];

    console.log(`[youtube-import-videos] Found ${videos.length} videos`);

    // Get existing protected content to avoid duplicates
    const { data: existingContent } = await supabase
      .from('protected_content')
      .select('external_id')
      .eq('user_id', user.id)
      .eq('source', 'youtube');

    const existingIds = new Set(existingContent?.map(c => c.external_id) || []);

    // Filter out already protected videos
    const newVideos = videos.filter((video: any) => !existingIds.has(video.id));

    if (newVideos.length === 0) {
      console.log('[youtube-import-videos] All videos already protected');
      return new Response(
        JSON.stringify({ 
          message: 'All your YouTube videos are already protected!', 
          imported: 0,
          total: videos.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate hash for each video and insert
    const contentToInsert = await Promise.all(newVideos.map(async (video: any) => {
      const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(videoUrl + video.id);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fileHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      return {
        user_id: user.id,
        title: video.snippet?.title || 'Untitled Video',
        content_type: 'video',
        original_file_url: videoUrl,
        file_hash: fileHash,
        source: 'youtube',
        external_id: video.id,
        metadata: {
          channel_id: video.snippet?.channelId,
          channel_title: video.snippet?.channelTitle,
          thumbnail: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.default?.url,
          published_at: video.snippet?.publishedAt,
          duration: video.contentDetails?.duration,
          view_count: parseInt(video.statistics?.viewCount || '0', 10),
          like_count: parseInt(video.statistics?.likeCount || '0', 10),
        },
      };
    }));

    // Insert protected content
    const { data: insertedContent, error: insertError } = await supabase
      .from('protected_content')
      .insert(contentToInsert)
      .select();

    if (insertError) {
      console.error('[youtube-import-videos] Failed to insert content:', insertError);
      throw new Error('Failed to register videos for protection');
    }

    console.log(`[youtube-import-videos] Successfully imported ${insertedContent?.length || 0} videos`);

    // Return preview of imported content
    const preview = newVideos.slice(0, 5).map((video: any) => ({
      title: video.snippet?.title,
      thumbnail: video.snippet?.thumbnails?.default?.url,
      url: `https://www.youtube.com/watch?v=${video.id}`,
    }));

    return new Response(
      JSON.stringify({
        message: `Successfully imported ${newVideos.length} video(s) for content protection.`,
        imported: newVideos.length,
        total: videos.length,
        preview,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[youtube-import-videos] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to import YouTube videos' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
