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
    const { guestToken, guestName } = await req.json();

    if (!guestToken) {
      throw new Error('Guest token is required');
    }

    if (!guestName || guestName.trim().length < 1) {
      throw new Error('Guest name is required');
    }

    console.log('Guest join request for token:', guestToken.substring(0, 8) + '...');

    // Use service role to look up meeting by invite token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First, try to find invite by invite_token (board_meeting_invites table)
    const { data: invite, error: inviteError } = await supabase
      .from('board_meeting_invites')
      .select('meeting_id, invitee_email, invitee_name')
      .eq('invite_token', guestToken)
      .maybeSingle();

    let meetingId: string;
    let guestDisplayName = guestName.trim();

    if (invite) {
      // Found via invite token
      meetingId = invite.meeting_id;
      if (!guestDisplayName && invite.invitee_name) {
        guestDisplayName = invite.invitee_name;
      }
      console.log('Found meeting via invite_token:', meetingId);
    } else {
      // Fallback: try legacy guest_token on board_meeting_notes
      const { data: meetingByToken, error: legacyError } = await supabase
        .from('board_meeting_notes')
        .select('id')
        .eq('guest_token', guestToken)
        .maybeSingle();

      if (legacyError || !meetingByToken) {
        console.error('Meeting lookup error:', inviteError, legacyError);
        throw new Error('Invalid or expired guest link');
      }
      meetingId = meetingByToken.id;
      console.log('Found meeting via legacy guest_token:', meetingId);
    }

    // Get meeting details
    const { data: meetingNote, error: meetingError } = await supabase
      .from('board_meeting_notes')
      .select('id, title, room_name, room_url')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meetingNote) {
      console.error('Meeting details error:', meetingError);
      throw new Error('Meeting not found');
    }

    // Check if room exists
    if (!meetingNote.room_name || !meetingNote.room_url) {
      throw new Error('Meeting video has not started yet. Please wait for the host to start the meeting.');
    }

    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY');
    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY not configured');
    }

    console.log('Creating guest token for:', guestDisplayName);

    // Create guest participant token (not owner)
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
          user_id: `guest-${Date.now()}`,
          user_name: guestDisplayName,
          exp: Math.floor(Date.now() / 1000) + (4 * 60 * 60), // 4 hour expiry for guests
        },
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Daily API error creating token:', error);
      throw new Error(`Failed to create meeting token`);
    }

    const tokenData = await tokenResponse.json();

    return new Response(
      JSON.stringify({
        roomName: meetingNote.room_name,
        roomUrl: meetingNote.room_url,
        token: tokenData.token,
        meetingTitle: meetingNote.title,
        meetingId: meetingNote.id,
        isGuest: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in daily-guest-join:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
