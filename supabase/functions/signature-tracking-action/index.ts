import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action"); // "create_contact" or "create_task"
    const eventId = url.searchParams.get("eventId");
    const userId = url.searchParams.get("userId");

    console.log("[Tracking Action] Request:", { action, eventId, userId });

    if (!action || !eventId || !userId) {
      return new Response(renderHtml("error", "Missing required parameters"), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the tracking event details
    const { data: event, error: eventError } = await supabase
      .from("signature_tracking_events")
      .select("*, email_signatures(name)")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      console.error("[Tracking Action] Event not found:", eventError);
      return new Response(renderHtml("error", "Tracking event not found"), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }

    // Verify the user owns this event
    if (event.user_id !== userId) {
      return new Response(renderHtml("error", "Unauthorized"), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }

    const signatureName = event.email_signatures?.name || "Unknown Signature";
    const eventDate = new Date(event.created_at).toLocaleString("en-US");
    const eventTypeLabel = event.event_type === "open" ? "opened your email" : 
                           event.event_type === "banner_click" ? "clicked your banner" :
                           event.event_type === "social_click" ? "clicked a social icon" : "clicked a link";

    if (action === "create_contact") {
      // Check if contact already exists with this IP (as pseudo-identifier)
      const contactName = `Email Lead (${event.device_type || "unknown"})`;
      const contactNotes = `Created from email tracking event.\n\nEvent: ${eventTypeLabel}\nSignature: ${signatureName}\nDate: ${eventDate}\nDevice: ${event.device_type || "unknown"}\nEmail Client: ${event.email_client || "unknown"}\nLocation: ${[event.geo_city, event.geo_region, event.geo_country].filter(Boolean).join(", ") || "Unknown"}`;

      const { data: newContact, error: contactError } = await supabase
        .from("contacts")
        .insert({
          user_id: userId,
          name: contactName,
          notes: contactNotes,
          lead_source: "email_signature",
          lead_status: "new",
          last_opened_at: event.event_type === "open" ? event.created_at : null,
          last_clicked_at: event.event_type !== "open" ? event.created_at : null,
        })
        .select()
        .single();

      if (contactError) {
        console.error("[Tracking Action] Failed to create contact:", contactError);
        return new Response(renderHtml("error", "Failed to create contact: " + contactError.message), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "text/html" },
        });
      }

      console.log("[Tracking Action] Contact created:", newContact.id);
      return new Response(renderHtml("success", "Contact created successfully! You can find them in your Contacts."), {
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });

    } else if (action === "create_task") {
      const taskTitle = `Follow up: Someone ${eventTypeLabel}`;
      const taskDescription = `A recipient ${eventTypeLabel} using your "${signatureName}" signature.\n\nDate: ${eventDate}\nDevice: ${event.device_type || "unknown"}\nEmail Client: ${event.email_client || "unknown"}${event.target_url ? `\nClicked URL: ${event.target_url}` : ""}`;

      const { data: newTask, error: taskError } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          title: taskTitle,
          description: taskDescription,
          category: "follow_up",
          priority: "medium",
          status: "pending",
        })
        .select()
        .single();

      if (taskError) {
        console.error("[Tracking Action] Failed to create task:", taskError);
        return new Response(renderHtml("error", "Failed to create task: " + taskError.message), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "text/html" },
        });
      }

      console.log("[Tracking Action] Task created:", newTask.id);
      return new Response(renderHtml("success", "Task created successfully! Check your Tasks to follow up."), {
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });

    } else {
      return new Response(renderHtml("error", "Invalid action"), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }

  } catch (error: any) {
    console.error("[Tracking Action] Error:", error);
    return new Response(renderHtml("error", error.message), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/html" },
    });
  }
};

function renderHtml(status: "success" | "error", message: string): string {
  const isSuccess = status === "success";
  const bgGradient = isSuccess 
    ? "linear-gradient(135deg, #10b981, #06b6d4)" 
    : "linear-gradient(135deg, #ef4444, #f97316)";
  const icon = isSuccess ? "✅" : "❌";
  const title = isSuccess ? "Success!" : "Something went wrong";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Seeksy</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .header {
      background: ${bgGradient};
      padding: 40px;
      text-align: center;
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    .header h1 { color: white; font-size: 24px; font-weight: 600; }
    .body {
      padding: 40px;
      text-align: center;
    }
    .message {
      color: #334155;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-block;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      transition: background 0.2s;
    }
    .btn:hover { background: #2563eb; }
    .footer {
      padding: 20px 40px;
      background: #f8fafc;
      text-align: center;
      color: #94a3b8;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="icon">${icon}</div>
      <h1>${title}</h1>
    </div>
    <div class="body">
      <p class="message">${message}</p>
      <a href="https://seeksy.io" class="btn">Go to Seeksy</a>
    </div>
    <div class="footer">
      You can close this window now.
    </div>
  </div>
</body>
</html>
  `;
}

serve(handler);
