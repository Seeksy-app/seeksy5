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
    const { meetingId, guestName, guestEmail } = await req.json();

    if (!meetingId) {
      throw new Error('Meeting ID is required');
    }

    const authHeader = req.headers.get('Authorization');
    
    // Use service role to bypass RLS for guests
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Also create user client if authenticated
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      authHeader ? { global: { headers: { Authorization: authHeader } } } : {}
    );

    // Get user if authenticated
    let user = null;
    let isHost = false;
    if (authHeader) {
      const { data: { user: authUser } } = await supabaseUser.auth.getUser();
      user = authUser;
    }

    // Get meeting details using service role (bypasses RLS)
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      console.error('Meeting query error:', meetingError);
      throw new Error('Meeting not found');
    }

    if (!meeting.room_name) {
      throw new Error('Meeting room not initialized. Host needs to start the meeting first.');
    }

    // Check if user is the host
    if (user && meeting.user_id === user.id) {
      isHost = true;
    }

    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY');
    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY not configured');
    }

    const participantName = user?.email?.split('@')[0] || guestName || 'Guest';

    // Create participant token
    const tokenResponse = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          room_name: meeting.room_name,
          is_owner: isHost,
          user_id: user?.id || `guest-${Date.now()}`,
          user_name: participantName,
          enable_recording: isHost ? 'cloud' : false,
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
        },
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Daily API error creating token:', error);
      throw new Error(`Daily API token error: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();

    // Add participant record using service role
    await supabaseAdmin
      .from('meeting_participants')
      .insert({
        meeting_id: meetingId,
        user_id: user?.id || null,
        role: isHost ? 'host' : 'guest',
        joined_at: new Date().toISOString(),
        guest_name: !user ? guestName : null,
        guest_email: !user ? guestEmail : null,
      });

    return new Response(
      JSON.stringify({
        roomUrl: meeting.room_url,
        roomName: meeting.room_name,
        token: tokenData.token,
        isHost,
        waitingRoomEnabled: meeting.waiting_room_enabled,
        meetingTitle: meeting.title,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in daily-join-meeting:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
