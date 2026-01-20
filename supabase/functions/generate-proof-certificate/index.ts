import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CertificateRequest {
  contentId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { contentId } = await req.json() as CertificateRequest;

    console.log(`Generating proof certificate for content: ${contentId}`);

    // Get content details
    const { data: content, error: contentError } = await supabaseClient
      .from("protected_content")
      .select(`
        *,
        profiles:user_id (
          full_name,
          username
        )
      `)
      .eq("id", contentId)
      .single();

    if (contentError || !content) {
      return new Response(
        JSON.stringify({ error: "Content not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate certificate data
    const certificateData = {
      contentId: content.id,
      title: content.title,
      contentType: content.content_type,
      creatorName: content.profiles?.full_name || content.profiles?.username || "Unknown Creator",
      fingerprintHash: content.fingerprint_hash,
      registeredAt: content.fingerprint_registered_at || content.created_at,
      certificateId: crypto.randomUUID(),
      issuedAt: new Date().toISOString(),
      issuer: "Seeksy Content Protection",
    };

    // Generate certificate hash for verification
    const certificateString = JSON.stringify(certificateData);
    const encoder = new TextEncoder();
    const data = encoder.encode(certificateString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = new Uint8Array(hashBuffer);
    const certificateHash = Array.from(hashArray).map(b => b.toString(16).padStart(2, "0")).join("");

    // Update content with certificate info
    await supabaseClient
      .from("protected_content")
      .update({
        proof_certificate_hash: certificateHash,
        proof_certificate_issued_at: certificateData.issuedAt,
      })
      .eq("id", contentId);

    // Generate certificate HTML (for PDF conversion on client)
    const certificateHtml = generateCertificateHtml(certificateData, certificateHash);

    return new Response(
      JSON.stringify({
        success: true,
        certificate: {
          ...certificateData,
          hash: certificateHash,
          verificationUrl: `https://app.seeksy.io/verify/${certificateHash}`,
        },
        html: certificateHtml,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Certificate generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateCertificateHtml(data: any, hash: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Content Protection Certificate - ${data.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Georgia', serif; 
      background: linear-gradient(135deg, #053877 0%, #2C6BED 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }
    .certificate {
      background: white;
      width: 800px;
      padding: 60px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      position: relative;
    }
    .certificate::before {
      content: '';
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      border: 2px solid #053877;
      border-radius: 12px;
      pointer-events: none;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #053877;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #666;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 3px;
    }
    h1 {
      text-align: center;
      font-size: 28px;
      color: #053877;
      margin: 30px 0;
      border-bottom: 2px solid #2C6BED;
      padding-bottom: 20px;
    }
    .content-title {
      text-align: center;
      font-size: 24px;
      color: #333;
      margin: 20px 0;
      font-style: italic;
    }
    .details {
      margin: 40px 0;
    }
    .detail-row {
      display: flex;
      margin: 16px 0;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }
    .detail-label {
      font-weight: bold;
      color: #053877;
      width: 200px;
    }
    .detail-value {
      color: #333;
      flex: 1;
      word-break: break-all;
    }
    .hash-box {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
      text-align: center;
    }
    .hash-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }
    .hash-value {
      font-family: monospace;
      font-size: 12px;
      color: #053877;
      word-break: break-all;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      color: #666;
      font-size: 12px;
    }
    .verification {
      background: #053877;
      color: white;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
      margin-top: 30px;
    }
    .verification a {
      color: #2C6BED;
      text-decoration: none;
    }
    .seal {
      position: absolute;
      bottom: 60px;
      right: 60px;
      width: 100px;
      height: 100px;
      border: 3px solid #2C6BED;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 10px;
      color: #2C6BED;
      text-transform: uppercase;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">SEEKSY</div>
      <div class="subtitle">Content Protection Service</div>
    </div>
    
    <h1>Certificate of Content Protection</h1>
    
    <p style="text-align: center; color: #666; margin-bottom: 20px;">
      This certifies that the following content has been registered and protected
    </p>
    
    <div class="content-title">"${data.title}"</div>
    
    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Creator</span>
        <span class="detail-value">${data.creatorName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Content Type</span>
        <span class="detail-value">${data.contentType}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Registered On</span>
        <span class="detail-value">${new Date(data.registeredAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Certificate ID</span>
        <span class="detail-value">${data.certificateId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Issued On</span>
        <span class="detail-value">${new Date(data.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
    
    <div class="hash-box">
      <div class="hash-label">Content Fingerprint Hash</div>
      <div class="hash-value">${data.fingerprintHash || 'Pending'}</div>
    </div>
    
    <div class="hash-box">
      <div class="hash-label">Certificate Verification Hash</div>
      <div class="hash-value">${hash}</div>
    </div>
    
    <div class="verification">
      <p style="margin-bottom: 8px;">Verify this certificate at:</p>
      <p style="font-family: monospace;">https://app.seeksy.io/verify/${hash}</p>
    </div>
    
    <div class="footer">
      <p>This certificate was automatically generated by Seeksy Content Protection.</p>
      <p>The content fingerprint is stored in a tamper-proof registry.</p>
    </div>
    
    <div class="seal">
      <div>
        VERIFIED<br>
        PROTECTED<br>
        ✓
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
