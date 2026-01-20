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
    const { title, description, startTime, endTime, attendeeEmail, attendeeName, location, userId } = await req.json();

    if (!userId) {
      throw new Error('userId is required');
    }

    // Use service role to access any user's calendar connection
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get calendar connection for the specified user
    const { data: connection, error: connectionError } = await supabaseAdmin
      .from('calendar_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single();

    if (connectionError || !connection) {
      return new Response(
        JSON.stringify({ error: 'No calendar connection found' }),
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

    // Create calendar event
    const event = {
      summary: title,
      description: description || '',
      start: {
        dateTime: startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime,
        timeZone: 'UTC',
      },
      attendees: [
        { email: attendeeEmail, displayName: attendeeName }
      ],
      location: location || '',
      conferenceData: location?.includes('zoom') || location?.includes('meet') || location?.includes('teams') ? {
        createRequest: {
          requestId: `meeting-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      } : undefined,
    };

    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error('Google Calendar API error:', errorText);
      throw new Error('Failed to create calendar event');
    }

    const createdEvent = await calendarResponse.json();
    console.log('Created calendar event:', createdEvent.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventId: createdEvent.id,
        htmlLink: createdEvent.htmlLink 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in google-calendar-create-event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function refreshToken(refreshToken: string, userId: string): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
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
    .from('calendar_connections')
    .update({
      access_token: tokens.access_token,
      token_expiry: expiryDate.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('provider', 'google');

  return tokens.access_token;
}
