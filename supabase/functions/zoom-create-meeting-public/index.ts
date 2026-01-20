import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { zoomMeetingSchema, validateInput } from '../_shared/validation.ts';
import { verifySignedToken, checkRateLimit, getClientIP } from '../_shared/security.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimit = await checkRateLimit(supabaseAdmin, clientIP, 'zoom-create-meeting-public');
    
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const body = await req.json();
    const validatedData = validateInput(zoomMeetingSchema, body);
    const { userId, title, description, startTime, duration, token } = validatedData;

    // Verify signed token if provided (recommended for production)
    if (token) {
      const tokenPayload = await verifySignedToken(token);
      if (!tokenPayload || tokenPayload.userId !== userId || tokenPayload.resourceType !== 'meeting') {
        console.warn('Invalid or expired token');
        return new Response(
          JSON.stringify({ error: 'Invalid or expired booking token' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get Zoom connection for the meeting owner
    const { data: connection, error: connectionError } = await supabaseAdmin
      .from('zoom_connections')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (connectionError || !connection) {
      console.log('No Zoom connection found for user:', userId);
      return new Response(
        JSON.stringify({ error: 'No Zoom connection found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token needs refresh
    let accessToken = connection.access_token;
    const expiryDate = new Date(connection.token_expiry);
    
    if (expiryDate < new Date()) {
      console.log('Token expired, refreshing...');
      accessToken = await refreshToken(connection.refresh_token, userId);
    }

    // Create Zoom meeting
    const meetingPayload = {
      topic: title,
      type: 2, // Scheduled meeting
      start_time: new Date(startTime).toISOString(),
      duration: duration, // in minutes
      timezone: 'UTC',
      agenda: description || '',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
        audio: 'both',
        auto_recording: 'none',
      },
    };

    const zoomResponse = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meetingPayload),
    });

    if (!zoomResponse.ok) {
      const errorText = await zoomResponse.text();
      console.error('Zoom API error:', errorText);
      throw new Error('Failed to create Zoom meeting');
    }

    const meeting = await zoomResponse.json();
    console.log('Created Zoom meeting for public booking:', meeting.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        meetingId: meeting.id,
        joinUrl: meeting.join_url,
        startUrl: meeting.start_url,
        password: meeting.password,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in zoom-create-meeting-public:', error);
    
    // Return generic error to avoid leaking information
    return new Response(
      JSON.stringify({ error: 'Failed to create Zoom meeting' }),
      { 
        status: error.name === 'ZodError' ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function refreshToken(refreshToken: string, userId: string): Promise<string> {
  const clientId = Deno.env.get('ZOOM_CLIENT_ID');
  const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const tokens = await response.json();
  const expiryDate = new Date(Date.now() + (tokens.expires_in * 1000));

  // Update token in database
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  await supabaseAdmin
    .from('zoom_connections')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: expiryDate.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return tokens.access_token;
}
