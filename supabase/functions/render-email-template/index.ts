import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { templates } from "../_shared/email/templates.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateKey, variables, recipientEmail } = await req.json();

    if (!templateKey || !variables) {
      throw new Error("Missing templateKey or variables");
    }

    // Get template from database
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_key", templateKey)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    // Get the template renderer function
    const templateRenderer = templates[templateKey as keyof typeof templates];
    if (!templateRenderer) {
      throw new Error(`Template renderer not implemented: ${templateKey}`);
    }

    // Render the template with variables
    let html = templateRenderer(variables);

    // Get persona signature if template has persona
    const personaSignatures: Record<string, string> = {
      'Lex': 'Sent with ❤️ by Lex — Your Seeksy Identity Guardian',
      'Mia': 'Sent with ❤️ by Mia — Your Seeksy Meeting Assistant',
      'Echo': 'Sent with ❤️ by Echo — Your Seeksy Studio Assistant',
      'Reel': 'Sent with ❤️ by Reel — Your Seeksy Clips Assistant',
      'Castor': 'Sent with ❤️ by Castor — Your Seeksy Podcast Assistant',
      'Atlas': 'Sent with ❤️ by Atlas — Your Seeksy Audience Assistant',
      'Scribe': 'Sent with ❤️ by Scribe — Your Seeksy Marketing Assistant',
    };

    const personaSignature = template.persona && personaSignatures[template.persona as string]
      ? personaSignatures[template.persona as string]
      : 'Sent by Seeksy';

    // Replace common placeholders
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace("/rest/v1", "") || "https://seeksy.io";
    
    html = html.replace(/\{\{BASE_URL\}\}/g, baseUrl);
    html = html.replace(/\{\{EMAIL\}\}/g, recipientEmail || "");
    html = html.replace(/\{\{LOGO_URL\}\}/g, `${baseUrl}/storage/v1/object/public/logos/main_logo`);
    html = html.replace(/\{\{MASCOT_URL\}\}/g, `${baseUrl}/storage/v1/object/public/logos/mascots/default`);
    html = html.replace(/\{\{PERSONA_SIGNATURE\}\}/g, personaSignature);
    html = html.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, `${baseUrl}/unsubscribe?email=${recipientEmail}`);

    // Replace template-specific variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\{${key.toUpperCase()}\\}\\}`, 'g');
      html = html.replace(placeholder, String(value));
    });

    return new Response(
      JSON.stringify({
        success: true,
        html,
        template: {
          id: template.id,
          name: template.template_name,
          key: template.template_key,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error rendering email template:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
