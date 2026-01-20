import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { formId, formData, trackingCode } = await req.json();

    console.log("Processing form submission:", { formId, trackingCode });

    // Get form details
    const { data: form, error: formError } = await supabaseClient
      .from("forms")
      .select("*, profiles!forms_user_id_fkey(id, full_name, email)")
      .eq("id", formId)
      .single();

    if (formError || !form) {
      throw new Error("Form not found");
    }

    // Create or update contact
    const contactData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      company: formData.company || null,
      address: formData.address || null,
      notes: [
        formData.notes,
        formData.location
          ? `GPS: ${formData.location.lat}, ${formData.location.lng}`
          : "",
        trackingCode ? `Captured by: ${trackingCode}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      lead_status: "new",
      lead_source: "form_submission",
      user_id: form.user_id,
    };

    const { data: existingContact } = await supabaseClient
      .from("contacts")
      .select("id")
      .eq("email", formData.email)
      .eq("user_id", form.user_id)
      .maybeSingle();

    let contactId: string;

    if (existingContact) {
      const { data: updatedContact } = await supabaseClient
        .from("contacts")
        .update(contactData)
        .eq("id", existingContact.id)
        .select("id")
        .single();

      contactId = updatedContact!.id;
    } else {
      const { data: newContact } = await supabaseClient
        .from("contacts")
        .insert(contactData)
        .select("id")
        .single();

      contactId = newContact!.id;
    }

    // Create ticket if enabled in form settings
    const settings = form.settings as { createTicket?: boolean } | null;
    let ticketId: string | null = null;

    if (settings?.createTicket !== false) {
      const { data: ticket } = await supabaseClient
        .from("client_tickets")
        .insert({
          title: `Form Submission: ${formData.name}`,
          description: formData.notes || "New form submission",
          client_contact_id: contactId,
          user_id: form.user_id,
          assigned_to: form.user_id,
          status: "Created",
          priority: "medium",
          source: "form_submission",
        })
        .select("id")
        .single();

      ticketId = ticket?.id || null;
    }

    // Record submission
    const { data: submission } = await supabaseClient
      .from("form_submissions")
      .insert({
        form_id: formId,
        contact_id: contactId,
        ticket_id: ticketId,
        submitted_data: formData,
        tracking_code: trackingCode,
      })
      .select()
      .single();

    console.log("Form submission recorded:", submission.id);

    return new Response(
      JSON.stringify({
        success: true,
        submissionId: submission.id,
        contactId,
        ticketId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Form submission error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
