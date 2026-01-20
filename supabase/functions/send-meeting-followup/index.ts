import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { meetingId } = await req.json();
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Sending meeting follow-up for meeting:', meetingId);

    // Get meeting details
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*, meeting_intelligence(*)')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      throw new Error('Meeting not found');
    }

    const intelligence = meeting.meeting_intelligence?.[0];
    if (!intelligence) {
      throw new Error('No meeting intelligence found');
    }

    // Get host details
    const { data: host } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', meeting.user_id)
      .single();

    // Build action items HTML
    const actionItemsHtml = intelligence.action_items?.length > 0
      ? `
        <h2 style="color: #1f2937; margin-top: 24px; margin-bottom: 12px;">Action Items</h2>
        <ul style="list-style: none; padding: 0;">
          ${intelligence.action_items.map((item: any) => `
            <li style="background: #f3f4f6; padding: 12px; margin-bottom: 8px; border-radius: 6px; border-left: 4px solid ${item.priority === 'high' ? '#ef4444' : item.priority === 'medium' ? '#f59e0b' : '#10b981'};">
              <strong style="color: #1f2937;">${item.task}</strong><br>
              <span style="color: #6b7280; font-size: 14px;">Assignee: ${item.assignee} • Priority: ${item.priority}</span>
            </li>
          `).join('')}
        </ul>
      `
      : '';

    // Build key takeaways HTML
    const takeawaysHtml = intelligence.key_takeaways?.length > 0
      ? `
        <h2 style="color: #1f2937; margin-top: 24px; margin-bottom: 12px;">Key Takeaways</h2>
        <ul style="color: #374151; line-height: 1.6;">
          ${intelligence.key_takeaways.map((takeaway: string) => `<li style="margin-bottom: 8px;">${takeaway}</li>`).join('')}
        </ul>
      `
      : '';

    // Build decisions HTML
    const decisionsHtml = intelligence.decisions?.length > 0
      ? `
        <h2 style="color: #1f2937; margin-top: 24px; margin-bottom: 12px;">Decisions Made</h2>
        <ul style="color: #374151; line-height: 1.6;">
          ${intelligence.decisions.map((decision: string) => `<li style="margin-bottom: 8px;">${decision}</li>`).join('')}
        </ul>
      `
      : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Meeting Follow-Up</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">${meeting.title}</h2>
            <p style="color: #6b7280; font-size: 14px;">
              Host: ${host?.full_name || 'Unknown'}<br>
              Date: ${new Date(meeting.start_time).toLocaleString()}
            </p>
            
            <h2 style="color: #1f2937; margin-top: 24px; margin-bottom: 12px;">Summary</h2>
            <p style="color: #374151; line-height: 1.6;">${intelligence.summary}</p>
            
            ${takeawaysHtml}
            ${actionItemsHtml}
            ${decisionsHtml}
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                This is an automated follow-up from Seeksy AI Meeting Assistant
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email to host
    const hostEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Seeksy Meetings <meetings@seeksy.io>',
        to: [meeting.attendee_email],
        subject: `Meeting Follow-Up: ${meeting.title}`,
        html: emailHtml,
      }),
    });

    if (!hostEmailResponse.ok) {
      console.error('Failed to send host email:', await hostEmailResponse.text());
    }

    // Send email to attendee
    const attendeeEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Seeksy Meetings <meetings@seeksy.io>',
        to: [meeting.attendee_email],
        subject: `Meeting Follow-Up: ${meeting.title}`,
        html: emailHtml,
      }),
    });

    if (!attendeeEmailResponse.ok) {
      console.error('Failed to send attendee email:', await attendeeEmailResponse.text());
    }

    console.log('Meeting follow-up emails sent successfully');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-meeting-followup:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});