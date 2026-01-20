import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { eventRegistrationSchema, validateInput } from '../_shared/validation.ts';
import { checkRateLimit, getClientIP, sanitizeHtml } from '../_shared/security.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimit = await checkRateLimit(supabase, clientIP, 'send-event-registration-email');
    
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const body = await req.json();
    const validatedData = validateInput(eventRegistrationSchema, body);
    
    const { 
      attendeeName, 
      attendeeEmail, 
      eventTitle, 
      eventDate, 
      eventLocation,
      eventDescription,
      userId,
      eventId
    } = validatedData;

    console.log("Sending event registration email to:", attendeeEmail);
    
    const subject = `Registration Confirmed: ${eventTitle}`;

    const formattedDate = new Date(eventDate).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Sanitize user-provided content to prevent XSS
    const safeEventTitle = sanitizeHtml(eventTitle);
    const safeAttendeeName = sanitizeHtml(attendeeName);
    const safeEventLocation = sanitizeHtml(eventLocation);
    const safeEventDescription = eventDescription ? sanitizeHtml(eventDescription) : '';

    const emailResponse = await resend.emails.send({
      from: `Seeksy <${Deno.env.get("SENDER_EMAIL_HELLO") || "hello@seeksy.io"}>`,
      to: [attendeeEmail],
      subject: subject,
      tags: [
        { name: 'category', value: 'event_registration' },
        { name: 'user_id', value: userId },
        { name: 'event_id', value: eventId },
      ],
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Registration Confirmed!</h1>
          <p>Hi ${safeAttendeeName},</p>
          <p>Thank you for registering for <strong>${safeEventTitle}</strong>.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Event Details</h2>
            <p><strong>Event:</strong> ${safeEventTitle}</p>
            <p><strong>Date & Time:</strong> ${formattedDate}</p>
            <p><strong>Location:</strong> ${safeEventLocation}</p>
            ${safeEventDescription ? `<p><strong>Description:</strong> ${safeEventDescription}</p>` : ''}
          </div>
          
          <p>We look forward to seeing you there!</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This email was sent by Seeksy.io
          </p>
        </div>
      `,
    });

    console.log("Event registration email sent successfully:", emailResponse);

    // Log email to database
    await supabase.from('email_logs').insert({
      user_id: userId,
      email_type: 'event_registration',
      recipient_email: attendeeEmail,
      recipient_name: attendeeName,
      subject: subject,
      status: 'sent',
      related_id: eventId,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending event registration email:", error);
    
    // Return generic error to avoid leaking information
    return new Response(
      JSON.stringify({ error: 'Failed to send registration confirmation email' }),
      { 
        status: error.name === 'ZodError' ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
