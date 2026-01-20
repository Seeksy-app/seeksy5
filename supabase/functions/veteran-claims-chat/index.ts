import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PM Spec: Military & Federal Benefits AI Agent System Prompt
const SYSTEM_PROMPT = `You are the YourBenefits AI Agent — a Military & Federal Benefits assistant.
You help veterans and federal employees understand benefits, prepare claims, and connect with accredited representatives.

## CRITICAL CONSTRAINTS
- You do NOT claim to be the VA, ID.me, or any government service
- You do NOT submit claims — users must complete final submission through official VA secure systems
- You do NOT access VA systems or request passwords/2FA codes
- You do NOT provide legal or medical advice

## YOUR CAPABILITIES
1. **Explain benefits** — eligibility, claim types, processes
2. **Prepare forms & documents** — Intent to File, evidence checklists, personal statements
3. **Use calculators internally** — when users ask "how much", estimate values silently and respond naturally
4. **Guide next steps** — AccessVA/QuickSubmit handoff, what to expect
5. **Connect with representatives** — VSOs, attorneys, claims agents

## CALCULATOR USAGE (INTERNAL ONLY)
When users ask questions like:
- "How much could I get?"
- "Estimate my VA compensation"
- "Is this worth filing?"

Do this:
1. Ask minimum required inputs (rating %, dependents if needed)
2. Calculate internally (do NOT tell user to "use a calculator")
3. Respond naturally: "Based on a 70% rating with 2 dependents, you'd receive approximately $X/month."
4. Offer to save the estimate or explain assumptions

NEVER say:
- "Use the calculator button in the sidebar"
- Suggest TSP, retirement tools, or unrelated financial calculators during claims conversations

## INTENT TO FILE GUIDANCE
Intent to File is ONE workflow, not the whole product. When guiding ITF:
- Always explain: "I can prepare everything, but final submission must be completed by you through VA secure systems."
- At end of flow, offer: download, next steps, representative connection, return to dashboard

## LEAD CAPTURE (NATURAL, NOT PUSHY)
When user reaches claim readiness or expresses confusion:
"Many veterans choose to work with an accredited representative for claims like this. Would you like me to help connect you with one?"

## TONE & FORMAT
- Empathetic, clear, professional
- Plain English (no jargon)
- SHORT: 2-4 sentences per paragraph max
- Action-oriented with clear next steps
- If distressed, slow down and offer resources

Always be transparent about limitations. Ask only the minimum questions needed.`;

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface LeadData {
  lead_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  zip?: string;
  state?: string;
  consent_to_contact?: boolean;
  preferred_contact?: string;
}

interface ClaimIntentData {
  intent_id?: string;
  lead_id?: string;
  goal?: string;
  claim_type?: string;
  conditions?: string[];
  service_era?: string;
  branch?: string;
  confidence?: number;
  needs_rep?: boolean;
  rep_preference?: string;
}

// Fetch relevant KB articles
async function getRelevantKBContext(query: string, supabaseUrl: string, serviceKey: string): Promise<string> {
  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    const { data, error } = await supabase
      .from('veteran_kb_articles')
      .select('title, content, category, source_name')
      .eq('is_published', true)
      .limit(5);

    if (error || !data || data.length === 0) return "";

    const scoredArticles = data.map(article => {
      const text = `${article.title} ${article.content}`.toLowerCase();
      let score = 0;
      keywords.forEach(keyword => {
        if (text.includes(keyword)) score++;
      });
      return { ...article, score };
    }).filter(a => a.score > 0).sort((a, b) => b.score - a.score).slice(0, 2);

    if (scoredArticles.length === 0) return "";

    const contextParts = scoredArticles.map(article => 
      `### ${article.title}\n${article.content.slice(0, 1200)}`
    );

    return `\n\nKNOWLEDGE BASE:\n${contextParts.join('\n\n')}`;
  } catch (error) {
    console.error("KB fetch error:", error);
    return "";
  }
}

// Search accredited reps by zip/state
async function searchAccreditedReps(zip: string | null, state: string | null, repType: string, supabaseUrl: string, serviceKey: string): Promise<string> {
  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    
    let query = supabase
      .from('vso_representatives')
      .select('id, full_name, organization_name, city, state, phone, email, accreditation_type')
      .eq('is_active', true)
      .limit(5);
    
    if (state) {
      query = query.eq('state', state.toUpperCase());
    }
    
    if (repType && repType !== 'any') {
      const typeMap: Record<string, string> = {
        'vso': 'Accredited VSO Representative',
        'attorney': 'Accredited Attorney',
        'claims_agent': 'Accredited Claims Agent'
      };
      if (typeMap[repType]) {
        query = query.eq('accreditation_type', typeMap[repType]);
      }
    }
    
    const { data, error } = await query;
    
    if (error || !data || data.length === 0) {
      return "No accredited representatives found for your criteria.";
    }
    
    const repList = data.map(r => 
      `- **${r.full_name}** (${r.organization_name || r.accreditation_type}) - ${r.city || ''}, ${r.state || ''}${r.phone ? ` | ${r.phone}` : ''}`
    ).join('\n');
    
    return `Found ${data.length} accredited representatives:\n${repList}`;
  } catch (error) {
    console.error("Rep search error:", error);
    return "Unable to search representatives at this time.";
  }
}

// Track events for analytics
async function trackEvent(leadId: string, eventName: string, metadata: Record<string, unknown>, supabaseUrl: string, serviceKey: string): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    await supabase.from('claim_events').insert({
      lead_id: leadId || null,
      event_name: eventName,
      metadata: metadata
    });
    console.log(`Tracked event: ${eventName}`);
  } catch (error) {
    console.error("Event tracking error:", error);
  }
}

// Calculate readiness score
function calculateReadinessScore(lead: LeadData, claimIntent: ClaimIntentData): number {
  let score = 0;
  
  // Contact info (30 points)
  if (lead.email) score += 15;
  if (lead.phone) score += 10;
  if (lead.first_name) score += 5;
  
  // Claim details (40 points)
  if (claimIntent.claim_type && claimIntent.claim_type !== 'unknown') score += 15;
  if (claimIntent.conditions && claimIntent.conditions.length > 0) score += 15;
  if (claimIntent.branch) score += 5;
  if (claimIntent.service_era) score += 5;
  
  // Rep preference (20 points)
  if (claimIntent.rep_preference && claimIntent.rep_preference !== 'unknown') score += 10;
  if (lead.consent_to_contact) score += 10;
  
  // Location (10 points)
  if (lead.zip || lead.state) score += 10;
  
  return Math.min(100, score);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, leadId, claimIntentId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get latest user message for context
    const latestUserMessage = messages.filter((m: Message) => m.role === 'user').pop();
    const userQuery = latestUserMessage?.content || "";

    // Fetch KB context
    let kbContext = "";
    let repContext = "";
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && userQuery) {
      kbContext = await getRelevantKBContext(userQuery, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Check if asking about reps
      if (/vso|representative|rep|attorney|agent|help|find/i.test(userQuery)) {
        // Try to extract state
        const stateMatch = userQuery.match(/\b([A-Z]{2})\b/);
        if (stateMatch) {
          repContext = await searchAccreditedReps(null, stateMatch[1], 'any', SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        }
      }
      
      // Track session
      if (leadId) {
        await trackEvent(leadId, 'ai_message_sent', { query_length: userQuery.length }, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      }
    }

    // Build enhanced prompt
    const enhancedPrompt = `${SYSTEM_PROMPT}

${kbContext}

${repContext ? `\nACCREDITED REPRESENTATIVES:\n${repContext}` : ''}

FLOW GUIDANCE:
When a user wants to file Intent to File, guide them through:
1. Ask for ZIP code (for rep matching)
2. Ask claim type: new claim, increase, secondary, or not sure
3. Ask for conditions in their own words
4. Collect contact info (first name, email, optional phone)
5. Ask if they want an accredited representative
6. Provide AccessVA QuickSubmit handoff

UI COPY TO USE:
- Handoff: "We can't submit to the VA for you. You'll sign in through the VA's secure system (ID.me) and upload your prepared documents there."
- Privacy: "Never share passwords or verification codes in chat. Enter them only on official VA/ID.me pages."
- Consent: "Is it okay if an accredited representative contacts you about your claim preparation?"

When ready to handoff, tell them:
"All set. Next step is uploading through the VA's secure tool (you'll sign in with ID.me).

I can't log in or submit for you, but here's the smooth path:
1. Click **Open AccessVA QuickSubmit** 
2. Sign in with ID.me
3. Upload the Intent to File PDF I prepared

The AccessVA QuickSubmit link is: https://eauth.va.gov/accessva/?cspSelectFor=quicksubmit"`;

    console.log("Sending request to Lovable AI with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: enhancedPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || "I couldn't generate a response.";

    console.log("Successfully received AI response");

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("veteran-claims-chat error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
