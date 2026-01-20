import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  executiveSummary: string;
  hostName: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { meetingId, meetingTitle, meetingDate, executiveSummary, hostName }: RequestBody = await req.json();

    console.log("[send-board-meeting-notes-email] Starting for meeting:", meetingId);

    // Get all board members from profiles with board_member or board_admin role
    const { data: boardMembers, error: membersError } = await supabase
      .from("user_roles")
      .select(`
        user_id,
        role,
        profiles!inner(email, full_name)
      `)
      .in("role", ["board_member", "board_admin", "super_admin"]);

    if (membersError) {
      console.error("[send-board-meeting-notes-email] Error fetching board members:", membersError);
      throw membersError;
    }

    console.log("[send-board-meeting-notes-email] Found board members:", boardMembers?.length);

    if (!boardMembers || boardMembers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No board members to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get unique emails
    const emails = [...new Set(boardMembers.map((m: any) => m.profiles?.email).filter(Boolean))];
    
    console.log("[send-board-meeting-notes-email] Sending to emails:", emails);

    // Format the meeting date nicely
    const formattedDate = new Date(meetingDate + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Truncate summary for email preview (first 500 chars)
    const summaryPreview = executiveSummary?.substring(0, 500) + (executiveSummary?.length > 500 ? "..." : "") || "No summary available.";

    // Build the meeting URL
    const appUrl = Deno.env.get("APP_URL") || "https://seeksy.io";
    const meetingUrl = `${appUrl}/board/meetings/${meetingId}`;

    // Send email to all board members
    const emailPromises = emails.map((email: string) =>
      resend.emails.send({
        from: "Seeksy Board Portal <board@seeksy.io>",
        to: [email],
        subject: `Meeting Notes Ready: ${meetingTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #053877 0%, #2C6BED 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Meeting Notes Ready</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e9ecef; border-top: none;">
              <h2 style="color: #053877; margin-top: 0;">${meetingTitle}</h2>
              <p style="color: #666; margin-bottom: 20px;">
                <strong>Date:</strong> ${formattedDate}<br>
                <strong>Posted by:</strong> ${hostName}
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2C6BED; margin-bottom: 20px;">
                <h3 style="color: #053877; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Executive Summary</h3>
                <p style="color: #444; margin-bottom: 0; white-space: pre-line;">${summaryPreview}</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${meetingUrl}" style="display: inline-block; background: #2C6BED; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  Review Full Notes
                </a>
              </div>
              
              <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
                You can also add your thoughts and questions directly in the Board Portal.
              </p>
            </div>
            
            <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">
              Seeksy Board Portal • Secure board communications
            </p>
          </body>
          </html>
        `,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failedCount = results.filter((r) => r.status === "rejected").length;

    console.log(`[send-board-meeting-notes-email] Sent ${successCount} emails, ${failedCount} failed`);

    // Update meeting to mark as notified
    await supabase
      .from("board_meeting_notes")
      .update({ 
        ai_notes_published: true,
        ai_notes_published_at: new Date().toISOString()
      })
      .eq("id", meetingId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failedCount,
        message: `Notification sent to ${successCount} board member${successCount !== 1 ? 's' : ''}`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-board-meeting-notes-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
