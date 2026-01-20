import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { signupConfirmationSchema, validateInput } from '../_shared/validation.ts';
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
    const rateLimit = await checkRateLimit(supabase, clientIP, 'send-signup-confirmation-email');
    
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const body = await req.json();
    const validatedData = validateInput(signupConfirmationSchema, body);
    
    const { 
      volunteerName, 
      volunteerEmail, 
      sheetTitle, 
      slotStart, 
      slotEnd, 
      location,
      description,
      userId,
      sheetId
    } = validatedData;

    console.log("Sending signup confirmation email to:", volunteerEmail);
    
    const subject = `Time Slot Confirmed: ${sheetTitle}`;

    const formattedStartTime = new Date(slotStart).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const formattedEndTime = new Date(slotEnd).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Sanitize user-provided content to prevent XSS
    const safeSheetTitle = sanitizeHtml(sheetTitle);
    const safeVolunteerName = sanitizeHtml(volunteerName);
    const safeLocation = location ? sanitizeHtml(location) : '';
    const safeDescription = description ? sanitizeHtml(description) : '';

    const emailResponse = await resend.emails.send({
      from: `Seeksy <${Deno.env.get("SENDER_EMAIL_HELLO") || "hello@seeksy.io"}>`,
      to: [volunteerEmail],
      subject: subject,
      tags: [
        { name: 'category', value: 'signup_confirmation' },
        { name: 'user_id', value: userId },
        { name: 'sheet_id', value: sheetId },
      ],
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Time Slot Confirmed!</h1>
          <p>Hi ${safeVolunteerName},</p>
          <p>Thank you for signing up for <strong>${safeSheetTitle}</strong>.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Your Time Slot</h2>
            <p><strong>Activity:</strong> ${safeSheetTitle}</p>
            <p><strong>Start:</strong> ${formattedStartTime}</p>
            <p><strong>End:</strong> ${formattedEndTime}</p>
            ${safeLocation ? `<p><strong>Location:</strong> ${safeLocation}</p>` : ''}
            ${safeDescription ? `<p><strong>Description:</strong> ${safeDescription}</p>` : ''}
          </div>
          
          <p>We appreciate your commitment and look forward to your participation!</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This email was sent by Seeksy.io
          </p>
        </div>
      `,
    });

    console.log("Signup confirmation email sent successfully:", emailResponse);

    // Log email to database
    await supabase.from('email_logs').insert({
      user_id: userId,
      email_type: 'signup_confirmation',
      recipient_email: volunteerEmail,
      recipient_name: volunteerName,
      subject: subject,
      status: 'sent',
      related_id: sheetId,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending signup confirmation email:", error);
    
    // Return generic error to avoid leaking information
    return new Response(
      JSON.stringify({ error: 'Failed to send signup confirmation email' }),
      { 
        status: error.name === 'ZodError' ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
