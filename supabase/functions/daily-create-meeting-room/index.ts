import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { meetingId, meetingTitle, enableWaitingRoom = true } = await req.json();

    if (!meetingId) {
      throw new Error('Meeting ID is required');
    }

    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY');
    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY not configured');
    }

    // Generate unique room name
    const roomName = `meeting-${meetingId}-${Date.now()}`;

    console.log('Creating Daily meeting room:', roomName, 'Waiting room:', enableWaitingRoom);

    // Create Daily room with waiting room (lobby) and cloud recording
    const roomResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          enable_recording: 'cloud',
          enable_advanced_chat: true,
          enable_screenshare: true,
          enable_knocking: enableWaitingRoom, // This enables waiting room/lobby
          max_participants: 25,
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });

    if (!roomResponse.ok) {
      const error = await roomResponse.text();
      console.error('Daily API error creating room:', error);
      throw new Error(`Daily API error: ${roomResponse.status}`);
    }

    const roomData = await roomResponse.json();
    console.log('Room created:', roomData.name);

    // Create owner token (host)
    const ownerTokenResponse = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          is_owner: true,
          user_id: user.id,
          user_name: user.email?.split('@')[0] || 'Host',
          enable_recording: 'cloud',
          start_cloud_recording: false,
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
        },
      }),
    });

    if (!ownerTokenResponse.ok) {
      const error = await ownerTokenResponse.text();
      console.error('Daily API error creating token:', error);
      throw new Error(`Daily API token error: ${ownerTokenResponse.status}`);
    }

    const tokenData = await ownerTokenResponse.json();

    // Update meeting record with Daily room info
    const { error: updateError } = await supabaseClient
      .from('meetings')
      .update({
        room_name: roomData.name,
        room_url: roomData.url,
        is_active: true,
        waiting_room_enabled: enableWaitingRoom,
      })
      .eq('id', meetingId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    // Add host as participant
    await supabaseClient
      .from('meeting_participants')
      .insert({
        meeting_id: meetingId,
        user_id: user.id,
        role: 'host',
        joined_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({
        roomUrl: roomData.url,
        roomName: roomData.name,
        token: tokenData.token,
        isHost: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in daily-create-meeting-room:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
