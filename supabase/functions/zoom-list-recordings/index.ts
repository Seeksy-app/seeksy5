import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Refresh Zoom access token
async function refreshZoomToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get('ZOOM_CLIENT_ID');
  const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    console.error('Zoom credentials not configured');
    return null;
  }

  try {
    const response = await fetch('https://zoom.us/oauth/token', {
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
      console.error('Token refresh failed:', await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error refreshing Zoom token:', error);
    return null;
  }
}

// Fetch recordings from Zoom API
async function fetchZoomRecordings(accessToken: string, page: number = 1) {
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - 3); // Last 3 months
  
  const params = new URLSearchParams({
    from: fromDate.toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    page_size: '30',
    page_number: page.toString(),
  });

  const response = await fetch(`https://api.zoom.us/v2/users/me/recordings?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Zoom API error:', error);
    throw new Error(`Zoom API error: ${response.status}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== zoom-list-recordings function started ===');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get page from query params
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');

    // Check if Zoom is connected
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: zoomConnection, error: connError } = await serviceClient
      .from('zoom_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (connError || !zoomConnection) {
      console.log('No Zoom connection found for user:', user.id);
      return new Response(
        JSON.stringify({ 
          status: 'not_connected', 
          message: 'Please connect your Zoom account first.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token needs refresh
    let accessToken = zoomConnection.access_token;
    const expiresAt = new Date(zoomConnection.token_expires_at);
    
    if (expiresAt < new Date()) {
      console.log('Zoom token expired, refreshing...');
      const newTokens = await refreshZoomToken(zoomConnection.refresh_token);
      
      if (!newTokens) {
        // Mark connection as invalid
        await serviceClient
          .from('zoom_connections')
          .update({ status: 'invalid' })
          .eq('id', zoomConnection.id);

        return new Response(
          JSON.stringify({ 
            status: 'needs_reconnect', 
            message: 'Your Zoom connection has expired. Please reconnect your account.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update tokens
      const newExpiresAt = new Date();
      newExpiresAt.setSeconds(newExpiresAt.getSeconds() + newTokens.expires_in);

      await serviceClient
        .from('zoom_connections')
        .update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          token_expires_at: newExpiresAt.toISOString(),
        })
        .eq('id', zoomConnection.id);

      accessToken = newTokens.access_token;
    }

    // Fetch recordings
    const zoomData = await fetchZoomRecordings(accessToken, page);
    
    // Map to simplified format
    const recordings = (zoomData.meetings || []).map((meeting: any) => {
      // Find the main video file
      const videoFile = meeting.recording_files?.find((f: any) => 
        f.file_type === 'MP4' || f.recording_type === 'shared_screen_with_speaker_view'
      ) || meeting.recording_files?.[0];

      return {
        id: meeting.uuid,
        topic: meeting.topic || 'Untitled Recording',
        start_time: meeting.start_time,
        duration_seconds: meeting.duration ? meeting.duration * 60 : 0, // Zoom returns minutes
        thumbnail_url: null, // Zoom doesn't provide thumbnails directly
        download_url: videoFile?.download_url,
        play_url: videoFile?.play_url,
        file_size: videoFile?.file_size,
        created_at: meeting.start_time,
      };
    });

    console.log(`Returning ${recordings.length} recordings`);

    return new Response(
      JSON.stringify({
        status: 'ok',
        recordings,
        page_count: zoomData.page_count || 1,
        total_records: zoomData.total_records || recordings.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in zoom-list-recordings:', error);
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to fetch recordings' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
