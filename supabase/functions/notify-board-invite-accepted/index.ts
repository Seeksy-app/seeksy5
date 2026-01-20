import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  inviterUserId: string;
  inviteeName: string;
  inviteeEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inviterUserId, inviteeName, inviteeEmail }: NotifyRequest = await req.json();
    
    console.log(`[notify-board-invite-accepted] Processing notification for inviter: ${inviterUserId}`);
    console.log(`[notify-board-invite-accepted] New board member: ${inviteeName} (${inviteeEmail})`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all admin users to notify
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['admin', 'super_admin']);

    if (adminError) {
      console.error("[notify-board-invite-accepted] Error fetching admin users:", adminError);
      throw new Error("Could not find admin users");
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log("[notify-board-invite-accepted] No admin users found to notify");
      return new Response(JSON.stringify({ success: true, message: "No admins to notify" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`[notify-board-invite-accepted] Found ${adminUsers.length} admin(s) to notify`);

    // Create inbox message for each admin
    const messageBody = `
      <div style="font-family: sans-serif;">
        <h2 style="color: #053877;">🎉 Board Member Joined!</h2>
        <p><strong>${inviteeName}</strong> has accepted their invitation to join the Seeksy Board Portal.</p>
        <p><strong>Email:</strong> ${inviteeEmail}</p>
        <p>They now have access to the Board Portal where they can view business metrics, forecasts, and company updates.</p>
        <p><a href="/admin/team-members" style="color: #2C6BED;">View Team Members →</a></p>
      </div>
    `;

    const insertPromises = adminUsers.map(admin => 
      supabase.from('inbox_messages').insert({
        user_id: admin.user_id,
        from_email: 'system@seeksy.io',
        from_name: 'Seeksy System',
        subject: `🎉 ${inviteeName} accepted your Board Portal invite!`,
        body_html: messageBody,
        body_text: `${inviteeName} (${inviteeEmail}) has accepted their invitation to join the Seeksy Board Portal.`,
        received_at: new Date().toISOString(),
        is_read: false,
      })
    );

    const results = await Promise.all(insertPromises);
    
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error("[notify-board-invite-accepted] Some inbox inserts failed:", errors);
    }

    console.log(`[notify-board-invite-accepted] Inbox notifications created for ${adminUsers.length - errors.length} admin(s)`);

    return new Response(JSON.stringify({ success: true, notifiedCount: adminUsers.length - errors.length }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[notify-board-invite-accepted] Error:", error);
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
