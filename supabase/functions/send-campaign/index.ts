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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { campaignId } = await req.json();
    if (!campaignId) throw new Error("Campaign ID is required");

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .select("*, email_accounts(*)")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campaign not found");
    }

    // Get recipient list
    const { data: listMembers, error: listError } = await supabase
      .from("contact_list_members")
      .select("contact_id, contacts!inner(id, email, name, last_opened_at, last_clicked_at)")
      .eq("list_id", campaign.recipient_list_id);

    if (listError) throw listError;

    const contacts = (listMembers || [])
      .map((m: any) => m.contacts)
      .filter(Boolean);

    // Get all contact preferences
    const contactIds = contacts.map((c: any) => c.id);
    const { data: preferences } = await supabase
      .from("contact_preferences")
      .select("*")
      .in("contact_id", contactIds);

    const preferencesMap = new Map(preferences?.map((p: any) => [p.contact_id, p]) || []);

    // Filter based on preferences
    const eligibleContacts = contacts.filter((contact: any) => {
      const prefs = preferencesMap.get(contact.id);
      
      // Check global unsubscribe
      if (prefs?.global_unsubscribe === true) {
        console.log(`❌ Skipping ${contact.email} - globally unsubscribed`);
        return false;
      }

      // Check category-specific preferences if needed
      // Add more sophisticated filtering here based on campaign category
      
      return true;
    });

    console.log(`📧 Sending to ${eligibleContacts.length}/${contacts.length} contacts (${contacts.length - eligibleContacts.length} suppressed)`);

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const fromEmail = campaign.email_accounts?.email_address || Deno.env.get("SENDER_EMAIL_HELLO") || "hello@seeksy.io";
    
    let successCount = 0;
    let failCount = 0;
    const errors: any[] = [];

    // Send emails
    for (const contact of eligibleContacts) {
      try {
        // Replace merge tags in content
        let htmlContent = campaign.html_content || "";
        htmlContent = htmlContent.replace(/{{name}}/gi, contact.name || contact.email);
        htmlContent = htmlContent.replace(/{{email}}/gi, contact.email);
        
        const { data: emailData, error: sendError } = await resend.emails.send({
          from: fromEmail,
          to: [contact.email],
          subject: campaign.subject || "Email from Seeksy",
          html: htmlContent,
        });

        if (sendError) {
          console.error(`❌ Failed to send to ${contact.email}:`, sendError);
          failCount++;
          errors.push({ email: contact.email, error: sendError.message });
        } else {
          successCount++;
          
          // Track sent event
          await supabase.from("email_events").insert({
            event_type: "email.sent",
            to_email: contact.email,
            from_email: fromEmail,
            email_subject: campaign.subject,
            contact_id: contact.id,
            campaign_id: campaignId,
            user_id: user.id,
            resend_email_id: emailData?.id,
            occurred_at: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        console.error(`❌ Error sending to ${contact.email}:`, err);
        failCount++;
        errors.push({ email: contact.email, error: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    // Update campaign status
    await supabase
      .from("email_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        total_recipients: contacts.length,
        total_sent: successCount,
      })
      .eq("id", campaignId);

    console.log(`✅ Campaign sent: ${successCount} succeeded, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failCount,
        suppressed: contacts.length - eligibleContacts.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Send campaign error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
