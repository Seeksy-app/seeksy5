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
    console.log("Starting signup slot reminder check...");

    // Get slots happening in 23-25 hours
    const now = new Date();
    const startWindow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const endWindow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: slots, error: slotsError } = await supabase
      .from('signup_slots')
      .select('*, signup_sheets(*)')
      .eq('is_filled', true)
      .gte('slot_start', startWindow.toISOString())
      .lte('slot_start', endWindow.toISOString())
      .not('volunteer_email', 'is', null);

    if (slotsError) throw slotsError;

    console.log(`Found ${slots?.length || 0} signup slots in reminder window`);

    let sentCount = 0;
    let skippedCount = 0;

    for (const slot of slots || []) {
      if (!slot.volunteer_email || !slot.signup_sheets) {
        skippedCount++;
        continue;
      }

      const sheet = Array.isArray(slot.signup_sheets) ? slot.signup_sheets[0] : slot.signup_sheets;

      // Check if reminder already sent
      const { data: existingReminder } = await supabase
        .from('email_reminders_sent')
        .select('id')
        .eq('reminder_type', 'signup_reminder')
        .eq('related_id', slot.id)
        .eq('recipient_email', slot.volunteer_email)
        .single();

      if (existingReminder) {
        skippedCount++;
        continue;
      }

      // Send reminder email
      try {
        const formattedStartTime = new Date(slot.slot_start).toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        });

        const formattedEndTime = new Date(slot.slot_end).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        });

        await resend.emails.send({
          from: `Seeksy <${Deno.env.get("SENDER_EMAIL_HELLO") || "hello@seeksy.io"}>`,
          to: [slot.volunteer_email],
          subject: `Reminder: ${sheet.title} Tomorrow`,
          tags: [
            { name: 'category', value: 'signup_reminder' },
            { name: 'user_id', value: sheet.user_id },
            { name: 'sheet_id', value: sheet.id },
            { name: 'slot_id', value: slot.id },
          ],
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Time Slot Reminder</h1>
              <p>Hi ${slot.volunteer_name},</p>
              <p>This is a friendly reminder that your time slot for <strong>${sheet.title}</strong> is scheduled for tomorrow!</p>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #333; margin-top: 0;">Time Slot Details</h2>
                <p><strong>Activity:</strong> ${sheet.title}</p>
                <p><strong>Start:</strong> ${formattedStartTime}</p>
                <p><strong>End:</strong> ${formattedEndTime}</p>
                ${sheet.location ? `<p><strong>Location:</strong> ${sheet.location}</p>` : ''}
                ${sheet.description ? `<p><strong>Description:</strong> ${sheet.description}</p>` : ''}
              </div>
              
              <p>Thank you for your commitment! We appreciate your participation.</p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This is an automated reminder from Seeksy.io
              </p>
            </div>
          `,
        });

        // Log the reminder
        await supabase.from('email_reminders_sent').insert({
          reminder_type: 'signup_reminder',
          related_id: slot.id,
          recipient_email: slot.volunteer_email,
        });

        // Log to email_logs table
        await supabase.from('email_logs').insert({
          user_id: sheet.user_id,
          email_type: 'signup_reminder',
          recipient_email: slot.volunteer_email,
          recipient_name: slot.volunteer_name,
          subject: `Reminder: ${sheet.title} Tomorrow`,
          status: 'sent',
          related_id: sheet.id,
        });

        sentCount++;
        console.log(`Sent reminder for slot ${slot.id} to ${slot.volunteer_email}`);
      } catch (emailError) {
        console.error(`Failed to send reminder to ${slot.volunteer_email}:`, emailError);
      }
    }

    console.log(`Signup reminders complete. Sent: ${sentCount}, Skipped: ${skippedCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        skipped: skippedCount,
        message: `Processed ${slots?.length || 0} slots` 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in signup reminder function:", error);
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
