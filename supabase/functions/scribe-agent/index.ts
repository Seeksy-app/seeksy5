import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { action, input, contactId, tone, context } = await req.json();

    console.log(`Scribe Agent action: ${action}`);

    // Fetch contact data if contactId provided
    let contactData = null;
    if (contactId) {
      const { data: contact } = await supabase
        .from("contacts")
        .select(`
          *,
          contact_preferences(*),
          contact_tags(tags(name)),
          contact_list_members(contact_lists(name))
        `)
        .eq("id", contactId)
        .single();
      
      contactData = contact;
    }

    // Fetch user's email signature/tone preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Build system prompt based on action
    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "draft":
        systemPrompt = buildDraftPrompt(tone, profile, contactData);
        userPrompt = input;
        break;
      
      case "rewrite":
        systemPrompt = buildRewritePrompt(tone);
        userPrompt = `Rewrite this email:\n\n${input}`;
        break;
      
      case "personalize":
        systemPrompt = buildPersonalizePrompt(contactData, context);
        userPrompt = `Personalize this email for ${contactData?.first_name || contactData?.email}:\n\n${input}`;
        break;
      
      case "check_deliverability":
        systemPrompt = buildDeliverabilityPrompt();
        userPrompt = `Analyze this email for deliverability issues:\n\nSubject: ${context?.subject}\n\nBody:\n${input}`;
        break;
      
      case "improve_subject":
        systemPrompt = buildSubjectPrompt(tone);
        userPrompt = `Current subject: ${input}\n\nContext: ${context?.emailBody || ""}`;
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices[0].message.content;

    // Parse response based on action
    let result: any = { text: generatedText };

    if (action === "draft" || action === "rewrite" || action === "personalize") {
      result = parseEmailOutput(generatedText);
    } else if (action === "check_deliverability") {
      result = parseDeliverabilityOutput(generatedText);
    } else if (action === "improve_subject") {
      result = parseSubjectOutput(generatedText);
    }

    console.log(`Scribe Agent success for action: ${action}`);

    return new Response(
      JSON.stringify({ success: true, result }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Scribe Agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function buildDraftPrompt(tone: string, profile: any, contactData: any): string {
  return `You are Scribe, an AI email assistant for Seeksy. Generate a complete, professional email.

TONE: ${tone || "Professional but friendly"}
SENDER: ${profile?.full_name || "Seeksy Team"}

OUTPUT FORMAT:
Subject: [compelling subject line]
Preheader: [preview text, 50-100 chars]
Body: [email body with proper formatting, include merge tags like {{contact.first_name}} where appropriate]

${contactData ? `
RECIPIENT CONTEXT:
- Name: ${contactData.first_name} ${contactData.last_name || ""}
- Email: ${contactData.email}
- Tags: ${contactData.contact_tags?.map((t: any) => t.tags?.name).join(", ") || "None"}
` : ""}

RULES:
- Use HTML formatting (paragraphs, bold, links)
- Include clear CTA
- Keep subject under 50 characters
- Avoid spam triggers (all caps, excessive exclamation marks, "free", "act now")
- Add merge tags {{contact.first_name}} for personalization
- Sign off appropriately for the tone`;
}

function buildRewritePrompt(tone: string): string {
  return `You are Scribe, an AI email rewriting specialist. Rewrite the provided email in ${tone || "professional"} tone.

RULES:
- Maintain original intent and key information
- Improve clarity, brevity, and persuasiveness
- Use proper HTML formatting
- Ensure CTA is clear
- Avoid spam triggers
- Return in same format: Subject, Preheader, Body`;
}

function buildPersonalizePrompt(contactData: any, context: any): string {
  return `You are Scribe, an AI personalization specialist. Add personalization to this email.

RECIPIENT:
- Name: ${contactData?.first_name} ${contactData?.last_name || ""}
- Email: ${contactData?.email}
- Recent activity: ${context?.recentActivity || "None"}
- Tags: ${contactData?.contact_tags?.map((t: any) => t.tags?.name).join(", ") || "None"}

RULES:
- Use {{contact.first_name}} merge tag
- Reference recent interactions if provided
- Keep tone warm but professional
- Don't over-personalize (avoid creepy)`;
}

function buildDeliverabilityPrompt(): string {
  return `You are Scribe, an email deliverability expert. Analyze this email for spam triggers and deliverability issues.

CHECK FOR:
- Spam trigger words (free, guaranteed, act now, etc.)
- All caps in subject/body
- Excessive punctuation (!!!, ???)
- Too many links (>5)
- Missing text alternative to images
- Broken merge tags
- Poor text-to-image ratio

OUTPUT FORMAT:
Score: [0-100]
Issues: [list issues if any]
Suggestions: [actionable fixes]`;
}

function buildSubjectPrompt(tone: string): string {
  return `You are Scribe, an email subject line expert. Generate 3 alternative subject lines.

TONE: ${tone || "Professional"}

RULES:
- Each under 50 characters
- No spam triggers
- Include emoji if appropriate for tone
- Focus on benefit/curiosity/urgency
- Avoid clickbait

OUTPUT:
1. [subject line 1]
2. [subject line 2]
3. [subject line 3]`;
}

function parseEmailOutput(text: string): any {
  const subjectMatch = text.match(/Subject:\s*(.+)/i);
  const preheaderMatch = text.match(/Preheader:\s*(.+)/i);
  const bodyMatch = text.match(/Body:\s*([\s\S]+)/i);

  return {
    subject: subjectMatch?.[1]?.trim() || "",
    preheader: preheaderMatch?.[1]?.trim() || "",
    body: bodyMatch?.[1]?.trim() || text,
  };
}

function parseDeliverabilityOutput(text: string): any {
  const scoreMatch = text.match(/Score:\s*(\d+)/i);
  const issuesMatch = text.match(/Issues:\s*([\s\S]+?)(?=Suggestions:|$)/i);
  const suggestionsMatch = text.match(/Suggestions:\s*([\s\S]+)/i);

  return {
    score: parseInt(scoreMatch?.[1] || "70"),
    issues: issuesMatch?.[1]?.trim().split("\n").filter(Boolean) || [],
    suggestions: suggestionsMatch?.[1]?.trim().split("\n").filter(Boolean) || [],
  };
}

function parseSubjectOutput(text: string): any {
  const lines = text.split("\n").filter(line => line.match(/^\d\./));
  return {
    alternatives: lines.map(line => line.replace(/^\d\.\s*/, "").trim()),
  };
}
