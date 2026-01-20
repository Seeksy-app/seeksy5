import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input types
interface MetricsInput {
  gsc?: {
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  } | null;
  ga4?: {
    users?: number;
    sessions?: number;
    views?: number;
    engagementRate?: number;
  } | null;
}

interface BaselineInput {
  exists: boolean;
  captured_at?: string | null;
  gsc?: {
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  } | null;
  ga4?: {
    users?: number;
    sessions?: number;
  } | null;
}

interface AlertsInput {
  ctr_drop?: boolean;
  position_drop?: boolean;
  traffic_spike?: boolean;
}

interface GbpContextInput {
  linked?: boolean;
  location_name?: string | null;
  primary_category?: string | null;
  recent_reviews_summary?: string | null;
}

interface RequestBody {
  seo_page_id: string;
  context: {
    page: {
      route_path: string;
      title?: string;
      meta_description?: string;
      h1?: string;
      last_updated_at?: string;
    };
    metrics_7d?: MetricsInput | null;
    metrics_28d?: MetricsInput | null;
    baseline?: BaselineInput | null;
    alerts?: AlertsInput | null;
    gbp_context?: GbpContextInput | null;
    // Coverage data for confidence scoring
    daysWithData7?: number | null;
    daysWithData28?: number | null;
  };
}

// ============ Confidence Scoring (inline) ============
interface ConfidenceResult {
  confidence_overall: "low" | "medium" | "high";
  confidenceScore: number;
  completeness: number;
  coveragePenalty: number;
  lowVolumePenalty: number;
  data_quality_notes: string[];
}

function clampNum(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function isFiniteNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function hasAllGsc(m?: MetricsInput["gsc"]): boolean {
  if (!m) return false;
  return isFiniteNum(m.clicks) && isFiniteNum(m.impressions) && isFiniteNum(m.ctr) && isFiniteNum(m.position);
}

function hasAllGa4(m?: MetricsInput["ga4"]): boolean {
  if (!m) return false;
  return isFiniteNum(m.users) && isFiniteNum(m.sessions) && isFiniteNum(m.views) && isFiniteNum(m.engagementRate);
}

function scoreConfidence(
  gsc7: MetricsInput["gsc"],
  gsc28: MetricsInput["gsc"],
  ga47: MetricsInput["ga4"],
  ga428: MetricsInput["ga4"],
  daysWithData7: number | null | undefined,
  daysWithData28: number | null | undefined,
  hasBaseline: boolean
): ConfidenceResult {
  const notes: string[] = [];

  const hasGSC7 = hasAllGsc(gsc7);
  const hasGSC28 = hasAllGsc(gsc28);
  const hasGA47 = hasAllGa4(ga47);
  const hasGA428 = hasAllGa4(ga428);

  // Step 1: completeness (0..100)
  let completeness = 0;
  if (hasGSC7) completeness += 35;
  if (hasGSC28) completeness += 20;
  if (hasGA47) completeness += 25;
  if (hasGA428) completeness += 15;
  if (hasBaseline) completeness += 5;

  // Step 2: coverage penalty (0..30)
  const days7 = clampNum(Number(daysWithData7 ?? 7), 0, 7); // default to 7 if not provided
  const days28 = clampNum(Number(daysWithData28 ?? 28), 0, 28);

  let coveragePenalty = 0;
  if (hasGSC7 || hasGA47) {
    const missing7 = 7 - days7;
    coveragePenalty += clampNum(missing7 * 4, 0, 20);
    if (days7 < 7) notes.push(`Incomplete 7-day coverage: ${days7}/7 days.`);
  }
  if (hasGSC28 || hasGA428) {
    const missing28 = 28 - days28;
    coveragePenalty += clampNum(missing28 * 0.5, 0, 10);
    if (days28 < 28) notes.push(`Incomplete 28-day coverage: ${days28}/28 days.`);
  }
  coveragePenalty = clampNum(coveragePenalty, 0, 30);

  // Step 3: low-volume penalty (0..25)
  let lowVolumePenalty = 0;
  const impressions7 = hasGSC7 && isFiniteNum(gsc7?.impressions) ? gsc7!.impressions! : null;
  const clicks7 = hasGSC7 && isFiniteNum(gsc7?.clicks) ? gsc7!.clicks! : null;
  const views7 = hasGA47 && isFiniteNum(ga47?.views) ? ga47!.views! : null;

  if (hasGSC7 && impressions7 !== null) {
    if (impressions7 < 50) {
      lowVolumePenalty += 15;
      notes.push("Low volume: GSC impressions (7d) < 50.");
    }
    if (impressions7 < 10) {
      lowVolumePenalty += 10;
      notes.push("Very low volume: GSC impressions (7d) < 10.");
    }
    if (clicks7 !== null && clicks7 < 5) {
      lowVolumePenalty += 5;
      notes.push("Low clicks (7d) < 5; CTR may be unstable.");
    }
  } else if (hasGA47 && views7 !== null) {
    if (views7 < 50) {
      lowVolumePenalty += 10;
      notes.push("Low volume: GA4 views (7d) < 50.");
    }
    if (views7 < 10) {
      lowVolumePenalty += 10;
      notes.push("Very low volume: GA4 views (7d) < 10.");
    }
  } else {
    notes.push("Volume signals unavailable.");
  }
  lowVolumePenalty = clampNum(lowVolumePenalty, 0, 25);

  // Step 4: raw score
  const raw = completeness - coveragePenalty - lowVolumePenalty;
  const confidenceScore = clampNum(raw, 0, 100);

  // Step 5: map to level
  let confidence_overall: "low" | "medium" | "high";
  if (confidenceScore >= 70) confidence_overall = "high";
  else if (confidenceScore >= 40) confidence_overall = "medium";
  else confidence_overall = "low";

  // Overrides
  if (!hasGSC7 && !hasGA47) {
    confidence_overall = "low";
    notes.push("No usable 7-day metrics.");
  }
  if ((hasGSC7 || hasGA47) && days7 <= 2) {
    confidence_overall = "low";
    notes.push("Only 0–2 days of 7d data; unreliable.");
  }
  if (hasGSC7 && impressions7 !== null && impressions7 < 10) {
    confidence_overall = "low";
  }
  if (!hasBaseline) {
    notes.push("No baseline; using 7d vs 28d only.");
  }

  return {
    confidence_overall,
    confidenceScore,
    completeness,
    coveragePenalty,
    lowVolumePenalty,
    data_quality_notes: notes.slice(0, 5)
  };
}

// Clamp helper
function clamp(value: number | undefined | null, min: number, max: number): number | null {
  if (value == null || isNaN(value)) return null;
  return Math.max(min, Math.min(max, value));
}

// Delta string helper
function computeDelta(current: number | null | undefined, previous: number | null | undefined, suffix: string = "", isPosition: boolean = false): string {
  if (current == null || previous == null) return "N/A";
  const diff = current - previous;
  if (diff === 0) return "0" + suffix;
  const sign = diff > 0 ? "+" : "";
  if (isPosition) {
    // For position, down is good, up is bad
    return `${sign}${diff.toFixed(1)} positions`;
  }
  if (suffix === "%") {
    return `${sign}${diff.toFixed(1)}%`;
  }
  return `${sign}${diff}${suffix}`;
}

// Percent change helper
function percentChange(current: number | null | undefined, previous: number | null | undefined): string {
  if (current == null || previous == null || previous === 0) return "N/A";
  const change = ((current - previous) / previous) * 100;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(0)}%`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin access
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (!roles?.some((r) => r.role === "admin" || r.role === "super_admin")) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: RequestBody = await req.json();
    const { seo_page_id, context } = body;

    if (!seo_page_id || !context?.page?.route_path) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check data availability
    const gscAvailable = !!(context.metrics_7d?.gsc?.clicks != null || context.metrics_7d?.gsc?.impressions != null);
    const ga4Available = !!(context.metrics_7d?.ga4?.users != null || context.metrics_7d?.ga4?.sessions != null);

    // If both missing, return tracking issue immediately
    if (!gscAvailable && !ga4Available) {
      return new Response(JSON.stringify({
        page: {
          route_path: context.page.route_path,
          title: context.page.title,
          meta_description: context.page.meta_description,
          h1: context.page.h1,
          last_updated_at: context.page.last_updated_at
        },
        time_window: "7d_vs_28d",
        executive_summary: "No analytics data available. Connect Google Search Console and GA4 to track performance.",
        top_changes: [
          { metric: "gsc_clicks", direction: "flat", delta: "N/A", evidence: "No GSC data connected" }
        ],
        primary_pattern: ["tracking_or_coverage_issue"],
        hypotheses: [
          {
            title: "Analytics not connected",
            confidence: "high",
            evidence: ["No GSC metrics found", "No GA4 metrics found"],
            what_to_check: "Connect GSC and GA4 in /admin/analytics"
          },
          {
            title: "Page not indexed or tracked",
            confidence: "medium",
            evidence: ["Zero impressions may indicate indexing issues"],
            what_to_check: "Verify page is indexed in Google Search Console"
          }
        ],
        recommended_actions: [
          { priority: 1, action: "Connect Google Search Console", why: "Required for search performance data", effort: "low", expected_impact: "high" },
          { priority: 2, action: "Connect GA4", why: "Required for on-site engagement data", effort: "low", expected_impact: "high" }
        ],
        diagnostic_next_step: "Connect analytics integrations in /admin/analytics settings",
        confidence_overall: "low",
        data_quality: {
          gsc_available: false,
          ga4_available: false,
          notes: ["GSC not connected or no data", "GA4 not connected or no data"]
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build analysis prompt with pre-computed deltas
    const prompt = buildAnalysisPrompt(context, gscAvailable, ga4Available);

    // System prompt
    const systemPrompt = `You are Seeksy Spark, an SEO performance analyst for a website.

Your job:
- Explain why a page's performance changed using ONLY the provided metrics and context.
- Never invent facts (no guessing about algorithm updates, indexing, competitors, or seasonality unless the data strongly supports it).
- Be concise, practical, and non-technical when possible.
- If the data is missing or insufficient, say so and recommend the single best next diagnostic step.

Hard rules:
- Output MUST be valid JSON and match the provided JSON schema.
- Do not include markdown.
- Do not include any personally identifying information.
- Do not reference private prompts, hidden policies, or internal tool names.
- If you are uncertain, label it explicitly as a hypothesis and explain what evidence would confirm it.

Focus:
- Compare 7d vs 28d, and baseline deltas when available.
- Use GSC metrics (clicks, impressions, CTR, position) to reason about search behavior.
- Use GA4 metrics (users, sessions, views, engagement rate) to reason about onsite behavior.
- If GBP context is provided (reviews, business description, categories), use it only as supporting context, not primary causation.

Tasks:
1) Identify which metric(s) changed most (direction + magnitude).
2) Classify the change into 1-2 primary patterns:
   - demand_change_impressions
   - ranking_change_position
   - snippet_change_ctr
   - onsite_engagement_change
   - tracking_or_coverage_issue
   - mixed
3) Provide 2-4 evidence-backed hypotheses, each with confidence (low/medium/high) and one verification step.
4) Recommend 2-3 actions with effort and expected_impact ratings.
5) Provide a short "one-line executive summary" suitable for a table row.`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "explain_performance_change",
              description: "Provide structured explanation of SEO performance changes",
              parameters: {
                type: "object",
                additionalProperties: false,
                required: [
                  "page", "time_window", "executive_summary", "top_changes",
                  "primary_pattern", "hypotheses", "recommended_actions",
                  "diagnostic_next_step", "confidence_overall", "data_quality"
                ],
                properties: {
                  page: {
                    type: "object",
                    additionalProperties: false,
                    required: ["route_path"],
                    properties: {
                      route_path: { type: "string" },
                      title: { type: "string" },
                      meta_description: { type: "string" },
                      h1: { type: "string" },
                      last_updated_at: { type: "string" }
                    }
                  },
                  time_window: { type: "string", enum: ["7d_vs_28d"] },
                  executive_summary: { type: "string" },
                  top_changes: {
                    type: "array",
                    minItems: 1,
                    maxItems: 6,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["metric", "direction", "delta", "evidence"],
                      properties: {
                        metric: {
                          type: "string",
                          enum: ["gsc_clicks", "gsc_impressions", "gsc_ctr", "gsc_position", "ga4_users", "ga4_sessions", "ga4_views", "ga4_engagement_rate"]
                        },
                        direction: { type: "string", enum: ["up", "down", "flat"] },
                        delta: { type: "string" },
                        evidence: { type: "string" }
                      }
                    }
                  },
                  primary_pattern: {
                    type: "array",
                    minItems: 1,
                    maxItems: 2,
                    items: {
                      type: "string",
                      enum: ["demand_change_impressions", "ranking_change_position", "snippet_change_ctr", "onsite_engagement_change", "tracking_or_coverage_issue", "mixed"]
                    }
                  },
                  hypotheses: {
                    type: "array",
                    minItems: 2,
                    maxItems: 4,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["title", "confidence", "evidence", "what_to_check"],
                      properties: {
                        title: { type: "string" },
                        confidence: { type: "string", enum: ["low", "medium", "high"] },
                        evidence: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
                        what_to_check: { type: "string" }
                      }
                    }
                  },
                  recommended_actions: {
                    type: "array",
                    minItems: 2,
                    maxItems: 3,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["priority", "action", "why", "effort", "expected_impact"],
                      properties: {
                        priority: { type: "integer", minimum: 1, maximum: 3 },
                        action: { type: "string" },
                        why: { type: "string" },
                        effort: { type: "string", enum: ["low", "medium", "high"] },
                        expected_impact: { type: "string", enum: ["low", "medium", "high"] }
                      }
                    }
                  },
                  diagnostic_next_step: { type: "string" },
                  confidence_overall: { type: "string", enum: ["low", "medium", "high"] },
                  data_quality: {
                    type: "object",
                    additionalProperties: false,
                    required: ["gsc_available", "ga4_available", "notes"],
                    properties: {
                      gsc_available: { type: "boolean" },
                      ga4_available: { type: "boolean" },
                      notes: { type: "array", maxItems: 5, items: { type: "string" } }
                    }
                  }
                }
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "explain_performance_change" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[seo-ai-explain-change] AI error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    
    // Extract result from tool call
    let result;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("[seo-ai-explain-change] Failed to parse:", e, toolCall.function.arguments);
        return new Response(JSON.stringify({ error: "AI returned invalid response" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.error("[seo-ai-explain-change] No tool call in response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "AI returned empty response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== Override with deterministic confidence scoring =====
    const confidenceResult = scoreConfidence(
      context.metrics_7d?.gsc,
      context.metrics_28d?.gsc,
      context.metrics_7d?.ga4,
      context.metrics_28d?.ga4,
      context.daysWithData7,
      context.daysWithData28,
      !!context.baseline?.exists
    );

    // Merge deterministic confidence into AI result
    result.confidence_overall = confidenceResult.confidence_overall;
    result.data_quality = {
      gsc_available: gscAvailable,
      ga4_available: ga4Available,
      notes: confidenceResult.data_quality_notes,
      // Include scoring breakdown for transparency
      confidenceScore: confidenceResult.confidenceScore,
      completeness: confidenceResult.completeness,
      coveragePenalty: confidenceResult.coveragePenalty,
      lowVolumePenalty: confidenceResult.lowVolumePenalty
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[seo-ai-explain-change] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildAnalysisPrompt(context: RequestBody['context'], gscAvailable: boolean, ga4Available: boolean): string {
  const parts: string[] = [];
  
  // Page metadata
  parts.push("=== PAGE ===");
  parts.push(`Route: ${context.page.route_path}`);
  if (context.page.title) parts.push(`Title: ${context.page.title}`);
  if (context.page.meta_description) parts.push(`Meta: ${context.page.meta_description.substring(0, 160)}`);
  if (context.page.h1) parts.push(`H1: ${context.page.h1}`);
  if (context.page.last_updated_at) parts.push(`Last updated: ${context.page.last_updated_at}`);
  parts.push("");

  // Metrics with pre-computed deltas
  const m7 = context.metrics_7d;
  const m28 = context.metrics_28d;

  // GSC Metrics
  if (gscAvailable) {
    parts.push("=== GSC METRICS ===");
    
    // Clamp CTR to 0-1
    const ctr7 = clamp(m7?.gsc?.ctr, 0, 100);
    const ctr28 = clamp(m28?.gsc?.ctr, 0, 100);
    
    parts.push("7-day:");
    parts.push(`  Clicks: ${m7?.gsc?.clicks ?? 'N/A'}`);
    parts.push(`  Impressions: ${m7?.gsc?.impressions ?? 'N/A'}`);
    parts.push(`  CTR: ${ctr7 != null ? ctr7.toFixed(2) + '%' : 'N/A'}`);
    parts.push(`  Position: ${m7?.gsc?.position?.toFixed(1) ?? 'N/A'}`);
    
    parts.push("28-day:");
    parts.push(`  Clicks: ${m28?.gsc?.clicks ?? 'N/A'}`);
    parts.push(`  Impressions: ${m28?.gsc?.impressions ?? 'N/A'}`);
    parts.push(`  CTR: ${ctr28 != null ? ctr28.toFixed(2) + '%' : 'N/A'}`);
    parts.push(`  Position: ${m28?.gsc?.position?.toFixed(1) ?? 'N/A'}`);
    
    parts.push("Deltas (7d vs 28d):");
    parts.push(`  Clicks: ${percentChange(m7?.gsc?.clicks, m28?.gsc?.clicks)}`);
    parts.push(`  Impressions: ${percentChange(m7?.gsc?.impressions, m28?.gsc?.impressions)}`);
    parts.push(`  CTR: ${computeDelta(ctr7, ctr28, "%")}`);
    parts.push(`  Position: ${computeDelta(m7?.gsc?.position, m28?.gsc?.position, "", true)}`);
    parts.push("");
  }

  // GA4 Metrics
  if (ga4Available) {
    parts.push("=== GA4 METRICS ===");
    
    // Clamp engagement rate to 0-1
    const eng7 = clamp(m7?.ga4?.engagementRate, 0, 100);
    const eng28 = clamp(m28?.ga4?.engagementRate, 0, 100);
    
    parts.push("7-day:");
    parts.push(`  Users: ${m7?.ga4?.users ?? 'N/A'}`);
    parts.push(`  Sessions: ${m7?.ga4?.sessions ?? 'N/A'}`);
    parts.push(`  Views: ${m7?.ga4?.views ?? 'N/A'}`);
    parts.push(`  Engagement Rate: ${eng7 != null ? eng7.toFixed(1) + '%' : 'N/A'}`);
    
    parts.push("28-day:");
    parts.push(`  Users: ${m28?.ga4?.users ?? 'N/A'}`);
    parts.push(`  Sessions: ${m28?.ga4?.sessions ?? 'N/A'}`);
    parts.push(`  Views: ${m28?.ga4?.views ?? 'N/A'}`);
    parts.push(`  Engagement Rate: ${eng28 != null ? eng28.toFixed(1) + '%' : 'N/A'}`);
    
    parts.push("Deltas (7d vs 28d):");
    parts.push(`  Users: ${percentChange(m7?.ga4?.users, m28?.ga4?.users)}`);
    parts.push(`  Sessions: ${percentChange(m7?.ga4?.sessions, m28?.ga4?.sessions)}`);
    parts.push(`  Views: ${percentChange(m7?.ga4?.views, m28?.ga4?.views)}`);
    parts.push(`  Engagement Rate: ${computeDelta(eng7, eng28, "%")}`);
    parts.push("");
  }

  // Baseline
  if (context.baseline?.exists) {
    parts.push("=== BASELINE (first recorded) ===");
    if (context.baseline.captured_at) parts.push(`Captured: ${context.baseline.captured_at}`);
    if (context.baseline.gsc) {
      parts.push(`GSC: Clicks=${context.baseline.gsc.clicks}, Impr=${context.baseline.gsc.impressions}, CTR=${context.baseline.gsc.ctr?.toFixed(2)}%, Pos=${context.baseline.gsc.position?.toFixed(1)}`);
    }
    if (context.baseline.ga4) {
      parts.push(`GA4: Users=${context.baseline.ga4.users}, Sessions=${context.baseline.ga4.sessions}`);
    }
    parts.push("");
  }

  // Alerts
  if (context.alerts) {
    const activeAlerts: string[] = [];
    if (context.alerts.ctr_drop) activeAlerts.push("CTR_DROP");
    if (context.alerts.position_drop) activeAlerts.push("POSITION_DROP");
    if (context.alerts.traffic_spike) activeAlerts.push("TRAFFIC_SPIKE");
    if (activeAlerts.length > 0) {
      parts.push("=== ACTIVE ALERTS ===");
      parts.push(activeAlerts.join(", "));
      parts.push("");
    }
  }

  // GBP Context
  if (context.gbp_context?.linked) {
    parts.push("=== GBP CONTEXT ===");
    if (context.gbp_context.location_name) parts.push(`Location: ${context.gbp_context.location_name}`);
    if (context.gbp_context.primary_category) parts.push(`Category: ${context.gbp_context.primary_category}`);
    if (context.gbp_context.recent_reviews_summary) parts.push(`Reviews: ${context.gbp_context.recent_reviews_summary}`);
    parts.push("");
  }

  parts.push("Analyze the above data and return structured JSON.");

  return parts.join("\n");
}
