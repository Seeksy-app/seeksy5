import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTHENTICATION ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("🔒 Automation Engine: Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Verify the user's JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user) {
      console.log("🔒 Automation Engine: Invalid token -", userError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user roles for logging
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    const roles = userRoles?.map(r => r.role) || [];
    const isAdmin = roles.some(r => ["admin", "super_admin"].includes(r));

    const { trigger, contactId, eventData } = await req.json();

    // === AUTHORIZATION ===
    // Verify the user owns the contact or is admin
    if (!isAdmin && contactId) {
      const { data: contact, error: contactCheckError } = await supabase
        .from("contacts")
        .select("user_id")
        .eq("id", contactId)
        .single();

      if (contactCheckError || !contact) {
        console.log(`🔒 Automation Engine: Contact ${contactId} not found`);
        return new Response(
          JSON.stringify({ error: "Contact not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (contact.user_id !== user.id) {
        console.log(`🔒 Automation Engine: User ${user.id} denied access to contact ${contactId} owned by ${contact.user_id}`);
        return new Response(
          JSON.stringify({ error: "Access denied. You can only trigger automations for your own contacts." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`✅ Automation Engine: Authorized - user=${user.id}, roles=[${roles.join(',')}], trigger=${trigger}, contact=${contactId}`);

    // Find active automations matching this trigger
    // Only find automations owned by this user (unless admin)
    let automationsQuery = supabase
      .from("automations")
      .select("*, automation_actions(*)")
      .eq("trigger_type", trigger)
      .eq("is_active", true);

    if (!isAdmin) {
      automationsQuery = automationsQuery.eq("user_id", user.id);
    }

    const { data: automations, error: automationsError } = await automationsQuery;

    if (automationsError) throw automationsError;

    if (!automations || automations.length === 0) {
      console.log("⚠️ No active automations found for this trigger");
      return new Response(
        JSON.stringify({ message: "No automations triggered" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const results = [];

    // Execute each automation
    for (const automation of automations) {
      try {
        // Create automation run
        const { data: run, error: runError } = await supabase
          .from("automation_runs")
          .insert({
            automation_id: automation.id,
            contact_id: contactId,
            status: "started",
            started_at: new Date().toISOString(),
            trigger_data: eventData,
          })
          .select()
          .single();

        if (runError) {
          console.error("❌ Failed to create automation run:", runError);
          continue;
        }

        // Get contact details
        const { data: contact, error: contactError } = await supabase
          .from("contacts")
          .select("*, contact_preferences(*)")
          .eq("id", contactId)
          .single();

        if (contactError || !contact) {
          console.error("❌ Contact not found");
          await supabase
            .from("automation_runs")
            .update({
              status: "failed",
              error_message: "Contact not found",
              completed_at: new Date().toISOString(),
            })
            .eq("id", run.id);
          continue;
        }

        // Check if contact is unsubscribed
        if (contact.contact_preferences?.global_unsubscribe === true) {
          console.log(`⚠️ Skipping contact ${contact.email} - unsubscribed`);
          await supabase
            .from("automation_runs")
            .update({
              status: "skipped",
              error_message: "Contact is unsubscribed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", run.id);
          continue;
        }

        // Execute actions in order
        const actions = automation.automation_actions || [];
        actions.sort((a: any, b: any) => (a.action_order || 0) - (b.action_order || 0));

        for (const action of actions) {
          if (action.delay_minutes && action.delay_minutes > 0) {
            console.log(`⏰ Delaying ${action.delay_minutes} minutes...`);
          }

          if (action.action_type === "send_email") {
            const config = action.action_config as any;
            
            let htmlContent = config.html_content || "";
            let subject = config.subject || "Automated Email";

            if (config.template_id) {
              const { data: template } = await supabase
                .from("email_templates")
                .select("*")
                .eq("id", config.template_id)
                .single();

              if (template) {
                htmlContent = template.html_content || htmlContent;
                subject = template.subject || subject;
              }
            }

            htmlContent = htmlContent.replace(/{{name}}/gi, contact.name || contact.email);
            htmlContent = htmlContent.replace(/{{email}}/gi, contact.email);

            let fromEmail = Deno.env.get("SENDER_EMAIL_HELLO") || "hello@seeksy.io";
            if (config.from_email_account_id) {
              const { data: emailAccount } = await supabase
                .from("email_accounts")
                .select("email_address")
                .eq("id", config.from_email_account_id)
                .single();
              
              if (emailAccount) {
                fromEmail = emailAccount.email_address;
              }
            }

            const { data: emailData, error: sendError } = await resend.emails.send({
              from: fromEmail,
              to: [contact.email],
              subject,
              html: htmlContent,
            });

            if (sendError) {
              console.error(`❌ Failed to send automation email:`, sendError);
              await supabase
                .from("automation_runs")
                .update({
                  status: "failed",
                  error_message: sendError.message,
                  completed_at: new Date().toISOString(),
                })
                .eq("id", run.id);
              break;
            }

            await supabase.from("email_events").insert({
              event_type: "email.sent",
              to_email: contact.email,
              from_email: fromEmail,
              email_subject: subject,
              contact_id: contactId,
              user_id: automation.user_id,
              resend_email_id: emailData?.id,
              occurred_at: new Date().toISOString(),
            });

            console.log(`✅ Automation email sent to ${contact.email}`);
          }
        }

        await supabase
          .from("automation_runs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", run.id);

        results.push({ automation: automation.name, status: "success" });
      } catch (err) {
        console.error(`❌ Automation error:`, err);
        results.push({
          automation: automation.name,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    console.log(`✅ Automation engine completed: ${results.length} automations processed`);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Automation engine error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
