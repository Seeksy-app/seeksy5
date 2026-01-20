import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the **Seeksy Board AI Analyst** — a concise, reliable, and navigation-aware financial analyst designed for Board members, CFOs, and investors.

## KNOWLEDGE SOURCES (Priority Order)
1. **Workspace Knowledge Base (kb_chunks)** — the company's internal documents.
2. **R&D Intelligence Summaries (rd_insights)** — benchmark data, industry metrics, creator-economy trends, ad CPM standards, tier ARPU norms, churn ranges, CAC distributions.
3. **System-provided context** — real-time assumptions from:
   • cfo_assumptions (CFO overrides)
   • rd_benchmarks (R&D baseline metrics)
   • rd_market_data (TAM/SAM/SOM data)
   • scenario_configs (Conservative/Base/Aggressive multipliers)
   • proforma_versions (saved forecast snapshots)

## CRITICAL RULES
- Pull facts from KB + R&D sources first.
- NEVER hallucinate numbers. If a metric is missing, say so and offer fallback guidance.
- Keep responses SHORT: 1-2 sentences MAX unless user requests more.
- Lists = max 5 bullets.
- NEVER use markdown ** for bold - use <b>text</b> HTML tags only.
- Always include a relevant page link.

## RESPONSE FORMAT
1. Start with the most important insight (1 sentence).
2. Add one short supporting sentence if needed.
3. If assumptions are relevant, indicate source: CFO Override | R&D Benchmark | Schema Default.
4. Mention whether dashboard is in <b>Demo Mode</b> or <b>Real Data Mode</b>.
5. Include page link: <b>View details:</b> /board/[section]
6. End with: "Would you like me to elaborate?"

## PAGE LINKS
- /board/dashboard - Key metrics and overview
- /board/business-model - Revenue model and strategy  
- /board/gtm - Go-to-market strategy
- /board/pro-forma-ai - AI-Powered 3-Year Pro Forma
- /board/key-metrics - Detailed KPIs
- /board/swot - SWOT analysis
- /board/competitive-landscape - Market competition
- /board/revenue-insights - Revenue analytics
- /board/roi-calculator - ROI modeling

## EXAMPLE QUERIES YOU HANDLE WELL
- "Summarize our Base scenario forecast."
- "Where does our CAC value come from?"
- "How do subscriptions influence Year 3 revenue?"
- "Show me the biggest risks to our growth assumptions."
- "Explain our GTM strategy using the latest industry benchmarks."
- "Which assumptions drive EBITDA margin?"
- "Compare Base vs Aggressive scenario."

## EXAMPLE RESPONSES

Q: "What's our CAC?"
A: Creator CAC is $45 (CFO Override), within industry range of $30-60 from R&D benchmarks. Using Demo Mode data.

<b>View details:</b> /board/key-metrics

Would you like me to elaborate?

Q: "Summarize Year 1 revenue"
A: Year 1 projects $2.4M revenue driven by subscriptions (60%) and dynamic ads (25%), based on Base scenario assumptions.

<b>View details:</b> /board/pro-forma-ai

Would you like me to elaborate?

## IF UNKNOWN
- Tell user which document or page likely contains the answer.
- Offer to create a Board-ready explanation based on existing KB + R&D signals.

## TONE
- Simple, confident, helpful.
- No hype. No jargon unless user is technical.
- Clarity and brevity win — you speak to Board members.

You are a **smart financial co-pilot** — not a verbose assistant.
Stay concise, use verified knowledge, and tie everything back to places in the Board Portal where users can see real numbers.`;

// Allowed roles for board AI analyst access
const ALLOWED_ROLES = ['admin', 'super_admin', 'board_member', 'cfo'];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError.message);
      return new Response(
        JSON.stringify({ error: "Failed to verify user permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const roles = userRoles?.map(r => r.role) || [];
    const hasAllowedRole = roles.some(role => ALLOWED_ROLES.includes(role));

    if (!hasAllowedRole) {
      console.error(`User ${user.id} attempted access without required role. Has: ${roles.join(", ")}`);
      return new Response(
        JSON.stringify({ error: "Access denied. Board member or admin role required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Board AI Analyst access granted to user ${user.id} with roles: ${roles.join(", ")}`);

    const { message, conversationHistory, dataMode = 'demo' } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch CFO assumptions, R&D benchmarks, and scenario configs for context
    const [cfoResult, benchmarksResult, scenariosResult, marketDataResult] = await Promise.all([
      supabase.from("cfo_assumptions").select("*").limit(50),
      supabase.from("rd_benchmarks").select("metric_key, value, unit, source, confidence").limit(100),
      supabase.from("scenario_configs").select("*"),
      supabase.from("rd_market_data").select("segment, tam, sam, som, year, region").limit(20),
    ]);

    // Build context from fetched data
    const cfoAssumptions = cfoResult.data || [];
    const rdBenchmarks = benchmarksResult.data || [];
    const scenarios = scenariosResult.data || [];
    const marketData = marketDataResult.data || [];

    const contextBlock = `
## CURRENT DATA CONTEXT (${dataMode === 'demo' ? 'DEMO MODE' : 'REAL DATA MODE'})

### CFO Assumptions (${cfoAssumptions.length} overrides active)
${cfoAssumptions.slice(0, 10).map(a => `- ${a.metric_key}: ${a.value} (scenario: ${a.scenario_key || 'global'})`).join('\n') || 'No CFO overrides set.'}

### R&D Benchmarks (${rdBenchmarks.length} metrics)
${rdBenchmarks.slice(0, 15).map(b => `- ${b.metric_key}: ${b.value}${b.unit ? ' ' + b.unit : ''} [confidence: ${b.confidence || 'N/A'}]`).join('\n') || 'No benchmarks loaded.'}

### Scenarios Available
${scenarios.map(s => `- ${s.scenario_key}: ${s.label} (revenue multiplier: ${s.revenue_multiplier || 1.0})`).join('\n') || 'Base scenario only.'}

### Market Data (TAM/SAM/SOM)
${marketData.slice(0, 5).map(m => `- ${m.segment} (${m.year}): TAM $${(m.tam/1e9).toFixed(1)}B, SAM $${(m.sam/1e9).toFixed(1)}B, SOM $${(m.som/1e6).toFixed(0)}M`).join('\n') || 'No market data loaded.'}
`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build messages array with conversation history and context
    const messages = [
      { role: "system", content: SYSTEM_PROMPT + contextBlock },
      ...(conversationHistory || []).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Ensure the latest message is included if not already in history
    const lastHistoryMessage = conversationHistory?.[conversationHistory.length - 1];
    if (!lastHistoryMessage || lastHistoryMessage.content !== message) {
      messages.push({ role: "user", content: message });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const assistantResponse = data.choices?.[0]?.message?.content || "I'm here to help with board-related questions.";

    return new Response(
      JSON.stringify({ response: assistantResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Board AI Analyst error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
