import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendProposalRequest {
  proposalId: string;
  recipientEmail: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { proposalId, recipientEmail, message }: SendProposalRequest = await req.json();

    console.log("Sending proposal email:", { proposalId, recipientEmail });

    // Fetch proposal details
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select(`
        *,
        contacts (
          name,
          email,
          company
        )
      `)
      .eq("id", proposalId)
      .single();

    if (proposalError || !proposal) {
      throw new Error("Proposal not found");
    }

    // Generate proposal view link
    const proposalLink = `https://seeksy.io/proposals/${proposalId}`;

    // Build line items table
    const lineItemsHtml = proposal.items?.map((item: any, index: number) => `
      <tr style="${index % 2 === 0 ? 'background-color: #f9fafb;' : ''}">
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.unit_price.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">$${item.total.toFixed(2)}</td>
      </tr>
    `).join('') || '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: #0095FF; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">New Proposal</h1>
            </div>

            <!-- Content -->
            <div style="padding: 32px;">
              <h2 style="margin-top: 0; color: #111827; font-size: 20px;">Hi ${proposal.contacts?.name || 'there'},</h2>
              
              ${message ? `
                <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #1e40af; white-space: pre-wrap;">${message}</p>
                </div>
              ` : ''}

              <p style="color: #4b5563;">I'm pleased to share a proposal for your consideration:</p>

              <!-- Proposal Details -->
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 18px;">${proposal.title}</h3>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #6b7280;">Proposal #:</span>
                  <span style="color: #111827; font-weight: 600;">${proposal.proposal_number}</span>
                </div>
                ${proposal.description ? `
                  <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #4b5563; font-size: 14px; white-space: pre-wrap;">${proposal.description}</p>
                  </div>
                ` : ''}
              </div>

              <!-- Line Items -->
              ${proposal.items && proposal.items.length > 0 ? `
                <div style="margin: 24px 0;">
                  <h3 style="color: #111827; font-size: 16px; margin-bottom: 12px;">Items & Services</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                      <tr style="background-color: #f3f4f6;">
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Description</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Qty</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Unit Price</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${lineItemsHtml}
                    </tbody>
                  </table>
                </div>
              ` : ''}

              <!-- Total Amount -->
              <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: right;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 18px; color: #1e40af; font-weight: 600;">Total Amount:</span>
                  <span style="font-size: 28px; color: #1e40af; font-weight: 700;">$${proposal.total_amount.toFixed(2)}</span>
                </div>
                ${proposal.valid_until ? `
                  <p style="margin: 8px 0 0 0; color: #3b82f6; font-size: 14px;">Valid until: ${new Date(proposal.valid_until).toLocaleDateString()}</p>
                ` : ''}
              </div>

              ${proposal.notes ? `
                <div style="margin: 24px 0; padding: 16px; background-color: #fef3c7; border-radius: 8px;">
                  <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">Additional Notes:</h4>
                  <p style="margin: 0; color: #78350f; font-size: 14px; white-space: pre-wrap;">${proposal.notes}</p>
                </div>
              ` : ''}

              <p style="color: #4b5563; margin-top: 24px;">Please review the proposal and let me know if you have any questions.</p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${proposalLink}" style="display: inline-block; background: #0095FF; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">View Proposal</a>
              </div>

              <p style="color: #9ca3af; font-size: 14px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                Best regards,<br>
                Your Seeksy Team
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                Powered by <a href="https://seeksy.io" style="color: #3b82f6; text-decoration: none;">Seeksy</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: `Seeksy <${Deno.env.get("SENDER_EMAIL_HELLO")}>`,
      to: [recipientEmail],
      subject: `Proposal: ${proposal.title} - ${proposal.proposal_number}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log to email_events table for unified tracking
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabaseClient = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (user) {
        // Find contact by email
        const { data: contact } = await supabase
          .from("contacts")
          .select("id")
          .eq("email", recipientEmail)
          .eq("user_id", user.id)
          .maybeSingle();

        // Insert email.sent event
        await supabase.from("email_events").insert({
          event_type: "email.sent",
          to_email: recipientEmail,
          from_email: Deno.env.get("SENDER_EMAIL_HELLO") || "hello@seeksy.io",
          email_subject: `Proposal: ${proposal.title} - ${proposal.proposal_number}`,
          contact_id: contact?.id || null,
          campaign_id: null,
          user_id: user.id,
          resend_email_id: emailResponse.data?.id || null,
          occurred_at: new Date().toISOString(),
        });

        console.log("✅ Proposal email logged to email_events");
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending proposal email:", error);
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
