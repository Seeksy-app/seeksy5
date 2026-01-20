import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting meeting reminder check...");

    // Get meetings happening in 23-25 hours
    const now = new Date();
    const startWindow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const endWindow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('*')
      .eq('status', 'scheduled')
      .gte('start_time', startWindow.toISOString())
      .lte('start_time', endWindow.toISOString());

    if (meetingsError) throw meetingsError;

    console.log(`Found ${meetings?.length || 0} meetings in reminder window`);

    let sentCount = 0;
    let skippedCount = 0;

    for (const meeting of meetings || []) {
      // Check if reminder already sent
      const { data: existingReminder } = await supabase
        .from('email_reminders_sent')
        .select('id')
        .eq('reminder_type', 'meeting_reminder')
        .eq('related_id', meeting.id)
        .eq('recipient_email', meeting.attendee_email)
        .single();

      if (existingReminder) {
        skippedCount++;
        continue;
      }

      // Send reminder email
      try {
        const formattedStartTime = new Date(meeting.start_time).toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        });

        const formattedEndTime = new Date(meeting.end_time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        });

        const locationLabels: Record<string, string> = {
          'phone': 'Phone Call',
          'zoom': 'Zoom',
          'teams': 'Microsoft Teams',
          'meet': 'Google Meet',
          'in-person': 'In Person',
          'custom': 'Custom Location'
        };
        const locationLabel = locationLabels[meeting.location_type] || meeting.location_type;

        await resend.emails.send({
          from: `Seeksy <${Deno.env.get("SENDER_EMAIL_HELLO") || "hello@seeksy.io"}>`,
          to: [meeting.attendee_email],
          subject: `Reminder: ${meeting.title} Tomorrow`,
          tags: [
            { name: 'category', value: 'meeting_reminder' },
            { name: 'user_id', value: meeting.user_id },
            { name: 'meeting_id', value: meeting.id },
          ],
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Meeting Reminder</h1>
              <p>Hi ${meeting.attendee_name},</p>
              <p>This is a friendly reminder that your meeting <strong>${meeting.title}</strong> is scheduled for tomorrow!</p>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #333; margin-top: 0;">Meeting Details</h2>
                <p><strong>Title:</strong> ${meeting.title}</p>
                <p><strong>Start:</strong> ${formattedStartTime}</p>
                <p><strong>End:</strong> ${formattedEndTime}</p>
                <p><strong>Location:</strong> ${locationLabel}</p>
                ${meeting.location_details ? `<p><strong>Details:</strong> ${meeting.location_details}</p>` : ''}
                ${meeting.description ? `<p><strong>Description:</strong> ${meeting.description}</p>` : ''}
              </div>
              
              <p>Looking forward to speaking with you!</p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This is an automated reminder from Seeksy.io
              </p>
            </div>
          `,
        });

        // Log the reminder
        await supabase.from('email_reminders_sent').insert({
          reminder_type: 'meeting_reminder',
          related_id: meeting.id,
          recipient_email: meeting.attendee_email,
        });

        // Log to email_logs table
        await supabase.from('email_logs').insert({
          user_id: meeting.user_id,
          email_type: 'meeting_reminder',
          recipient_email: meeting.attendee_email,
          recipient_name: meeting.attendee_name,
          subject: `Reminder: ${meeting.title} Tomorrow`,
          status: 'sent',
          related_id: meeting.id,
        });

        sentCount++;
        console.log(`Sent reminder for meeting ${meeting.id} to ${meeting.attendee_email}`);
      } catch (emailError) {
        console.error(`Failed to send reminder to ${meeting.attendee_email}:`, emailError);
      }
    }

    console.log(`Meeting reminders complete. Sent: ${sentCount}, Skipped: ${skippedCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        skipped: skippedCount,
        message: `Processed ${meetings?.length || 0} meetings` 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in meeting reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
