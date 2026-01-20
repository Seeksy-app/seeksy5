import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { meetingConfirmationSchema, validateInput } from '../_shared/validation.ts';
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
    const rateLimit = await checkRateLimit(supabase, clientIP, 'send-meeting-confirmation-email');
    
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const body = await req.json();
    const validatedData = validateInput(meetingConfirmationSchema, body);
    
    const { 
      attendeeName, 
      attendeeEmail, 
      meetingTitle, 
      startTime, 
      endTime, 
      locationType, 
      locationDetails,
      description,
      userId,
      meetingId
    } = validatedData;

    console.log("Sending meeting confirmation email to:", attendeeEmail);
    
    const subject = `Meeting Confirmed: ${meetingTitle}`;

    // Format times in UTC for clarity
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    const formattedStartTime = startDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short'
    });

    const formattedEndTime = endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short'
    });

    // Also format in common US timezones for convenience
    const formattedStartEST = startDate.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
      timeZoneName: 'short'
    });

    const formattedStartCST = startDate.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago',
      timeZoneName: 'short'
    });

    const formattedStartPST = startDate.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles',
      timeZoneName: 'short'
    });

    const locationLabel = {
      'phone': 'Phone Call',
      'zoom': 'Zoom',
      'teams': 'Microsoft Teams',
      'meet': 'Google Meet',
      'in-person': 'In Person',
      'custom': 'Custom Location',
      'seeksy_studio': 'Seeksy Studio'
    }[locationType] || locationType;

    // Sanitize user-provided content to prevent XSS
    const safeMeetingTitle = sanitizeHtml(meetingTitle);
    const safeAttendeeName = sanitizeHtml(attendeeName);
    const safeLocationDetails = locationDetails ? sanitizeHtml(locationDetails) : '';
    const safeDescription = description ? sanitizeHtml(description) : '';

    // Create iCalendar (.ics) content for calendar invitation
    const formatDateForICS = (date: string) => {
      return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Seeksy//Meeting Scheduler//EN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${meetingId}@seeksy.io`,
      `DTSTAMP:${formatDateForICS(new Date().toISOString())}`,
      `DTSTART:${formatDateForICS(startTime)}`,
      `DTEND:${formatDateForICS(endTime)}`,
      `SUMMARY:${meetingTitle}`,
      `DESCRIPTION:${description || 'Meeting scheduled via Seeksy'}`,
      `LOCATION:${safeLocationDetails || locationLabel}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      `ORGANIZER;CN=Seeksy:mailto:hello@seeksy.io`,
      `ATTENDEE;CN=${attendeeName};RSVP=TRUE:mailto:${attendeeEmail}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const emailResponse = await resend.emails.send({
      from: `Seeksy <${Deno.env.get("SENDER_EMAIL_HELLO") || "hello@seeksy.io"}>`,
      to: [attendeeEmail],
      subject: subject,
      tags: [
        { name: 'category', value: 'meeting_confirmation' },
        { name: 'user_id', value: userId },
        { name: 'meeting_id', value: meetingId },
      ],
      attachments: [
        {
          filename: 'meeting-invite.ics',
          content: btoa(icsContent),
        },
      ],
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Meeting Confirmed!</h1>
          <p>Hi ${safeAttendeeName},</p>
          <p>Your meeting has been successfully scheduled.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Meeting Details</h2>
            <p><strong>Title:</strong> ${safeMeetingTitle}</p>
            <p><strong>Date & Time:</strong> ${formattedStartTime}</p>
            <p><strong>End Time:</strong> ${formattedEndTime}</p>
            
            <div style="background-color: #fff; padding: 12px; border-radius: 6px; margin: 12px 0;">
              <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;"><strong>Time Conversions:</strong></p>
              <p style="margin: 4px 0; font-size: 14px;">🕐 Eastern: ${formattedStartEST}</p>
              <p style="margin: 4px 0; font-size: 14px;">🕐 Central: ${formattedStartCST}</p>
              <p style="margin: 4px 0; font-size: 14px;">🕐 Pacific: ${formattedStartPST}</p>
            </div>
            
            <p><strong>Location:</strong> ${locationLabel}</p>
            ${safeLocationDetails ? `<p><strong>Details:</strong> ${safeLocationDetails}</p>` : ''}
            ${safeDescription ? `<p><strong>Description:</strong> ${safeDescription}</p>` : ''}
          </div>
          
          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <h3 style="color: #333; margin-top: 0; font-size: 16px;">📱 Confirm Your Attendance</h3>
            <p style="margin: 10px 0;"><strong>Reply to this email with:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li><strong>YES</strong> - I'll be there</li>
              <li><strong>NO</strong> - Can't make it</li>
              <li><strong>MAYBE</strong> - Not sure yet</li>
            </ul>
            <p style="margin: 10px 0; font-size: 14px; color: #666;">We'll automatically update your RSVP status and notify the meeting host.</p>
          </div>
          
          <p>We look forward to speaking with you!</p>
          <p style="margin: 20px 0;">
            <strong>📅 Add to Calendar:</strong> A calendar invitation (.ics file) is attached to this email. 
            Click on the attachment to add this meeting to your calendar app.
          </p>
          
          <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="color: #333; margin-top: 0; font-size: 16px;">💡 Get More Out of Your Meetings</h3>
            <p style="margin: 10px 0;">Create your free Seeksy account to:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Manage all your meetings in one place</li>
              <li>Schedule calls with your own booking link</li>
              <li>Access powerful tools for creators and professionals</li>
            </ul>
            <a href="https://seeksy.io/auth" style="display: inline-block; padding: 12px 24px; background-color: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px; font-weight: bold;">
              Create Free Account →
            </a>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This email was sent by Seeksy.io
          </p>
        </div>
      `,
    });

    console.log("Meeting confirmation email sent successfully:", emailResponse);

    // Log email to database
    await supabase.from('email_logs').insert({
      user_id: userId,
      email_type: 'meeting_confirmation',
      recipient_email: attendeeEmail,
      recipient_name: attendeeName,
      subject: subject,
      status: 'sent',
      related_id: meetingId,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending meeting confirmation email:", error);
    
    // Return generic error to avoid leaking information
    return new Response(
      JSON.stringify({ error: 'Failed to send meeting confirmation email' }),
      { 
        status: error.name === 'ZodError' ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
