import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessToken } = await req.json();
    
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Access token required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get signer by token
    const { data: signer, error: signerError } = await supabase
      .from('doc_signers')
      .select('*')
      .eq('access_token', accessToken)
      .maybeSingle();

    if (signerError || !signer) {
      console.error('Signer lookup error:', signerError);
      return new Response(JSON.stringify({ error: "Invalid or expired access token" }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check token expiry
    if (signer.token_expires_at && new Date(signer.token_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Access token has expired" }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get doc instance
    const { data: docInstance, error: docError } = await supabase
      .from('doc_instances')
      .select('*')
      .eq('id', signer.doc_instance_id)
      .single();

    if (docError || !docInstance) {
      console.error('Doc instance error:', docError);
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get form template
    const { data: template, error: templateError } = await supabase
      .from('form_templates')
      .select('name, schema_json, signer_config_json')
      .eq('id', docInstance.form_template_id)
      .single();

    if (templateError || !template) {
      console.error('Template error:', templateError);
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if this signer is allowed (sequential order check)
    const { data: allSigners } = await supabase
      .from('doc_signers')
      .select('id, signing_order, status')
      .eq('doc_instance_id', signer.doc_instance_id)
      .order('signing_order');

    let isCurrentSignerAllowed = true;
    if (allSigners) {
      for (const s of allSigners) {
        if (s.signing_order < signer.signing_order && s.status !== 'signed') {
          isCurrentSignerAllowed = false;
          break;
        }
      }
    }

    // Mark as viewed if first access
    if (signer.status === 'pending') {
      await supabase
        .from('doc_signers')
        .update({ status: 'viewed' })
        .eq('id', signer.id);
    }

    console.log(`Signer context retrieved for ${signer.email}, allowed: ${isCurrentSignerAllowed}`);

    return new Response(JSON.stringify({
      doc_instance_id: signer.doc_instance_id,
      signer_id: signer.id,
      role: signer.role,
      email: signer.email,
      signing_order: signer.signing_order,
      status: signer.status,
      is_current_signer_allowed: isCurrentSignerAllowed,
      form_template: {
        name: template.name,
        schema_json: template.schema_json,
        signer_config_json: template.signer_config_json,
      },
      doc_instance: {
        status: docInstance.status,
        submission_json: docInstance.submission_json,
        preview_pdf_url: docInstance.preview_pdf_url,
        final_pdf_url: docInstance.final_pdf_url,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in legal-get-signer-context:', error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
