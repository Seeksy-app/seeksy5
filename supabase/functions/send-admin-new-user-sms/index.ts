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
    const { userId, userEmail } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get super admin users with phone numbers
    const { data: superAdmins, error: adminError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, profiles!inner(phone, full_name)')
      .eq('role', 'super_admin');

    if (adminError || !superAdmins || superAdmins.length === 0) {
      console.log('No super admins found');
      return new Response(
        JSON.stringify({ success: true, skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured');
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    const message = `New User Alert! 🎉\n\nA new user just created an account:\n${userEmail}\n\nView in admin dashboard.`;

    const results = [];

    // Send SMS to all super admins with phone numbers
    for (const admin of superAdmins) {
      const profile = admin.profiles as any;
      if (!profile?.phone) continue;

      try {
        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: profile.phone,
            From: fromNumber,
            Body: message,
          }),
        });

        if (response.ok) {
          const twilioResponse = await response.json();
          results.push({ success: true, messageSid: twilioResponse.sid });
          console.log('SMS sent to admin:', twilioResponse.sid);
        } else {
          console.error('Failed to send to admin:', admin.user_id);
          results.push({ success: false });
        }
      } catch (error) {
        console.error('Error sending to admin:', error);
        results.push({ success: false });
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: results.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending admin notification SMS:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
