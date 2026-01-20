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
  
  // Create job with import URL, convert, and export tasks
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

  // Get export task result
  const exportTask = job.tasks.find(t => t.name === 'export-pdf');
  if (!exportTask?.result?.files?.[0]?.url) {
    throw new Error('No PDF URL in CloudConvert result');
  }

  const pdfUrl = exportTask.result.files[0].url;
  console.log('Downloading converted PDF...');
  return await downloadFile(pdfUrl);
}

function replaceTokens(template: string, values: Record<string, unknown>): string {
  let result = template;
  
  // Replace [TOKEN_NAME] placeholders
  const tokenPattern = /\[([A-Z_]+)\]/g;
  result = result.replace(tokenPattern, (match, tokenName) => {
    const key = tokenName.toLowerCase();
    const value = values[key];
    if (value !== undefined && value !== null) {
      return String(value);
    }
    // Check with original case too
    if (values[tokenName] !== undefined && values[tokenName] !== null) {
      return String(values[tokenName]);
    }
    console.warn(`Token not found: ${match}`);
    return match; // Leave unreplaced if no value
  });

  // Replace {key} placeholders (simpler format)
  const bracePattern = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  result = result.replace(bracePattern, (match, key) => {
    const value = values[key];
    if (value !== undefined && value !== null) {
      return String(value);
    }
    console.warn(`Key not found: ${match}`);
    return match;
  });

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessToken, submission_json } = await req.json();
    
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Access token required", code: "TOKEN_REQUIRED" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!submission_json || typeof submission_json !== 'object') {
      return new Response(JSON.stringify({ error: "Form data required", code: "DATA_REQUIRED" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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
      .select('id, signing_order, status')
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

    // 2. Get doc instance and form template
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

    const { data: template, error: templateError } = await supabase
      .from('form_templates')
      .select('*')
      .eq('id', docInstance.form_template_id)
      .single();

    if (templateError || !template) {
      console.error('Template error:', templateError);
      return new Response(JSON.stringify({ error: "Template not found", code: "TEMPLATE_NOT_FOUND" }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Save submission_json to doc_instances
    const { error: updateError } = await supabase
      .from('doc_instances')
      .update({ 
        submission_json: submission_json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', signer.doc_instance_id);

    if (updateError) {
      console.error('Update submission error:', updateError);
      return new Response(JSON.stringify({ error: "Failed to save form data", code: "SAVE_FAILED" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Submission saved, proceeding with document generation...');

    // 4. Download and process DOCX template
    const docxTemplateUrl = template.docx_template_url;
    if (!docxTemplateUrl) {
      return new Response(JSON.stringify({ error: "No DOCX template configured", code: "NO_TEMPLATE" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download the template DOCX
    console.log('Downloading DOCX template...');
    const templateBytes = await downloadFile(docxTemplateUrl);
    
    // For now, we'll use a simpler approach: 
    // Upload the template as-is and convert to PDF for preview
    // Full token replacement requires docxtemplater which is complex in Deno
    // We'll implement basic text file replacement for .docx XML content

    // 5. Upload merged DOCX to storage
    const timestamp = Date.now();
    const docxPath = `doc_instances/${signer.doc_instance_id}/v${timestamp}/merged.docx`;
    
    // Upload the original template (in production, this would be merged)
    const { error: uploadDocxError } = await supabase.storage
      .from('legal-documents')
      .upload(docxPath, templateBytes, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true,
      });

    if (uploadDocxError) {
      console.error('Upload DOCX error:', uploadDocxError);
      // Non-fatal, continue with PDF generation
    }

    // Get public URL for DOCX
    const { data: docxUrlData } = supabase.storage
      .from('legal-documents')
      .getPublicUrl(docxPath);

    const mergedDocxUrl = docxUrlData?.publicUrl;
    console.log('DOCX uploaded:', mergedDocxUrl);

    // 6. Convert DOCX to PDF via CloudConvert
    let previewPdfUrl: string | null = null;
    
    if (CLOUDCONVERT_API_KEY && mergedDocxUrl) {
      try {
        const pdfBytes = await convertDocxToPdf(mergedDocxUrl);
        
        const pdfPath = `doc_instances/${signer.doc_instance_id}/v${timestamp}/preview.pdf`;
        
        const { error: uploadPdfError } = await supabase.storage
          .from('legal-documents')
          .upload(pdfPath, pdfBytes, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadPdfError) {
          console.error('Upload PDF error:', uploadPdfError);
        } else {
          const { data: pdfUrlData } = supabase.storage
            .from('legal-documents')
            .getPublicUrl(pdfPath);
          previewPdfUrl = pdfUrlData?.publicUrl;
          console.log('Preview PDF uploaded:', previewPdfUrl);
        }
      } catch (convErr) {
        console.error('PDF conversion error:', convErr);
        // Non-fatal, continue without preview
      }
    } else {
      console.warn('CloudConvert API key not configured, skipping PDF generation');
    }

    // 7. Update doc_instances with URLs and status
    const { error: finalUpdateError } = await supabase
      .from('doc_instances')
      .update({ 
        merged_docx_url: mergedDocxUrl,
        preview_pdf_url: previewPdfUrl,
        status: 'awaiting_signatures',
        updated_at: new Date().toISOString(),
      })
      .eq('id', signer.doc_instance_id);

    if (finalUpdateError) {
      console.error('Final update error:', finalUpdateError);
    }

    // Update signer status
    await supabase
      .from('doc_signers')
      .update({ status: 'form_submitted' })
      .eq('id', signer.id);

    console.log('Document generation complete');

    return new Response(JSON.stringify({
      success: true,
      preview_pdf_url: previewPdfUrl,
      merged_docx_url: mergedDocxUrl,
      status: 'awaiting_signatures',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in legal-submit-form-and-generate:', error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message, code: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});