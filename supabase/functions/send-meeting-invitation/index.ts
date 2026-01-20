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
    const { inviteeEmail, inviteeName, meetingTypeId, customMessage } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get meeting type details
    const { data: meetingType, error: meetingError } = await supabaseClient
      .from('meeting_types')
      .select('*')
      .eq('id', meetingTypeId)
      .eq('user_id', user.id)
      .single();

    if (meetingError || !meetingType) {
      console.error('Meeting type fetch error:', meetingError);
      throw new Error('Meeting type not found');
    }

    // Get creator profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('username, full_name')
      .eq('id', user.id)
      .single();

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('meeting_invitations')
      .insert({
        meeting_type_id: meetingTypeId,
        inviter_id: user.id,
        invitee_name: inviteeName,
        invitee_email: inviteeEmail,
        custom_message: customMessage,
        status: 'sent'
      })
      .select()
      .single();

    if (inviteError) {
      throw inviteError;
    }

    // Send email using Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL_HELLO');

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Get the app origin from request or use env variable
    const appOrigin = req.headers.get('origin') || Deno.env.get('APP_URL') || 'https://seeksy.lovable.app';
    const bookingUrl = `${appOrigin}/book/${profile?.username}?type=${meetingTypeId}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
            .button { display: inline-block; padding: 14px 28px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .message-box { background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Meeting Invitation</h1>
            </div>
            <div class="content">
              <p>Hi ${inviteeName},</p>
              <p><strong>${profile?.full_name || profile?.username}</strong> has invited you to schedule a meeting:</p>
              
              <h3 style="color: #667eea; margin-top: 20px;">${meetingType.name}</h3>
              ${meetingType.description ? `<p>${meetingType.description}</p>` : ''}
              <p><strong>Duration:</strong> ${meetingType.duration} minutes</p>
              
              ${customMessage ? `
                <div class="message-box">
                  <p style="margin: 0;"><strong>Personal Message:</strong></p>
                  <p style="margin: 10px 0 0 0;">${customMessage}</p>
                </div>
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${bookingUrl}" class="button">Schedule Meeting</a>
              </div>
              
              <p style="font-size: 14px; color: #666;">Click the button above to view available times and book your meeting.</p>
            </div>
            <div class="footer">
              <p>This is an automated invitation from Seeksy. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: SENDER_EMAIL || 'hello@seeksy.io',
        to: [inviteeEmail],
        subject: `Meeting Invitation from ${profile?.full_name || profile?.username}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error('Failed to send invitation email');
    }

    // Log email
    await supabaseClient.from('email_logs').insert({
      user_id: user.id,
      recipient_email: inviteeEmail,
      recipient_name: inviteeName,
      email_type: 'meeting_invitation',
      subject: `Meeting Invitation from ${profile?.full_name || profile?.username}`,
      status: 'sent',
      related_id: invitation.id
    });

    return new Response(
      JSON.stringify({ success: true, invitation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending invitation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});