import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  meeting_id: string;
  invitee_email: string;
  invitee_name?: string;
}

// Generate ICS calendar file content with proper timezone
function generateICS(meeting: any, joinUrl: string): string {
  // Parse meeting date/time as Eastern Time
  const meetingDateStr = meeting.meeting_date;
  const startTimeStr = meeting.start_time || '10:00:00';
  const durationMinutes = meeting.duration_minutes || 60;
  
  // Format for TZID usage (YYYYMMDDTHHMMSS without Z)
  const formatLocalDate = (dateStr: string, timeStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const [hours, minutes, seconds] = timeStr.split(':');
    return `${year}${month}${day}T${hours}${minutes}${seconds || '00'}`;
  };
  
  // Calculate end time
  const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
  const totalMinutes = startHours * 60 + startMinutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
  
  const uid = `${meeting.id}@seeksy.io`;
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const startFormatted = formatLocalDate(meetingDateStr, startTimeStr);
  const endFormatted = formatLocalDate(meetingDateStr, endTimeStr);
  
  // Escape description for ICS (newlines as \n, commas and semicolons escaped)
  const description = `Join the meeting: ${joinUrl}\\n\\nClick the link to join when the meeting starts.`;
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Seeksy//Board Meeting//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VTIMEZONE
TZID:America/New_York
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
TZNAME:EDT
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
TZNAME:EST
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART;TZID=America/New_York:${startFormatted}
DTEND;TZID=America/New_York:${endFormatted}
SUMMARY:${meeting.title || 'Board Meeting'}
DESCRIPTION:${description}
URL:${joinUrl}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

serve(async (req: Request): Promise<Response> => {
  console.log("board-send-meeting-invite called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin/board_member
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    const allowedRoles = ['admin', 'super_admin', 'board_member'];
    const hasPermission = roles?.some(r => allowedRoles.includes(r.role));
    
    if (!hasPermission) {
      return new Response(JSON.stringify({ error: "Permission denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { meeting_id, invitee_email, invitee_name }: InviteRequest = await req.json();
    console.log("Sending invite for meeting:", meeting_id, "to:", invitee_email);

    // Get meeting details
    const { data: meeting, error: meetingError } = await supabase
      .from("board_meeting_notes")
      .select("*")
      .eq("id", meeting_id)
      .single();

    if (meetingError || !meeting) {
      console.error("Meeting not found:", meetingError);
      return new Response(JSON.stringify({ error: "Meeting not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if invite already exists
    const { data: existingInvite } = await supabase
      .from("board_meeting_invites")
      .select("id, invite_token")
      .eq("meeting_id", meeting_id)
      .eq("invitee_email", invitee_email)
      .maybeSingle();

    let invite_token: string;
    let inviteId: string;

    if (existingInvite) {
      // Resend existing invite
      invite_token = existingInvite.invite_token;
      inviteId = existingInvite.id;
      
      await supabase
        .from("board_meeting_invites")
        .update({ sent_at: new Date().toISOString(), status: 'sent' })
        .eq("id", existingInvite.id);
    } else {
      // Create new invite
      const { data: newInvite, error: inviteError } = await supabase
        .from("board_meeting_invites")
        .insert({
          meeting_id,
          invitee_email,
          invitee_name,
          role: 'board_member',
        })
        .select()
        .single();

      if (inviteError || !newInvite) {
        console.error("Failed to create invite:", inviteError);
        return new Response(JSON.stringify({ error: "Failed to create invite" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      invite_token = newInvite.invite_token;
      inviteId = newInvite.id;
    }

    // Generate join URL - FIXED: Use correct route path
    const baseUrl = Deno.env.get("SITE_URL") || "https://seeksy.io";
    const joinUrl = `${baseUrl}/board/meeting-guest/${invite_token}`;

    // Generate ICS content
    const icsContent = generateICS(meeting, joinUrl);
    const icsBase64 = btoa(icsContent);

    // Format meeting date for display
    const meetingDate = new Date(`${meeting.meeting_date}T${meeting.start_time || '10:00:00'}`);
    const formattedDate = meetingDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = meetingDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    // Generate calendar links (no tracking wrapping)
    const meetingTitle = encodeURIComponent(meeting.title || 'Board Meeting');
    const meetingDescription = encodeURIComponent(`Join the meeting: ${joinUrl}\n\nClick the link to join when the meeting starts.`);
    const meetingLocation = encodeURIComponent(joinUrl);
    
    // Format dates for calendar URLs (YYYYMMDDTHHMMSSZ format)
    const startTimeStr = meeting.start_time || '10:00:00';
    const durationMinutes = meeting.duration_minutes || 60;
    const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
    
    // Create date objects for start and end
    const startDate = new Date(`${meeting.meeting_date}T${startTimeStr}`);
    // Add 5 hours for EST to UTC conversion (simplified)
    const startUTC = new Date(startDate.getTime() + 5 * 60 * 60 * 1000);
    const endUTC = new Date(startUTC.getTime() + durationMinutes * 60 * 1000);
    
    const formatForGoogle = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const googleStartTime = formatForGoogle(startUTC);
    const googleEndTime = formatForGoogle(endUTC);
    
    // Google Calendar link (direct, no tracking)
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${meetingTitle}&dates=${googleStartTime}/${googleEndTime}&details=${meetingDescription}&location=${meetingLocation}&ctz=America/New_York`;
    
    // Outlook.com Calendar link (direct, no tracking)
    const outlookStartTime = `${meeting.meeting_date}T${startTimeStr}`;
    const outlookEndTime = new Date(startDate.getTime() + durationMinutes * 60 * 1000).toISOString().slice(0, 19);
    const outlookCalendarUrl = `https://outlook.live.com/calendar/0/action/compose?subject=${meetingTitle}&startdt=${outlookStartTime}&enddt=${outlookEndTime}&body=${meetingDescription}&location=${meetingLocation}`;

    // Tutorial video link (placeholder)
    const tutorialUrl = `${baseUrl}/board/help/meeting-guide`;
    
    // Agenda URL (requires Board login)
    const agendaUrl = `${baseUrl}/board/meeting-notes/${meeting.id}`;

    // Send email with ICS attachment
    const { error: emailError } = await resend.emails.send({
      from: Deno.env.get("SENDER_EMAIL") || "Seeksy Board <noreply@seeksy.io>",
      to: [invitee_email],
      subject: `Board Meeting Invitation — ${meeting.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a2e; background: #f4f4f8; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #053877 0%, #2C6BED 100%); color: white; padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .content { background: white; padding: 32px 24px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
            .greeting { font-size: 16px; margin-bottom: 20px; }
            .meeting-card { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2C6BED; }
            .meeting-card h3 { margin: 0 0 12px 0; color: #053877; font-size: 18px; }
            .meeting-detail { display: flex; margin: 8px 0; font-size: 14px; }
            .meeting-detail strong { color: #64748b; min-width: 80px; }
            .buttons { text-align: center; margin: 28px 0; }
            .btn-primary { display: inline-block; background: #2C6BED; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 6px; }
            .btn-secondary { display: inline-block; background: white; color: #2C6BED !important; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; border: 2px solid #2C6BED; margin: 6px; font-size: 14px; }
            .btn-divider { display: block; font-size: 13px; color: #64748b; margin: 8px 0; }
            .calendar-options { text-align: center; margin: 20px 0; padding: 16px; background: #f8fafc; border-radius: 8px; }
            .calendar-options p { margin: 0 0 12px 0; font-size: 14px; color: #64748b; }
            .calendar-links { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
            .calendar-link { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; text-decoration: none; color: #374151; font-size: 13px; font-weight: 500; }
            .calendar-link:hover { background: #f1f5f9; }
            .info-box { background: #eff6ff; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #1e40af; }
            .info-box strong { display: block; margin-bottom: 4px; }
            .tutorial-link { background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .tutorial-link a { color: #15803d; font-weight: 600; text-decoration: none; }
            .tutorial-link p { margin: 4px 0 0 0; font-size: 13px; color: #166534; }
            .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            .ics-note { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 8px; }
            .login-note { font-size: 12px; color: #64748b; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Board Meeting Invitation</h1>
            </div>
            <div class="content">
              <p class="greeting">Hello${invitee_name ? ` ${invitee_name}` : ''},</p>
              <p>You have been invited to an upcoming board meeting.</p>
              
              <div class="meeting-card">
                <h3>${meeting.title}</h3>
                <div class="meeting-detail"><strong>Date:</strong> ${formattedDate}</div>
                <div class="meeting-detail"><strong>Time:</strong> ${formattedTime} ET</div>
                <div class="meeting-detail"><strong>Duration:</strong> ${meeting.duration_minutes || 60} minutes</div>
              </div>
              
              <div class="buttons" style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
                <a href="${joinUrl}" class="btn-primary">Join Meeting</a>
                <a href="${joinUrl}" class="btn-secondary">Review Agenda</a>
              </div>
              
              <div class="calendar-options">
                <p>📅 Add to your calendar:</p>
                <div class="calendar-links">
                  <a href="${googleCalendarUrl}" target="_blank" class="calendar-link">
                    <span>📆</span> Google Calendar
                  </a>
                  <a href="${outlookCalendarUrl}" target="_blank" class="calendar-link">
                    <span>📧</span> Outlook
                  </a>
                </div>
                <p class="ics-note">Or download the attached .ics file for Apple Calendar / other apps</p>
              </div>
              
              <div class="info-box">
                <strong>Before the meeting:</strong>
                You can review the agenda, add questions, and prepare notes before the meeting begins. All changes are saved automatically.
              </div>
              
              <div class="tutorial-link">
                <a href="${tutorialUrl}">📺 Watch a 2-minute walkthrough</a>
                <p>Learn how to use the agenda, notes, decisions, and AI summaries.</p>
              </div>
              
              <div class="footer">
                <p>This invitation was sent via Seeksy Board Portal</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: "board-meeting.ics",
          content: icsBase64,
        },
      ],
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      return new Response(JSON.stringify({ error: "Failed to send email", details: emailError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Invite sent successfully to:", invitee_email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invite_id: inviteId,
        invite_token,
        join_url: joinUrl 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in board-send-meeting-invite:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
