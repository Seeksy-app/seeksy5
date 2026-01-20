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
    console.log("Starting event reminder check...");

    // Get events happening in 23-25 hours (to catch events in the 24-hour window)
    const now = new Date();
    const startWindow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const endWindow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .gte('event_date', startWindow.toISOString())
      .lte('event_date', endWindow.toISOString());

    if (eventsError) throw eventsError;

    console.log(`Found ${events?.length || 0} events in reminder window`);

    let sentCount = 0;
    let skippedCount = 0;

    for (const event of events || []) {
      // Get all registrations for this event
      const { data: registrations, error: regsError } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', event.id);

      if (regsError) {
        console.error(`Error fetching registrations for event ${event.id}:`, regsError);
        continue;
      }

      for (const registration of registrations || []) {
        // Check if reminder already sent
        const { data: existingReminder } = await supabase
          .from('email_reminders_sent')
          .select('id')
          .eq('reminder_type', 'event_reminder')
          .eq('related_id', event.id)
          .eq('recipient_email', registration.attendee_email)
          .single();

        if (existingReminder) {
          skippedCount++;
          continue;
        }

        // Send reminder email
        try {
          const formattedDate = new Date(event.event_date).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
          });

          await resend.emails.send({
            from: `Seeksy <${Deno.env.get("SENDER_EMAIL_HELLO") || "hello@seeksy.io"}>`,
            to: [registration.attendee_email],
            subject: `Reminder: ${event.title} Tomorrow`,
            tags: [
              { name: 'category', value: 'event_reminder' },
              { name: 'user_id', value: event.user_id },
              { name: 'event_id', value: event.id },
            ],
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Event Reminder</h1>
                <p>Hi ${registration.attendee_name},</p>
                <p>This is a friendly reminder that <strong>${event.title}</strong> is happening tomorrow!</p>
                
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="color: #333; margin-top: 0;">Event Details</h2>
                  <p><strong>Event:</strong> ${event.title}</p>
                  <p><strong>Date & Time:</strong> ${formattedDate}</p>
                  <p><strong>Location:</strong> ${event.location}</p>
                  ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
                </div>
                
                <p>We look forward to seeing you there!</p>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
                  This is an automated reminder from Seeksy.io
                </p>
              </div>
            `,
          });

          // Log the reminder
          await supabase.from('email_reminders_sent').insert({
            reminder_type: 'event_reminder',
            related_id: event.id,
            recipient_email: registration.attendee_email,
          });

          // Log to email_logs table
          await supabase.from('email_logs').insert({
            user_id: event.user_id,
            email_type: 'event_reminder',
            recipient_email: registration.attendee_email,
            recipient_name: registration.attendee_name,
            subject: `Reminder: ${event.title} Tomorrow`,
            status: 'sent',
            related_id: event.id,
          });

          sentCount++;
          console.log(`Sent reminder for event ${event.id} to ${registration.attendee_email}`);
        } catch (emailError) {
          console.error(`Failed to send reminder to ${registration.attendee_email}:`, emailError);
        }
      }
    }

    console.log(`Event reminders complete. Sent: ${sentCount}, Skipped: ${skippedCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        skipped: skippedCount,
        message: `Processed ${events?.length || 0} events` 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in event reminder function:", error);
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
