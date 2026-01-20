import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketSubmission {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const submission: TicketSubmission = await req.json();
    
    console.log("Processing ticket submission:", { email: submission.email, subject: submission.subject });

    // Get the first admin/super_admin user to assign tickets to
    const { data: adminRoles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "super_admin"])
      .limit(1);

    if (!adminRoles || adminRoles.length === 0) {
      throw new Error("No admin user found to assign ticket");
    }

    const adminUserId = adminRoles[0].user_id;

    // Step 1: Create or update contact in CRM
    let contactId: string;

    const { data: existingContact } = await supabaseAdmin
      .from("contacts")
      .select("id")
      .eq("email", submission.email)
      .eq("user_id", adminUserId)
      .maybeSingle();

    if (existingContact) {
      // Update existing contact
      contactId = existingContact.id;
      
      const updateData: any = {
        name: submission.name,
      };
      
      if (submission.company) updateData.company = submission.company;
      if (submission.phone) updateData.phone = submission.phone;
      
      await supabaseAdmin
        .from("contacts")
        .update(updateData)
        .eq("id", contactId);
        
      console.log("Updated existing contact:", contactId);
    } else {
      // Create new contact
      const contactData: any = {
        user_id: adminUserId,
        email: submission.email,
        name: submission.name,
        lead_status: 'new',
        lead_source: 'ticket_submission',
      };
      
      if (submission.company) contactData.company = submission.company;
      if (submission.phone) contactData.phone = submission.phone;

      const { data: newContact, error: contactError } = await supabaseAdmin
        .from("contacts")
        .insert(contactData)
        .select("id")
        .single();

      if (contactError) throw contactError;
      contactId = newContact.id;
      console.log("Created new contact:", contactId);
    }

    // Step 2: Generate ticket number
    const { data: recentTicket } = await supabaseAdmin
      .from("tickets")
      .select("ticket_number")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let ticketNumber: string;
    if (recentTicket && recentTicket.ticket_number) {
      const lastNumber = parseInt(recentTicket.ticket_number.replace("TKT-", ""));
      ticketNumber = `TKT-${String(lastNumber + 1).padStart(5, "0")}`;
    } else {
      ticketNumber = "TKT-00001";
    }

    // Step 3: Create ticket
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("tickets")
      .insert({
        user_id: adminUserId,
        contact_id: contactId,
        ticket_number: ticketNumber,
        title: submission.subject,
        description: submission.description,
        category: submission.category,
        priority: submission.priority,
        status: "open",
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    console.log("Created ticket:", ticket.id, ticketNumber);

    // Step 4: Send notification email to admin
    try {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      
      const { data: adminProfile } = await supabaseAdmin
        .from("profiles")
        .select("account_email, account_full_name")
        .eq("id", adminUserId)
        .single();

      if (adminProfile && adminProfile.account_email) {
        await resend.emails.send({
          from: Deno.env.get("SENDER_EMAIL_HELLO") || "Seeksy <hello@seeksy.io>",
          to: [adminProfile.account_email],
          subject: `New Ticket Submission: ${ticketNumber} - ${submission.subject}`,
          html: `
            <h2>New Support Ticket Received</h2>
            <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
            <p><strong>From:</strong> ${submission.name} (${submission.email})</p>
            ${submission.company ? `<p><strong>Company:</strong> ${submission.company}</p>` : ""}
            ${submission.phone ? `<p><strong>Phone:</strong> ${submission.phone}</p>` : ""}
            <p><strong>Category:</strong> ${submission.category}</p>
            <p><strong>Priority:</strong> ${submission.priority}</p>
            <p><strong>Subject:</strong> ${submission.subject}</p>
            <p><strong>Description:</strong></p>
            <p>${submission.description.replace(/\n/g, '<br>')}</p>
            <br>
            <p><a href="https://seeksy.io/project-management">View Ticket in Dashboard</a></p>
          `,
        });
        
        console.log("Sent notification email to admin");
      }
    } catch (emailError) {
      console.error("Error sending notification email:", emailError);
      // Continue even if email fails
    }

    // Step 5: Send confirmation email to submitter
    try {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      
      await resend.emails.send({
        from: Deno.env.get("SENDER_EMAIL_HELLO") || "Seeksy <hello@seeksy.io>",
        to: [submission.email],
        subject: `Ticket Confirmation: ${ticketNumber}`,
        html: `
          <h2>Thank You for Contacting Us!</h2>
          <p>Hi ${submission.name},</p>
          <p>We've received your support request and created ticket <strong>${ticketNumber}</strong>.</p>
          <p><strong>Subject:</strong> ${submission.subject}</p>
          <p>Our team will review your request and respond as soon as possible. You'll receive updates at this email address.</p>
          <br>
          <p>Best regards,<br>Seeksy Support Team</p>
        `,
      });
      
      console.log("Sent confirmation email to submitter");
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Continue even if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticket_number: ticketNumber,
        ticket_id: ticket.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in submit-public-ticket:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
