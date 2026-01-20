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

    const { meetingNoteId } = await req.json();

    if (!meetingNoteId) {
      throw new Error('Meeting note ID is required');
    }

    // Get the meeting note
    const { data: meetingNote, error: meetingError } = await supabaseClient
      .from('board_meeting_notes')
      .select('*')
      .eq('id', meetingNoteId)
      .single();

    if (meetingError || !meetingNote) {
      throw new Error('Meeting note not found');
    }

    // Check if room already exists
    if (meetingNote.room_name && meetingNote.room_url) {
      // Return existing room info
      const tokenResponse = await createHostToken(meetingNote.room_name, user.id);
      return new Response(
        JSON.stringify({
          roomName: meetingNote.room_name,
          roomUrl: meetingNote.room_url,
          token: tokenResponse.token,
          isHost: true,
          meetingTitle: meetingNote.title,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY');
    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY not configured');
    }

    const roomName = `board-${meetingNoteId.substring(0, 8)}-${Date.now()}`;

    console.log('Creating Daily board room:', roomName);

    // Create Daily room with cloud recording enabled
    const roomResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          enable_chat: true,
          enable_screenshare: true,
          enable_knocking: false,
          enable_recording: 'cloud', // Enable cloud recording
          max_participants: 15,
          exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60),
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

    // Create host token
    const tokenResponse = await createHostToken(roomName, user.id, DAILY_API_KEY);

    // Generate guest token for shareable link
    const guestToken = crypto.randomUUID().replace(/-/g, '').substring(0, 24);

    // Update meeting note with room info and guest token
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await serviceClient
      .from('board_meeting_notes')
      .update({
        room_name: roomData.name,
        room_url: roomData.url,
        guest_token: guestToken,
        host_has_started: true,
        host_user_id: user.id,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', meetingNoteId);

    return new Response(
      JSON.stringify({
        roomName: roomData.name,
        roomUrl: roomData.url,
        token: tokenResponse.token,
        isHost: true,
        meetingTitle: meetingNote.title,
        guestToken: guestToken,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in daily-create-board-room:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createHostToken(roomName: string, userId: string, apiKey?: string): Promise<{ token: string }> {
  const DAILY_API_KEY = apiKey || Deno.env.get('DAILY_API_KEY');
  
  const tokenResponse = await fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: true,
        user_id: userId,
        user_name: 'Host',
        exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60),
      },
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error('Daily API error creating token:', error);
    throw new Error(`Daily API token error: ${tokenResponse.status}`);
  }

  return await tokenResponse.json();
}
