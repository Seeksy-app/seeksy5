import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLOUDCONVERT_API_KEY = Deno.env.get('CLOUDCONVERT_API_KEY');

interface CloudConvertJob {
  id: string;
  status: string;
  tasks: Array<{
    id: string;
    name: string;
    status: string;
    result?: {
      files?: Array<{ url: string; filename: string }>;
    };
  }>;
}

async function downloadFile(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download file: ${res.statusText}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function convertDocxToPdf(docxUrl: string): Promise<Uint8Array> {
  console.log('Starting CloudConvert DOCX to PDF conversion...');
  
  const createJobRes = await fetch('https://api.cloudconvert.com/v2/jobs', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tasks: {
        'import-docx': {
          operation: 'import/url',
          url: docxUrl,
        },
        'convert-to-pdf': {
          operation: 'convert',
          input: 'import-docx',
          output_format: 'pdf',
        },
        'export-pdf': {
          operation: 'export/url',
          input: 'convert-to-pdf',
        },
      },
    }),
  });

  if (!createJobRes.ok) {
    const errorText = await createJobRes.text();
    console.error('CloudConvert job creation failed:', errorText);
    throw new Error(`CloudConvert job creation failed: ${createJobRes.statusText}`);
  }

  const jobData = await createJobRes.json();
  const jobId = jobData.data.id;
  console.log(`CloudConvert job created: ${jobId}`);

  // Poll for job completion
  let job: CloudConvertJob | null = null;
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000));
    
    const statusRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
      headers: { 'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}` },
    });
    
    if (!statusRes.ok) continue;
    
    const statusData = await statusRes.json();
    job = statusData.data as CloudConvertJob;
    
    console.log(`Job status: ${job.status}`);
    
    if (job.status === 'finished') break;
    if (job.status === 'error') {
      throw new Error('CloudConvert job failed');
    }
  }

  if (!job || job.status !== 'finished') {
    throw new Error('CloudConvert job timed out');
  }

  const exportTask = job.tasks.find(t => t.name === 'export-pdf');
  if (!exportTask?.result?.files?.[0]?.url) {
    throw new Error('No PDF URL in CloudConvert result');
  }

  const pdfUrl = exportTask.result.files[0].url;
  console.log('Downloading converted PDF...');
  return await downloadFile(pdfUrl);
}

function base64ToUint8Array(base64: string): Uint8Array {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function hashIP(ip: string): string {
  // Simple hash for IP anonymization
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessToken, signature_png_base64, signature_type } = await req.json();
    
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Access token required", code: "TOKEN_REQUIRED" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!signature_png_base64) {
      return new Response(JSON.stringify({ error: "Signature required", code: "SIGNATURE_REQUIRED" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get client IP for audit
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    const ipHash = hashIP(clientIP);

    // 1. Validate signer access
    const { data: signer, error: signerError } = await supabase
      .from('doc_signers')
      .select('*')
      .eq('access_token', accessToken)
      .maybeSingle();

    if (signerError || !signer) {
      console.error('Signer lookup error:', signerError);
      return new Response(JSON.stringify({ error: "Invalid or expired access token", code: "INVALID_TOKEN" }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if already signed
    if (signer.status === 'signed') {
      return new Response(JSON.stringify({ error: "Already signed", code: "ALREADY_SIGNED" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check token expiry
    if (signer.token_expires_at && new Date(signer.token_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Access token has expired", code: "TOKEN_EXPIRED" }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check sequential order
    const { data: allSigners } = await supabase
      .from('doc_signers')
      .select('id, signing_order, status, role')
      .eq('doc_instance_id', signer.doc_instance_id)
      .order('signing_order');

    if (allSigners) {
      for (const s of allSigners) {
        if (s.signing_order < signer.signing_order && s.status !== 'signed') {
          return new Response(JSON.stringify({ 
            error: "Previous signer must complete first", 
            code: "ORDER_VIOLATION" 
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // 2. Get doc instance
    const { data: docInstance, error: docError } = await supabase
      .from('doc_instances')
      .select('*')
      .eq('id', signer.doc_instance_id)
      .single();

    if (docError || !docInstance) {
      console.error('Doc instance error:', docError);
      return new Response(JSON.stringify({ error: "Document not found", code: "DOC_NOT_FOUND" }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Save signature PNG to storage
    const signatureBytes = base64ToUint8Array(signature_png_base64);
    const timestamp = Date.now();
    const signaturePath = `doc_instances/${signer.doc_instance_id}/signatures/${signer.role}_${timestamp}.png`;
    
    const { error: uploadSigError } = await supabase.storage
      .from('legal-documents')
      .upload(signaturePath, signatureBytes, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadSigError) {
      console.error('Upload signature error:', uploadSigError);
      return new Response(JSON.stringify({ error: "Failed to save signature", code: "SIGNATURE_SAVE_FAILED" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: sigUrlData } = supabase.storage
      .from('legal-documents')
      .getPublicUrl(signaturePath);

    const signatureUrl = sigUrlData?.publicUrl;
    console.log('Signature saved:', signatureUrl);

    // 4. Update doc_signers row
    const signedAt = new Date().toISOString();
    const { error: updateSignerError } = await supabase
      .from('doc_signers')
      .update({
        status: 'signed',
        signed_at: signedAt,
        signature_image_url: signatureUrl,
        signature_type: signature_type || 'drawn',
        ip_hash: ipHash,
        updated_at: signedAt,
      })
      .eq('id', signer.id);

    if (updateSignerError) {
      console.error('Update signer error:', updateSignerError);
    }

    // 5. Check if all signers have signed
    const { data: updatedSigners } = await supabase
      .from('doc_signers')
      .select('id, signing_order, status, role, signed_at, name, email')
      .eq('doc_instance_id', signer.doc_instance_id)
      .order('signing_order');

    const allSigned = updatedSigners?.every(s => s.status === 'signed') ?? false;
    console.log(`All signers signed: ${allSigned}`);

    // 6. Regenerate PDF with current signatures
    let latestPdfUrl: string | null = docInstance.preview_pdf_url;
    let finalPdfUrl: string | null = null;

    if (docInstance.merged_docx_url && CLOUDCONVERT_API_KEY) {
      try {
        // For now, regenerate from merged DOCX
        // In production, we'd merge signature images into the DOCX first
        const pdfBytes = await convertDocxToPdf(docInstance.merged_docx_url);
        
        const pdfPath = `doc_instances/${signer.doc_instance_id}/v${timestamp}/current.pdf`;
        
        const { error: uploadPdfError } = await supabase.storage
          .from('legal-documents')
          .upload(pdfPath, pdfBytes, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (!uploadPdfError) {
          const { data: pdfUrlData } = supabase.storage
            .from('legal-documents')
            .getPublicUrl(pdfPath);
          latestPdfUrl = pdfUrlData?.publicUrl;
          console.log('Current PDF generated:', latestPdfUrl);
        }
      } catch (convErr) {
        console.error('PDF regeneration error:', convErr);
      }
    }

    // 7. If all signed, mark as completed and set final PDF
    if (allSigned) {
      finalPdfUrl = latestPdfUrl;
      
      // Build audit trail
      const auditTrail = {
        document_id: signer.doc_instance_id,
        completed_at: new Date().toISOString(),
        signers: updatedSigners?.map(s => ({
          role: s.role,
          name: s.name,
          email: s.email,
          signed_at: s.signed_at,
        })),
      };

      const { error: finalizeError } = await supabase
        .from('doc_instances')
        .update({
          status: 'completed',
          final_pdf_url: finalPdfUrl,
          preview_pdf_url: latestPdfUrl,
          audit_json: auditTrail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', signer.doc_instance_id);

      if (finalizeError) {
        console.error('Finalize error:', finalizeError);
      }

      console.log('Document finalized and completed');
    } else {
      // Update preview URL only
      await supabase
        .from('doc_instances')
        .update({
          preview_pdf_url: latestPdfUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', signer.doc_instance_id);
    }

    return new Response(JSON.stringify({
      success: true,
      status: allSigned ? 'completed' : 'awaiting_signatures',
      latest_pdf_url: latestPdfUrl,
      final_pdf_url: finalPdfUrl,
      all_signed: allSigned,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in legal-sign-and-finalize:', error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message, code: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});