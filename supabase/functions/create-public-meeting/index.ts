import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, getClientIP, sanitizeHtml } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MeetingRequest {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  locationType: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  hostName: string;
  meetingTypeName: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting
    const clientIP = getClientIP(req);
    const { allowed } = await checkRateLimit(supabase, clientIP, "create-public-meeting");
    
    if (!allowed) {
      console.log("Rate limit exceeded for IP:", clientIP);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawBody: MeetingRequest = await req.json();
    
    // Sanitize user inputs
    const body: MeetingRequest = {
      title: sanitizeHtml(rawBody.title?.slice(0, 200) || ""),
      description: sanitizeHtml(rawBody.description?.slice(0, 2000) || ""),
      startTime: rawBody.startTime,
      endTime: rawBody.endTime,
      locationType: rawBody.locationType,
      attendeeName: sanitizeHtml(rawBody.attendeeName?.slice(0, 100) || ""),
      attendeeEmail: rawBody.attendeeEmail?.trim().toLowerCase().slice(0, 255) || "",
      attendeePhone: rawBody.attendeePhone ? sanitizeHtml(rawBody.attendeePhone.slice(0, 20)) : undefined,
      hostName: sanitizeHtml(rawBody.hostName?.slice(0, 100) || ""),
      meetingTypeName: sanitizeHtml(rawBody.meetingTypeName?.slice(0, 100) || ""),
    };
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.attendeeEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Creating public meeting:", { attendeeEmail: body.attendeeEmail, title: body.title });

    // Get a default host user for demo meetings (first admin/super_admin)
    const { data: adminUser } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "super_admin"])
      .limit(1)
      .single();

    const hostUserId = adminUser?.user_id;

    if (!hostUserId) {
      console.error("No admin user found for hosting demo meetings");
      return new Response(
        JSON.stringify({ error: "No host available" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the meeting
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .insert({
        user_id: hostUserId,
        title: body.title,
        description: body.description,
        start_time: body.startTime,
        end_time: body.endTime,
        location_type: body.locationType,
        location_details: "",
        status: "scheduled",
        show_ai_notes: true,
        chat_enabled: true,
        waiting_room_enabled: true,
      })
      .select()
      .single();

    if (meetingError) {
      console.error("Error creating meeting:", meetingError);
      return new Response(
        JSON.stringify({ error: meetingError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Meeting created:", meeting.id);

    // Create attendee record
    const { error: attendeeError } = await supabase
      .from("meeting_attendees")
      .insert({
        meeting_id: meeting.id,
        attendee_name: body.attendeeName,
        attendee_email: body.attendeeEmail,
        attendee_phone: body.attendeePhone,
        rsvp_status: "confirmed",
      });

    if (attendeeError) {
      console.error("Error creating attendee:", attendeeError);
    }

    // Also create in contacts for the host
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("email", body.attendeeEmail)
      .eq("user_id", hostUserId)
      .single();

    if (!existingContact) {
      await supabase.from("contacts").insert({
        user_id: hostUserId,
        name: body.attendeeName,
        email: body.attendeeEmail,
        phone: body.attendeePhone,
        lead_source: `Demo Booking - ${body.meetingTypeName}`,
        lead_status: "new",
      });
    }

    return new Response(
      JSON.stringify({ success: true, meetingId: meeting.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in create-public-meeting:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
