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
    const { registrationId } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get registration and event details
    const { data: registration, error: regError } = await supabaseAdmin
      .from('event_registrations')
      .select('*, events(*)')
      .eq('id', registrationId)
      .single();

    if (regError || !registration) {
      throw new Error('Registration not found');
    }

    // Only send SMS if attendee has phone number
    if (!registration.attendee_phone) {
      console.log('No phone number for attendee, skipping SMS');
      return new Response(
        JSON.stringify({ success: true, skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const eventDate = new Date(registration.events.event_date).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const message = `Event Registration Confirmed! 🎉\n\n${registration.events.title}\n${eventDate}\n${registration.events.location || 'Location TBA'}\n\nThank you for registering!`;

    // Send SMS via Twilio
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured');
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: registration.attendee_phone,
        From: fromNumber,
        Body: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Twilio error:', errorData);
      throw new Error('Failed to send SMS');
    }

    const twilioResponse = await response.json();
    console.log('SMS sent:', twilioResponse.sid);

    return new Response(
      JSON.stringify({ success: true, messageSid: twilioResponse.sid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending event confirmation SMS:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
