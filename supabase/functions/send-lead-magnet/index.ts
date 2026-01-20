import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { checkRateLimit, getClientIP, sanitizeHtml } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadMagnetRequest {
  name: string;
  email: string;
  company?: string;
  persona: string;
  offerId: string;
  offerTitle: string;
  pdfPath: string;
  purpose?: string;
  source?: string;
  bullets?: string[];
}

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[LEAD-MAGNET] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting lead magnet delivery");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const senderEmail = Deno.env.get("SENDER_EMAIL_HELLO") || Deno.env.get("SENDER_EMAIL") || "hello@seeksy.io";

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Rate limiting
    const clientIP = getClientIP(req);
    const { allowed, remaining } = await checkRateLimit(supabase, clientIP, "send-lead-magnet");
    
    if (!allowed) {
      logStep("Rate limit exceeded", { ip: clientIP });
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body: LeadMagnetRequest = await req.json();
    logStep("Received request", { email: body.email, persona: body.persona, offerId: body.offerId });

    // Sanitize user inputs
    const name = body.name ? sanitizeHtml(body.name.slice(0, 100)) : undefined;
    const email = body.email?.trim().toLowerCase().slice(0, 255);
    const company = body.company ? sanitizeHtml(body.company.slice(0, 100)) : undefined;
    const persona = body.persona;
    const offerId = body.offerId;
    const offerTitle = body.offerTitle ? sanitizeHtml(body.offerTitle) : body.offerTitle;
    const pdfPath = body.pdfPath;
    const purpose = body.purpose ? sanitizeHtml(body.purpose.slice(0, 500)) : undefined;
    const source = body.source;
    const bullets = body.bullets?.map(b => sanitizeHtml(b.slice(0, 200))).slice(0, 10);

    // Validate required fields
    if (!email || !persona || !offerId || !offerTitle || !pdfPath) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Try to find the lead magnet in database and increment download count
    const { data: leadMagnetRecord } = await supabase
      .from("lead_magnets")
      .select("id, storage_path, download_count")
      .eq("slug", offerId)
      .eq("is_active", true)
      .maybeSingle();

    if (leadMagnetRecord) {
      // Increment download count
      await supabase
        .from("lead_magnets")
        .update({ download_count: (leadMagnetRecord.download_count || 0) + 1 })
        .eq("id", leadMagnetRecord.id);
      logStep("Lead magnet found in DB", { id: leadMagnetRecord.id });
    }

    // Use storage_path from DB if available, otherwise use provided pdfPath
    const storagePath = leadMagnetRecord?.storage_path || pdfPath;

    // Generate signed URL for the PDF (valid for 7 days)
    const fullPdfPath = storagePath.startsWith("lead-magnets/") ? storagePath.replace("lead-magnets/", "") : storagePath;
    logStep("Generating signed URL", { fullPdfPath });

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("lead-magnets")
      .createSignedUrl(fullPdfPath, 60 * 60 * 24 * 7); // 7 days

    if (signedUrlError) {
      logStep("Error generating signed URL", { error: signedUrlError.message });
      // Continue without signed URL - we'll provide a fallback message
    }

    const downloadUrl = signedUrlData?.signedUrl || null;
    logStep("Signed URL generated", { hasUrl: !!downloadUrl });

    // Store in lead_magnet_downloads table
    const { data: downloadRecord, error: insertError } = await supabase
      .from("lead_magnet_downloads")
      .insert({
        email,
        name: name || null,
        company: company || null,
        persona_segment: persona,
        offer_id: offerId,
        offer_title: offerTitle,
        pdf_path: pdfPath,
        download_url: downloadUrl,
        purpose: purpose || null,
        source: source || "homepage",
      })
      .select()
      .single();

    if (insertError) {
      logStep("Error inserting download record", { error: insertError.message });
    } else {
      logStep("Download record created", { id: downloadRecord?.id });
    }

    // Also update/create contact in CRM
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingContact) {
      // Update existing contact
      await supabase
        .from("contacts")
        .update({
          persona_segment: persona,
          selected_offer_id: offerId,
          selected_offer_title: offerTitle,
          download_url: downloadUrl,
          lead_magnet_sent_at: new Date().toISOString(),
        })
        .eq("id", existingContact.id);
      logStep("Updated existing contact", { contactId: existingContact.id });
    } else {
      // Create new contact (without user_id for anonymous leads)
      const { error: contactError } = await supabase
        .from("contacts")
        .insert({
          name: name || email.split("@")[0],
          email,
          company: company || null,
          persona_segment: persona,
          selected_offer_id: offerId,
          selected_offer_title: offerTitle,
          download_url: downloadUrl,
          lead_source: "lead_magnet",
          lead_status: "new",
          lead_magnet_sent_at: new Date().toISOString(),
        });
      
      if (contactError) {
        logStep("Error creating contact", { error: contactError.message });
      } else {
        logStep("New contact created");
      }
    }

    // Build email content
    const bulletsList = bullets?.length 
      ? bullets.map(b => `<li style="margin-bottom: 8px;">${b}</li>`).join("")
      : "";

    const downloadSection = downloadUrl
      ? `<a href="${downloadUrl}" style="display: inline-block; background: #2C6BED; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0;">Download Your Report</a>`
      : `<p style="color: #666;">Your report is being prepared. A team member will send it to you shortly.</p>`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #053877; margin-bottom: 8px;">Your Report is Ready! 🎉</h1>
          <p style="color: #666; font-size: 16px;">Thanks for your interest${name ? `, ${name}` : ''}!</p>
        </div>
        
        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #053877; margin-top: 0; font-size: 20px;">${offerTitle}</h2>
          ${bulletsList ? `
          <p style="color: #666; margin-bottom: 12px;">Here's what you'll discover:</p>
          <ul style="color: #444; padding-left: 20px; margin: 0;">
            ${bulletsList}
          </ul>
          ` : ''}
        </div>

        <div style="text-align: center;">
          ${downloadSection}
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="color: #666; font-size: 14px;">
            Questions? Reply to this email or reach out at <a href="mailto:hello@seeksy.io" style="color: #2C6BED;">hello@seeksy.io</a>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            © ${new Date().getFullYear()} Seeksy. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    // Send email
    logStep("Sending email", { to: email });
    const emailResponse = await resend.emails.send({
      from: `Seeksy <${senderEmail}>`,
      to: [email],
      subject: `Your Report: ${offerTitle}`,
      html: emailHtml,
    });

    logStep("Email sent successfully", { emailId: emailResponse.data?.id });

    // Send internal notification (optional - to admin)
    try {
      await resend.emails.send({
        from: `Seeksy Leads <${senderEmail}>`,
        to: ["hello@seeksy.io"],
        subject: `🎯 New Lead Magnet Download: ${persona}`,
        html: `
          <h2>New Lead Magnet Download</h2>
          <p><strong>Name:</strong> ${name || 'Not provided'}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${company || 'Not provided'}</p>
          <p><strong>Persona:</strong> ${persona}</p>
          <p><strong>Report:</strong> ${offerTitle}</p>
          <p><strong>Purpose:</strong> ${purpose || 'Not provided'}</p>
          <p><strong>Source:</strong> ${source || 'homepage'}</p>
        `,
      });
      logStep("Internal notification sent");
    } catch (notifError) {
      logStep("Internal notification failed (non-critical)", { error: String(notifError) });
    }

    // Don't expose signed URL in API response - only sent via email
    return new Response(
      JSON.stringify({
        success: true,
        message: "Lead magnet sent successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    logStep("Error in send-lead-magnet", { error: String(error) });
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
