import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "invite" | "finalize" | "completed";
  purchaserEmail: string;
  purchaserName?: string;
  sellerName?: string;
  chairmanEmail?: string;
  chairmanName?: string;
  purchaserLink?: string;
  chairmanLink?: string;
  documentTitle?: string;
  numberOfShares?: number;
  purchaseAmount?: number;
  pricePerShare?: number;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const getInviteEmailHtml = (data: EmailRequest) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #053877; font-size: 24px; margin: 0 0 8px 0;">Stock Purchase Agreement</h1>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">Document Ready for Your Review</p>
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
        Dear ${data.purchaserName || 'Purchaser'},
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
        A Common Stock Purchase Agreement has been prepared for your review. Please click the button below to access the document, complete your information, and provide your signature.
      </p>
      
      ${data.numberOfShares || data.purchaseAmount ? `
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
        <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Investment Details</p>
        ${data.pricePerShare ? `<p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;"><strong>Price per Share:</strong> $${data.pricePerShare.toFixed(2)}</p>` : ''}
        ${data.numberOfShares ? `<p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;"><strong>Number of Shares:</strong> ${data.numberOfShares.toLocaleString()}</p>` : ''}
        ${data.purchaseAmount ? `<p style="color: #374151; font-size: 14px; margin: 0;"><strong>Total Investment:</strong> $${data.purchaseAmount.toLocaleString()}</p>` : ''}
      </div>
      ` : ''}
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.purchaserLink}" style="display: inline-block; background-color: #2C6BED; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Review & Sign Document
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 22px; margin: 0 0 16px 0;">
        If you have any questions about this agreement, please contact the seller directly.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
        This is an automated message from Seeksy. Please do not reply directly to this email.
      </p>
    </div>
  </div>
</body>
</html>
`;

const getFinalizeEmailHtml = (data: EmailRequest, recipientType: "purchaser" | "chairman") => {
  const isPurchaser = recipientType === "purchaser";
  const recipientName = isPurchaser ? data.purchaserName : data.chairmanName;
  const signatureLink = isPurchaser ? data.purchaserLink : data.chairmanLink;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 64px; height: 64px; background-color: #FEF3C7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
          <span style="font-size: 32px;">✍️</span>
        </div>
        <h1 style="color: #053877; font-size: 24px; margin: 0 0 8px 0;">Signature Required</h1>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">Stock Purchase Agreement Finalized</p>
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
        Dear ${recipientName || (isPurchaser ? 'Purchaser' : 'Chairman')},
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
        The Common Stock Purchase Agreement has been finalized and is now ready for your signature. 
        ${isPurchaser 
          ? 'Please review the final terms and provide your signature to proceed.' 
          : 'Both the Seller and Purchaser have signed. Please review and provide your countersignature as Chairman of the Board.'}
      </p>
      
      ${data.numberOfShares || data.purchaseAmount ? `
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
        <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Agreement Summary</p>
        ${data.purchaserName ? `<p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;"><strong>Purchaser:</strong> ${data.purchaserName}</p>` : ''}
        ${data.pricePerShare ? `<p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;"><strong>Price per Share:</strong> $${data.pricePerShare.toFixed(2)}</p>` : ''}
        ${data.numberOfShares ? `<p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;"><strong>Number of Shares:</strong> ${data.numberOfShares.toLocaleString()}</p>` : ''}
        ${data.purchaseAmount ? `<p style="color: #374151; font-size: 14px; margin: 0;"><strong>Total Amount:</strong> $${data.purchaseAmount.toLocaleString()}</p>` : ''}
      </div>
      ` : ''}
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${signatureLink}" style="display: inline-block; background-color: #2C6BED; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Sign Agreement
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
        This is an automated message from Seeksy. Please do not reply directly to this email.
      </p>
    </div>
  </div>
</body>
</html>
`;
};

const getCompletedEmailHtml = (data: EmailRequest, downloadLink: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 64px; height: 64px; background-color: #D1FAE5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
          <span style="font-size: 32px;">✅</span>
        </div>
        <h1 style="color: #053877; font-size: 24px; margin: 0 0 8px 0;">Agreement Fully Executed</h1>
        <p style="color: #059669; font-size: 14px; margin: 0; font-weight: 600;">All Signatures Complete</p>
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
        Great news! The Common Stock Purchase Agreement has been fully executed with all required signatures:
      </p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span style="color: #059669; margin-right: 8px;">✓</span>
          <span style="color: #374151; font-size: 14px;"><strong>Seller:</strong> ${data.sellerName || 'Signed'}</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span style="color: #059669; margin-right: 8px;">✓</span>
          <span style="color: #374151; font-size: 14px;"><strong>Purchaser:</strong> ${data.purchaserName || 'Signed'}</span>
        </div>
        <div style="display: flex; align-items: center;">
          <span style="color: #059669; margin-right: 8px;">✓</span>
          <span style="color: #374151; font-size: 14px;"><strong>Chairman:</strong> ${data.chairmanName || 'Signed'}</span>
        </div>
      </div>
      
      ${data.numberOfShares || data.purchaseAmount ? `
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
        <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Final Agreement Details</p>
        ${data.pricePerShare ? `<p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;"><strong>Price per Share:</strong> $${data.pricePerShare.toFixed(2)}</p>` : ''}
        ${data.numberOfShares ? `<p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;"><strong>Number of Shares:</strong> ${data.numberOfShares.toLocaleString()}</p>` : ''}
        ${data.purchaseAmount ? `<p style="color: #374151; font-size: 14px; margin: 0;"><strong>Total Investment:</strong> $${data.purchaseAmount.toLocaleString()}</p>` : ''}
      </div>
      ` : ''}
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${downloadLink}" style="display: inline-block; background-color: #059669; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          View Signed Document
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 22px; margin: 0 0 16px 0; text-align: center;">
        A copy of the fully executed agreement is available at the link above.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
        This is an automated message from Seeksy. Please do not reply directly to this email.
      </p>
    </div>
  </div>
</body>
</html>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: EmailRequest = await req.json();
    console.log("📧 Sending legal agreement email:", data.type, "to:", data.purchaserEmail);

    const emails: { to: string; subject: string; html: string }[] = [];

    if (data.type === "invite") {
      emails.push({
        to: data.purchaserEmail,
        subject: "Stock Purchase Agreement - Ready for Your Review",
        html: getInviteEmailHtml(data),
      });
    } else if (data.type === "finalize") {
      // Email to purchaser
      if (data.purchaserEmail && data.purchaserLink) {
        emails.push({
          to: data.purchaserEmail,
          subject: "Stock Purchase Agreement - Signature Required",
          html: getFinalizeEmailHtml(data, "purchaser"),
        });
      }
      // Email to chairman
      if (data.chairmanEmail && data.chairmanLink) {
        emails.push({
          to: data.chairmanEmail,
          subject: "Stock Purchase Agreement - Chairman Signature Required",
          html: getFinalizeEmailHtml(data, "chairman"),
        });
      }
    } else if (data.type === "completed") {
      const downloadLink = data.purchaserLink || "#";
      
      // Email to purchaser
      if (data.purchaserEmail) {
        emails.push({
          to: data.purchaserEmail,
          subject: "Stock Purchase Agreement - Fully Executed ✅",
          html: getCompletedEmailHtml(data, downloadLink),
        });
      }
      // Email to chairman
      if (data.chairmanEmail) {
        emails.push({
          to: data.chairmanEmail,
          subject: "Stock Purchase Agreement - Fully Executed ✅",
          html: getCompletedEmailHtml(data, downloadLink),
        });
      }
    }

    // Send all emails
    const results = [];
    for (const email of emails) {
      try {
        const { data: emailData, error } = await resend.emails.send({
          from: "Seeksy Legal <legal@seeksy.io>",
          to: [email.to],
          subject: email.subject,
          html: email.html,
        });

        if (error) {
          console.error("❌ Failed to send email to:", email.to, error);
          results.push({ to: email.to, success: false, error: error.message });
        } else {
          console.log("✅ Email sent to:", email.to, emailData);
          results.push({ to: email.to, success: true, id: emailData?.id });
        }
      } catch (err) {
        console.error("❌ Email send error:", err);
        results.push({ to: email.to, success: false, error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Legal email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
