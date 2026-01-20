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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse Twilio webhook data (form-urlencoded)
    const formData = await req.formData();
    const from = formData.get('From') as string;
    const body = (formData.get('Body') as string || '').trim().toUpperCase();
    
    console.log('Received SMS from:', from, 'Body:', body);

    // Normalize phone number (remove +1 and spaces)
    const normalizedPhone = from.replace(/[\s+\-()]/g, '');

    // Find meeting by attendee phone
    const { data: meetings, error: meetingError } = await supabaseAdmin
      .from('meetings')
      .select('*')
      .ilike('attendee_phone', `%${normalizedPhone.slice(-10)}%`)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (meetingError || !meetings || meetings.length === 0) {
      console.log('No upcoming meetings found for phone:', from);
      await sendSmsResponse(from, "We couldn't find an upcoming meeting for this number.");
      return new Response(
        JSON.stringify({ success: true, message: 'No meeting found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the most recent upcoming meeting
    const meeting = meetings[0];

    // Parse RSVP response
    let rsvpStatus: string;
    let responseMessage: string;

    if (['YES', 'Y', 'YEAH', 'YEP', 'YUP', 'CONFIRM', 'CONFIRMED', 'ATTENDING'].includes(body)) {
      rsvpStatus = 'attending';
      responseMessage = `✅ Great! You're confirmed for "${meeting.title}" on ${new Date(meeting.start_time).toLocaleDateString()}.`;
    } else if (['NO', 'N', 'NOPE', 'CANT', "CAN'T", 'CANCEL', 'NOT ATTENDING'].includes(body)) {
      rsvpStatus = 'not_attending';
      responseMessage = `We've noted you won't be attending "${meeting.title}". Thanks for letting us know!`;
    } else if (['MAYBE', 'M', 'PERHAPS', 'UNSURE', 'NOT SURE', 'TENTATIVE'].includes(body)) {
      rsvpStatus = 'maybe';
      responseMessage = `📅 You're marked as "Maybe" for "${meeting.title}". Let us know when you decide!`;
    } else {
      // Invalid response
      await sendSmsResponse(from, "Please reply with YES, NO, or MAYBE to confirm your attendance.");
      return new Response(
        JSON.stringify({ success: true, message: 'Invalid RSVP response' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update meeting RSVP status
    const { error: updateError } = await supabaseAdmin
      .from('meetings')
      .update({
        attendee_rsvp_status: rsvpStatus,
        attendee_rsvp_timestamp: new Date().toISOString(),
        attendee_rsvp_method: 'sms'
      })
      .eq('id', meeting.id);

    if (updateError) {
      console.error('Failed to update meeting:', updateError);
      throw updateError;
    }

    // Send confirmation SMS to attendee
    await sendSmsResponse(from, responseMessage);

    // Notify meeting host
    await notifyHost(supabaseAdmin, meeting, rsvpStatus);

    return new Response(
      JSON.stringify({ success: true, rsvpStatus, meetingId: meeting.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing inbound SMS:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendSmsResponse(to: string, message: string) {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !fromNumber) {
    console.error('Twilio credentials not configured');
    return;
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = btoa(`${accountSid}:${authToken}`);

  try {
    await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: message,
      }),
    });
  } catch (error) {
    console.error('Failed to send SMS response:', error);
  }
}

async function notifyHost(supabase: any, meeting: any, rsvpStatus: string) {
  try {
    const statusEmoji = {
      'attending': '✅',
      'not_attending': '❌',
      'maybe': '❓'
    }[rsvpStatus] || '📋';

    const statusText = {
      'attending': 'attending',
      'not_attending': 'not attending',
      'maybe': 'marked as maybe'
    }[rsvpStatus] || 'responded';

    // Create notification for host
    await supabase
      .from('notifications')
      .insert({
        user_id: meeting.user_id,
        type: 'info',
        title: 'Meeting RSVP Received',
        message: `${statusEmoji} ${meeting.attendee_name} is ${statusText} for "${meeting.title}"`,
        read: false
      });

    console.log('Host notified of RSVP:', meeting.user_id);
  } catch (error) {
    console.error('Failed to notify host:', error);
  }
}
