import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { calendarAvailabilitySchema, validateInput } from '../_shared/validation.ts';
import { checkRateLimit, getClientIP } from '../_shared/security.ts';

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
    const rateLimit = await checkRateLimit(supabaseAdmin, clientIP, 'google-calendar-check-availability');
    
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const body = await req.json();
    const validatedData = validateInput(calendarAvailabilitySchema, body);
    const { userId, date } = validatedData;

    // Get calendar connection
    const { data: connection, error: connectionError } = await supabaseAdmin
      .from('calendar_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single();

    if (connectionError || !connection) {
      console.log('No calendar connection found for user:', userId);
      return new Response(
        JSON.stringify({ available: true, busySlots: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token needs refresh
    let accessToken = connection.access_token;
    const expiryDate = new Date(connection.token_expiry);
    
    if (expiryDate < new Date()) {
      console.log('Token expired, refreshing...');
      accessToken = await refreshToken(connection.refresh_token, userId);
    }

    // Get busy times from Google Calendar
    const selectedDate = new Date(date);
    const timeMin = new Date(selectedDate.setHours(0, 0, 0, 0)).toISOString();
    const timeMax = new Date(selectedDate.setHours(23, 59, 59, 999)).toISOString();

    const freeBusyResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/freeBusy',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: [{ id: 'primary' }],
        }),
      }
    );

    if (!freeBusyResponse.ok) {
      const errorText = await freeBusyResponse.text();
      console.error('Google Calendar FreeBusy API error:', errorText);
      throw new Error('Failed to check availability');
    }

    const freeBusyData = await freeBusyResponse.json();
    const busySlots = freeBusyData.calendars?.primary?.busy || [];

    console.log('Found', busySlots.length, 'busy slots for user:', userId);

    return new Response(
      JSON.stringify({ 
        available: true,
        busySlots: busySlots.map((slot: any) => ({
          start: slot.start,
          end: slot.end,
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in google-calendar-check-availability:', error);
    
    // Return generic error to avoid leaking information
    return new Response(
      JSON.stringify({ error: 'Failed to check calendar availability' }),
      { 
        status: error.name === 'ZodError' ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
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
