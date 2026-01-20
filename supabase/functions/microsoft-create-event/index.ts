import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      userId, 
      meetingTitle, 
      startTime, 
      endTime, 
      attendeeName, 
      attendeeEmail,
      description,
      location 
    } = await req.json();

    console.log('Creating Microsoft calendar event for user:', userId);

    // Get user's Microsoft connection
    const { data: connection, error: connectionError } = await supabase
      .from('microsoft_connections')
      .select('access_token, refresh_token, token_expiry')
      .eq('user_id', userId)
      .single();

    if (connectionError || !connection) {
      console.error('No Microsoft connection found:', connectionError);
      return new Response(
        JSON.stringify({ error: 'Microsoft account not connected' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if token needs refresh
    const tokenExpiry = new Date(connection.token_expiry);
    const now = new Date();
    let accessToken = connection.access_token;

    if (tokenExpiry <= now) {
      console.log('Access token expired, refreshing...');
      
      const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
      const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');

      const refreshResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          refresh_token: connection.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        console.error('Token refresh failed');
        return new Response(
          JSON.stringify({ error: 'Failed to refresh Microsoft access token' }), 
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      
      // Update stored tokens
      const newExpiry = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();
      await supabase
        .from('microsoft_connections')
        .update({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token || connection.refresh_token,
          token_expiry: newExpiry,
        })
        .eq('user_id', userId);

      console.log('Successfully refreshed access token');
    }

    // Create calendar event with Teams meeting
    const eventData = {
      subject: meetingTitle,
      body: {
        contentType: 'HTML',
        content: description || ''
      },
      start: {
        dateTime: startTime,
        timeZone: 'UTC'
      },
      end: {
        dateTime: endTime,
        timeZone: 'UTC'
      },
      location: {
        displayName: location || 'Microsoft Teams Meeting'
      },
      attendees: [
        {
          emailAddress: {
            address: attendeeEmail,
            name: attendeeName
          },
          type: 'required'
        }
      ],
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness'
    };

    console.log('Creating event in Microsoft Calendar...');
    
    const calendarResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error('Microsoft Calendar API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create calendar event' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const eventResponse = await calendarResponse.json();
    console.log('Successfully created calendar event with Teams link');

    // Extract Teams meeting link
    const teamsLink = eventResponse.onlineMeeting?.joinUrl || null;

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventId: eventResponse.id,
        teamsLink: teamsLink,
        htmlLink: eventResponse.webLink
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in microsoft-create-event:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
