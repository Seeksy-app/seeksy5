import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Canonical CFO Assumptions Schema
 * Maps to the unified JSON schema provided by CFO
 */
const CFO_ASSUMPTIONS_KEYS = {
  growth: [
    'monthly_creator_growth_rate',
    'monthly_advertiser_growth_rate',
    'creator_monthly_churn_rate',
    'advertiser_monthly_churn_rate',
    'creator_cac_paid',
    'creator_cac_organic',
  ],
  subscriptions: [
    'free_to_pro_conversion_rate',
    'pro_arpu',
    'business_arpu',
    'enterprise_arpu',
    'subscription_churn_rate',
  ],
  advertising: [
    'audio_cpm_hostread',
    'audio_cpm_programmatic',
    'video_cpm',
    'newsletter_cpm',
    'display_cpm',
    'audio_fill_rate',
    'video_fill_rate',
    'newsletter_fill_rate',
    'display_fill_rate',
    'hostread_platform_share',
    'programmatic_platform_share',
    'brand_deal_platform_share',
    'ad_slots_audio',
    'ad_slots_video',
  ],
  impressions: [
    'podcaster_small',
    'podcaster_mid',
    'podcaster_large',
    'video_small',
    'video_mid',
    'video_large',
  ],
  events: [
    'events_per_year',
    'avg_ticket_price',
    'avg_event_sponsorship',
  ],
};

// Schema defaults (fallback if no R&D benchmark or CFO override exists)
const SCHEMA_DEFAULTS: Record<string, number> = {
  // Growth
  monthly_creator_growth_rate: 4,
  monthly_advertiser_growth_rate: 3,
  creator_monthly_churn_rate: 5,
  advertiser_monthly_churn_rate: 8,
  creator_cac_paid: 45,
  creator_cac_organic: 15,
  // Subscriptions
  free_to_pro_conversion_rate: 5,
  pro_arpu: 29,
  business_arpu: 79,
  enterprise_arpu: 299,
  subscription_churn_rate: 4,
  // Advertising
  audio_cpm_hostread: 22,
  audio_cpm_programmatic: 12,
  video_cpm: 20,
  newsletter_cpm: 35,
  display_cpm: 5,
  audio_fill_rate: 65,
  video_fill_rate: 55,
  newsletter_fill_rate: 80,
  display_fill_rate: 70,
  hostread_platform_share: 30,
  programmatic_platform_share: 40,
  brand_deal_platform_share: 20,
  ad_slots_audio: 3,
  ad_slots_video: 2,
  // Impressions
  podcaster_small: 5000,
  podcaster_mid: 25000,
  podcaster_large: 250000,
  video_small: 10000,
  video_mid: 100000,
  video_large: 1000000,
  // Events
  events_per_year: 12,
  avg_ticket_price: 45,
  avg_event_sponsorship: 2500,
};

// Map canonical schema keys to rd_benchmarks keys
const SCHEMA_TO_BENCHMARK_MAP: Record<string, string | string[]> = {
  monthly_creator_growth_rate: 'creator_growth_rate',
  monthly_advertiser_growth_rate: 'advertiser_growth_rate',
  creator_monthly_churn_rate: 'creator_monthly_churn',
  advertiser_monthly_churn_rate: 'advertiser_monthly_churn',
  creator_cac_paid: 'creator_cac_paid',
  creator_cac_organic: 'creator_cac_organic',
  free_to_pro_conversion_rate: 'subscription_free_conversion',
  pro_arpu: 'creator_subscription_arpu_pro',
  business_arpu: 'creator_subscription_arpu_business',
  enterprise_arpu: 'creator_subscription_arpu_enterprise',
  subscription_churn_rate: 'subscription_monthly_churn',
  audio_cpm_hostread: ['audio_hostread_preroll_cpm_low', 'audio_hostread_preroll_cpm_high'],
  audio_cpm_programmatic: ['audio_programmatic_cpm_low', 'audio_programmatic_cpm_high'],
  video_cpm: ['video_midroll_cpm_low', 'video_midroll_cpm_high'],
  newsletter_cpm: 'newsletter_cpm_avg',
  display_cpm: 'display_cpm_avg',
  audio_fill_rate: 'audio_fill_rate',
  video_fill_rate: 'video_fill_rate',
  newsletter_fill_rate: 'newsletter_fill_rate',
  display_fill_rate: 'display_fill_rate',
  hostread_platform_share: 'hostread_platform_share',
  programmatic_platform_share: 'programmatic_platform_share',
  brand_deal_platform_share: 'brand_deal_platform_share',
  ad_slots_audio: 'audio_ad_slots_per_episode',
  ad_slots_video: 'video_ad_slots_per_video',
  podcaster_small: ['podcaster_small_monthly_impressions_low', 'podcaster_small_monthly_impressions_high'],
  podcaster_mid: ['podcaster_mid_monthly_impressions_low', 'podcaster_mid_monthly_impressions_high'],
  podcaster_large: ['podcaster_large_monthly_impressions_low', 'podcaster_large_monthly_impressions_high'],
  video_small: ['video_creator_small_monthly_views_low', 'video_creator_small_monthly_views_high'],
  video_mid: ['video_creator_mid_monthly_views_low', 'video_creator_mid_monthly_views_high'],
  video_large: ['video_creator_large_monthly_views_low', 'video_creator_large_monthly_views_high'],
  events_per_year: 'events_per_year',
  avg_ticket_price: 'avg_event_ticket_price',
  avg_event_sponsorship: 'avg_award_sponsorship_value',
};

interface ScenarioConfig {
  scenario_key: string;
  label: string;
  revenue_growth_multiplier: number;
  market_adoption_multiplier: number;
  churn_multiplier: number;
  cac_multiplier: number;
  impressions_multiplier: number;
  cpm_multiplier: number;
  fill_rate_multiplier: number;
  platform_revshare_adjustment: number;
}

interface AssumptionTrace {
  cfoOverrides: string[];
  rdBenchmarks: string[];
  schemaDefaults: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[ProForma] Starting forecast generation...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { scenarioKey, years = [2025, 2026, 2027] } = await req.json();
    console.log('[ProForma] Generating for scenario:', scenarioKey, 'years:', years);

    // Fetch scenario config
    const { data: scenarioConfig, error: scenarioError } = await supabase
      .from('scenario_configs')
      .select('*')
      .eq('scenario_key', scenarioKey)
      .single();

    if (scenarioError || !scenarioConfig) {
      console.error('[ProForma] Scenario error:', scenarioError);
      throw new Error(`Scenario not found: ${scenarioKey}`);
    }

    // Fetch all R&D benchmarks
    const { data: rdBenchmarks, error: benchmarksError } = await supabase
      .from('rd_benchmarks')
      .select('metric_key, value, unit, confidence');

    if (benchmarksError) {
      console.error('[ProForma] Benchmarks error:', benchmarksError);
      throw new Error(`Failed to fetch benchmarks: ${benchmarksError.message}`);
    }

    // Fetch CFO assumptions (overrides)
    const { data: cfoAssumptions, error: cfoError } = await supabase
      .from('cfo_assumptions')
      .select('metric_key, value, unit, source');

    if (cfoError) {
      console.error('[ProForma] CFO assumptions error:', cfoError);
      // Non-fatal, continue with just benchmarks
    }

    console.log('[ProForma] Loaded', rdBenchmarks?.length || 0, 'R&D benchmarks');
    console.log('[ProForma] Loaded', cfoAssumptions?.length || 0, 'CFO overrides');

    // Convert R&D benchmarks to a lookup map
    const benchmarkMap: Record<string, number> = {};
    rdBenchmarks?.forEach((b) => {
      benchmarkMap[b.metric_key] = Number(b.value);
    });

    // Convert CFO assumptions to a lookup map
    const cfoMap: Record<string, number> = {};
    cfoAssumptions?.forEach((a) => {
      cfoMap[a.metric_key] = Number(a.value);
    });

    // Track assumption sources for the trace
    const assumptionTrace: AssumptionTrace = {
      cfoOverrides: [],
      rdBenchmarks: [],
      schemaDefaults: [],
    };

    /**
     * getEffectiveValue - Gets the effective value for a metric key
     * Priority: 1) CFO override, 2) R&D benchmark, 3) Schema default
     */
    const getEffectiveValue = (schemaKey: string): number => {
      // Check CFO override first (using schema key directly)
      if (cfoMap[schemaKey] !== undefined) {
        assumptionTrace.cfoOverrides.push(schemaKey);
        return cfoMap[schemaKey];
      }

      // Map schema key to benchmark key(s)
      const benchmarkKeys = SCHEMA_TO_BENCHMARK_MAP[schemaKey];
      
      if (benchmarkKeys) {
        if (Array.isArray(benchmarkKeys)) {
          // Average of low/high range
          const lowVal = benchmarkMap[benchmarkKeys[0]];
          const highVal = benchmarkMap[benchmarkKeys[1]];
          if (lowVal !== undefined && highVal !== undefined) {
            assumptionTrace.rdBenchmarks.push(schemaKey);
            return (lowVal + highVal) / 2;
          }
        } else {
          // Single benchmark key
          if (benchmarkMap[benchmarkKeys] !== undefined) {
            assumptionTrace.rdBenchmarks.push(schemaKey);
            return benchmarkMap[benchmarkKeys];
          }
        }
      }

      // Also check if CFO override was set using benchmark key names (backward compatibility)
      if (typeof benchmarkKeys === 'string' && cfoMap[benchmarkKeys] !== undefined) {
        assumptionTrace.cfoOverrides.push(schemaKey);
        return cfoMap[benchmarkKeys];
      }

      // Fall back to schema default
      assumptionTrace.schemaDefaults.push(schemaKey);
      return SCHEMA_DEFAULTS[schemaKey] ?? 0;
    };

    // Get all effective values
    const effectiveAssumptions: Record<string, number> = {};
    Object.values(CFO_ASSUMPTIONS_KEYS).flat().forEach(key => {
      effectiveAssumptions[key] = getEffectiveValue(key);
    });

    console.log('[ProForma] Assumption trace:', {
      cfoOverrides: assumptionTrace.cfoOverrides.length,
      rdBenchmarks: assumptionTrace.rdBenchmarks.length,
      schemaDefaults: assumptionTrace.schemaDefaults.length,
    });

    // Build prompt for AI using unified assumptions
    const systemPrompt = `You are a CFO AI assistant for Seeksy, a creator economy platform. Generate detailed financial projections based on the provided assumptions and scenario multipliers.

IMPORTANT: You must return ONLY valid JSON, no markdown, no explanations. The JSON must follow this exact structure:
{
  "years": [
    {
      "year": 2025,
      "revenue": {
        "subscriptions": { "free": 0, "pro": X, "business": X, "enterprise": X, "total": X },
        "aiCredits": { "clips": X, "postProduction": X, "transcription": X, "total": X },
        "podcastHosting": { "hosting": X, "storage": X, "total": X },
        "advertising": {
          "hostReadAudio": { "impressions": X, "cpm": X, "fillRate": X, "revenue": X, "platformShare": X },
          "programmaticAudio": { "impressions": X, "cpm": X, "fillRate": X, "revenue": X, "platformShare": X },
          "videoPreroll": { "impressions": X, "cpm": X, "fillRate": X, "revenue": X, "platformShare": X },
          "videoMidroll": { "impressions": X, "cpm": X, "fillRate": X, "revenue": X, "platformShare": X },
          "brandDeals": { "deals": X, "avgValue": X, "revenue": X, "platformShare": X },
          "newsletter": { "impressions": X, "cpm": X, "revenue": X, "platformShare": X },
          "display": { "impressions": X, "cpm": X, "revenue": X, "platformShare": X },
          "total": X,
          "totalPlatformRevenue": X
        },
        "events": { "tickets": X, "sponsorships": X, "livestream": X, "total": X },
        "licensing": { "whiteLabel": X, "enterprise": X, "total": X },
        "totalRevenue": X
      },
      "expenses": {
        "cogs": X,
        "salesMarketing": X,
        "rd": X,
        "ga": X,
        "total": X
      },
      "ebitda": X,
      "ebitdaMargin": X,
      "creatorCount": X,
      "subscriberCount": X,
      "churnRate": X,
      "cac": X,
      "ltv": X
    }
  ],
  "breakEvenYear": X,
  "commentary": "Brief 2-3 sentence analysis of the projections"
}`;

    const userPrompt = `Generate a ${scenarioConfig.label} scenario financial projection for Seeksy for years ${years.join(', ')}.

SCENARIO MULTIPLIERS:
- Revenue Growth: ${scenarioConfig.revenue_growth_multiplier}x
- Market Adoption: ${scenarioConfig.market_adoption_multiplier}x
- Churn: ${scenarioConfig.churn_multiplier}x (higher = worse)
- CAC: ${scenarioConfig.cac_multiplier}x (higher = worse)
- Impressions: ${scenarioConfig.impressions_multiplier}x
- CPM: ${scenarioConfig.cpm_multiplier}x
- Fill Rate: ${scenarioConfig.fill_rate_multiplier}x
- Platform RevShare Adjustment: ${scenarioConfig.platform_revshare_adjustment}

=== CFO ASSUMPTIONS (PRIMARY INPUTS - USE THESE VALUES) ===

GROWTH & ACQUISITION:
- Monthly Creator Growth Rate: ${effectiveAssumptions.monthly_creator_growth_rate}%
- Monthly Advertiser Growth Rate: ${effectiveAssumptions.monthly_advertiser_growth_rate}%
- Creator Monthly Churn: ${effectiveAssumptions.creator_monthly_churn_rate}%
- Advertiser Monthly Churn: ${effectiveAssumptions.advertiser_monthly_churn_rate}%
- Creator CAC (Paid): $${effectiveAssumptions.creator_cac_paid}
- Creator CAC (Organic): $${effectiveAssumptions.creator_cac_organic}

SUBSCRIPTIONS:
- Free → Pro Conversion Rate: ${effectiveAssumptions.free_to_pro_conversion_rate}%
- Pro ARPU: $${effectiveAssumptions.pro_arpu}
- Business ARPU: $${effectiveAssumptions.business_arpu}
- Enterprise ARPU: $${effectiveAssumptions.enterprise_arpu}
- Subscription Monthly Churn: ${effectiveAssumptions.subscription_churn_rate}%

ADVERTISING CPMs:
- Host-Read Audio CPM: $${effectiveAssumptions.audio_cpm_hostread}
- Programmatic Audio CPM: $${effectiveAssumptions.audio_cpm_programmatic}
- Video Mid-roll CPM: $${effectiveAssumptions.video_cpm}
- Newsletter CPM: $${effectiveAssumptions.newsletter_cpm}
- Display CPM: $${effectiveAssumptions.display_cpm}

FILL RATES:
- Audio Fill Rate: ${effectiveAssumptions.audio_fill_rate}%
- Video Fill Rate: ${effectiveAssumptions.video_fill_rate}%
- Newsletter Fill Rate: ${effectiveAssumptions.newsletter_fill_rate}%
- Display Fill Rate: ${effectiveAssumptions.display_fill_rate}%

PLATFORM REVENUE SHARES:
- Host-Read Platform Share: ${effectiveAssumptions.hostread_platform_share}%
- Programmatic Platform Share: ${effectiveAssumptions.programmatic_platform_share}%
- Brand Deal Platform Share: ${effectiveAssumptions.brand_deal_platform_share}%

AD SLOTS:
- Audio Ad Slots per Episode: ${effectiveAssumptions.ad_slots_audio}
- Video Ad Slots per Video: ${effectiveAssumptions.ad_slots_video}

CREATOR SEGMENT IMPRESSIONS (Monthly):
- Small Podcasters: ${effectiveAssumptions.podcaster_small}
- Mid Podcasters: ${effectiveAssumptions.podcaster_mid}
- Large Podcasters: ${effectiveAssumptions.podcaster_large}
- Small Video Creators: ${effectiveAssumptions.video_small}
- Mid Video Creators: ${effectiveAssumptions.video_mid}
- Large Video Creators: ${effectiveAssumptions.video_large}

EVENTS & AWARDS:
- Events per Year: ${effectiveAssumptions.events_per_year}
- Average Ticket Price: $${effectiveAssumptions.avg_ticket_price}
- Average Event Sponsorship: $${effectiveAssumptions.avg_event_sponsorship}

STARTING ASSUMPTIONS (Year 1):
- Starting Creators: 5,000
- Starting Paid Subscribers: 500
- Starting Ad-Enabled Creators: 250
- Average Episodes/Month: 4

Apply the scenario multipliers to these base assumptions. For advertising revenue, calculate:
1. Total Impressions = Creator Count × Monthly Impressions (by segment) × Fill Rate
2. Revenue = (Impressions / 1000) × CPM × Scenario Multiplier
3. Platform Share = Revenue × Platform RevShare %

Show year-over-year growth aligned with the scenario type. Return ONLY the JSON object.`;

    console.log('[ProForma] Calling AI API...');
    
    // Call AI API
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ProForma] AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '';
    console.log('[ProForma] AI response received, length:', content.length);
    
    // Parse AI response
    let forecast;
    try {
      // Clean up potential markdown formatting
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      forecast = JSON.parse(cleanContent);
      console.log('[ProForma] Successfully parsed forecast for', forecast.years?.length, 'years');
    } catch (parseError) {
      console.error('[ProForma] Failed to parse AI response:', content.substring(0, 500));
      throw new Error('Failed to parse AI forecast response');
    }

    // Store forecast in database with assumptions snapshot
    const assumptionsSnapshot = {
      effective: effectiveAssumptions,
      trace: assumptionTrace,
      scenario: scenarioConfig,
    };

    for (const yearData of forecast.years || []) {
      console.log('[ProForma] Storing forecast for year:', yearData.year);
      
      const { error: upsertError } = await supabase.from('proforma_forecasts').upsert({
        scenario_key: scenarioKey,
        forecast_year: yearData.year,
        revenue_data: yearData.revenue,
        expense_data: yearData.expenses,
        ad_revenue_breakdown: yearData.revenue?.advertising || {},
        summary_metrics: {
          ebitda: yearData.ebitda,
          ebitdaMargin: yearData.ebitdaMargin,
          creatorCount: yearData.creatorCount,
          subscriberCount: yearData.subscriberCount,
          churnRate: yearData.churnRate,
          cac: yearData.cac,
          ltv: yearData.ltv,
        },
        benchmarks_used: Object.keys(effectiveAssumptions),
        ai_commentary: forecast.commentary,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'scenario_key,forecast_year',
      });
      
      if (upsertError) {
        console.error('[ProForma] Upsert error for year', yearData.year, ':', upsertError);
      }
    }

    console.log('[ProForma] Forecast generation complete');

    return new Response(
      JSON.stringify({
        success: true,
        scenario: scenarioConfig.label,
        forecast,
        assumptionTrace: {
          cfoOverrides: assumptionTrace.cfoOverrides.length,
          rdBenchmarks: assumptionTrace.rdBenchmarks.length,
          schemaDefaults: assumptionTrace.schemaDefaults.length,
          details: assumptionTrace,
        },
        effectiveAssumptions,
        benchmarksUsed: rdBenchmarks?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[ProForma] Error generating forecast:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
