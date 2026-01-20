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

    // Check if room exists
    if (!meetingNote.room_name || !meetingNote.room_url) {
      throw new Error('Meeting room not started yet');
    }

    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY');
    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY not configured');
    }

    // Get user profile for display name
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, username')
      .eq('id', user.id)
      .single();

    const displayName = profile?.full_name || profile?.username || 'Board Member';

    console.log('Creating participant token for:', displayName);

    // Create participant token (not owner)
    const tokenResponse = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          room_name: meetingNote.room_name,
          is_owner: false,
          user_id: user.id,
          user_name: displayName,
          exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60),
        },
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Daily API error creating token:', error);
      throw new Error(`Daily API token error: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();

    return new Response(
      JSON.stringify({
        roomName: meetingNote.room_name,
        roomUrl: meetingNote.room_url,
        token: tokenData.token,
        isHost: false,
        meetingTitle: meetingNote.title,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in daily-join-board-room:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
