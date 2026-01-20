import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed roles for CFO AI Assistant
const ALLOWED_ROLES = ['admin', 'super_admin', 'cfo', 'board_member'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTHENTICATION ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("🔒 CFO AI: Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // Verify the user's JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user) {
      console.log("🔒 CFO AI: Invalid token -", userError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired authentication token" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === AUTHORIZATION ===
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error("🔒 CFO AI: Failed to fetch roles -", rolesError);
    }

    const roles = userRoles?.map(r => r.role) || [];
    const hasAccess = roles.some(role => ALLOWED_ROLES.includes(role));

    if (!hasAccess) {
      console.log(`🔒 CFO AI: Access denied for user ${user.id} with roles [${roles.join(', ')}]`);
      return new Response(
        JSON.stringify({ error: "Access denied. CFO AI Assistant requires admin, CFO, or board member role." }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ CFO AI: Authorized access for user ${user.id} with roles [${roles.join(', ')}]`);

    // === BUSINESS LOGIC ===
    const { message, financialData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context from financial data
    let contextString = '';
    if (financialData) {
      contextString = `
Current Financial Metrics:
${JSON.stringify(financialData, null, 2)}
`;
    }

    let adFinancialContext = '';
    let combinedRevenueContext = '';
    let rateDeskContext = '';
    let advertiserContext = '';
    let campaignContext = '';
    let scenarioAssumptionsContext = '';
    
    try {
      // Fetch financial scenarios and assumptions
      const { data: scenariosData } = await supabase
        .from('ad_financial_scenarios')
        .select(`
          *,
          ad_financial_assumptions (*)
        `)
        .order('is_default', { ascending: false });

      if (scenariosData && scenariosData.length > 0) {
        scenarioAssumptionsContext = `

** AI REVENUE SCENARIOS & ASSUMPTIONS **

${scenariosData.map(scenario => {
  const assumptions = scenario.ad_financial_assumptions?.[0];
  if (!assumptions) return '';
  
  const assumpJson = assumptions.assumptions_json || {};
  return `
${scenario.name} ${scenario.is_default ? '(DEFAULT)' : ''}:
${scenario.description}

Core Financial Metrics:
  - Average CPM: $${assumpJson.average_cpm || 'N/A'}
  - Pre-Roll CPM: $${assumptions.cpm_preroll}
  - Mid-Roll CPM: $${assumptions.cpm_midroll}
  - Post-Roll CPM: $${assumptions.cpm_postroll}
  - Creator Revenue Share: ${(assumptions.creator_rev_share * 100).toFixed(0)}%
  - Platform Variable Costs: ${(assumptions.platform_variable_cost_pct * 100).toFixed(1)}%

Growth Assumptions:
  - Monthly User Growth: ${((assumpJson.monthly_user_growth || 0) * 100).toFixed(1)}%
  - Creator Growth: ${((assumpJson.creator_growth || 0) * 100).toFixed(1)}%
  - Starting Campaigns: ${assumptions.starting_campaigns}
  - Monthly Campaign Growth: ${(assumptions.monthly_campaign_growth * 100).toFixed(1)}%
  - Average Campaign Budget: $${assumpJson.avg_campaign_budget || assumptions.avg_campaign_monthly_budget}

Performance Metrics:
  - Impressions Per User: ${assumpJson.impressions_per_user || 'N/A'}
  - Advertiser Conversion Rate: ${((assumpJson.advertiser_conversion_rate || 0) * 100).toFixed(1)}%
  - Campaign Renewal Rate: ${((assumpJson.campaign_renewal_rate || 0) * 100).toFixed(1)}%
  - Churn Rate: ${((assumpJson.churn_rate || 0) * 100).toFixed(2)}%
  - Fill Rate: ${(assumptions.fill_rate * 100).toFixed(0)}%
`;
}).join('\n---\n')}
`;
      }

      // Fetch advertiser inventory
      const { data: advertisers } = await supabase
        .from('advertisers')
        .select('id, company_name, business_description, status, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(20);

      if (advertisers && advertisers.length > 0) {
        advertiserContext = `

** ADVERTISER INVENTORY (${advertisers.length} Active) **

${advertisers.map((adv, i) => `${i + 1}. ${adv.company_name}
   - ${adv.business_description}
   - Status: ${adv.status}
   - Onboarded: ${new Date(adv.created_at).toLocaleDateString()}`).join('\n\n')}
`;
      }

      // Fetch active campaign performance
      const { data: campaigns } = await supabase
        .from('ad_campaigns')
        .select(`
          id,
          name,
          total_budget,
          total_spent,
          total_impressions,
          cpm_bid,
          status,
          start_date,
          end_date,
          advertisers (company_name)
        `)
        .in('status', ['active', 'completed'])
        .order('total_spent', { ascending: false })
        .limit(15);

      if (campaigns && campaigns.length > 0) {
        const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.total_budget), 0);
        const totalSpent = campaigns.reduce((sum, c) => sum + Number(c.total_spent), 0);
        const totalImpressions = campaigns.reduce((sum, c) => sum + Number(c.total_impressions), 0);
        const avgCPM = campaigns.filter(c => c.total_impressions > 0)
          .reduce((sum, c) => sum + Number(c.cpm_bid), 0) / campaigns.filter(c => c.total_impressions > 0).length;
        
        const activeCampaigns = campaigns.filter(c => c.status === 'active');
        const completedCampaigns = campaigns.filter(c => c.status === 'completed');

        campaignContext = `

** CAMPAIGN PERFORMANCE OVERVIEW **

Total Campaigns: ${campaigns.length} (${activeCampaigns.length} active, ${completedCampaigns.length} completed)
Total Campaign Budget: $${(totalBudget / 1000).toFixed(1)}K
Total Spent to Date: $${(totalSpent / 1000).toFixed(1)}K (${((totalSpent / totalBudget) * 100).toFixed(1)}% of budget)
Total Impressions Delivered: ${(totalImpressions / 1000).toFixed(0)}K
Platform Average CPM: $${avgCPM.toFixed(2)}

Top Performing Campaigns by Spend:
${campaigns.slice(0, 5).map((camp, i) => {
  const advertiserName = Array.isArray(camp.advertisers) && camp.advertisers.length > 0 
    ? camp.advertisers[0].company_name 
    : 'Unknown';
  const spendPct = (Number(camp.total_spent) / Number(camp.total_budget)) * 100;
  const actualCPM = camp.total_impressions > 0 ? (Number(camp.total_spent) / (camp.total_impressions / 1000)) : 0;
  return `${i + 1}. ${camp.name} (${advertiserName})
   - Budget: $${(Number(camp.total_budget) / 1000).toFixed(1)}K | Spent: $${(Number(camp.total_spent) / 1000).toFixed(1)}K (${spendPct.toFixed(0)}%)
   - Impressions: ${(camp.total_impressions / 1000).toFixed(0)}K
   - CPM Bid: $${camp.cpm_bid} | Actual CPM: $${actualCPM.toFixed(2)}
   - Status: ${camp.status}`;
}).join('\n\n')}
`;
      }

      const { data: summaries } = await supabase
        .from('ad_financial_model_summaries')
        .select('*');
      
      if (summaries && summaries.length > 0) {
        adFinancialContext = `

** AD REVENUE FINANCIAL MODEL SUMMARIES **

${summaries.map(s => s.summary_text).join('\n\n')}
`;
      }

      // Fetch ad projections for combined context
      const { data: scenarios } = await supabase
        .from('ad_financial_scenarios')
        .select('id, name')
        .eq('name', 'Base Case')
        .single();

      if (scenarios) {
        const { data: projections } = await supabase
          .from('ad_financial_projections')
          .select('*')
          .eq('scenario_id', scenarios.id)
          .order('month_index');

        if (projections && projections.length > 0) {
          const baseSubscriptionMRR = 82000;
          const monthlyGrowth = 0.15;
          const subscriptionMargin = 0.75;
          
          const yearlyData = new Map();
          projections.forEach((proj, index) => {
            const year = Math.ceil(proj.month_index / 12);
            const subscriptionRevenue = baseSubscriptionMRR * Math.pow(1 + monthlyGrowth, index);
            const adRevenue = Number(proj.constrained_gross_revenue) || 0;
            const totalRevenue = subscriptionRevenue + adRevenue;
            const totalPayouts = (subscriptionRevenue * subscriptionMargin) + (Number(proj.creator_payout) || 0);
            const netProfit = totalRevenue - totalPayouts;

            if (!yearlyData.has(year)) {
              yearlyData.set(year, { subscriptionRevenue: 0, adRevenue: 0, totalRevenue: 0, totalPayouts: 0, netProfit: 0 });
            }
            const yearData = yearlyData.get(year);
            yearData.subscriptionRevenue += subscriptionRevenue;
            yearData.adRevenue += adRevenue;
            yearData.totalRevenue += totalRevenue;
            yearData.totalPayouts += totalPayouts;
            yearData.netProfit += netProfit;
          });

          combinedRevenueContext = `

** COMBINED REVENUE MODEL (Subscriptions + Ads) **

${Array.from(yearlyData.entries()).map(([year, data]) => `
Year ${year}:
  - Total Revenue: $${(data.totalRevenue / 1000000).toFixed(2)}M
  - Subscription Revenue: $${(data.subscriptionRevenue / 1000000).toFixed(2)}M (${((data.subscriptionRevenue / data.totalRevenue) * 100).toFixed(1)}%)
  - Ad Revenue: $${(data.adRevenue / 1000000).toFixed(2)}M (${((data.adRevenue / data.totalRevenue) * 100).toFixed(1)}%)
  - Creator Payouts: $${(data.totalPayouts / 1000000).toFixed(2)}M
  - Net Profit: $${(data.netProfit / 1000000).toFixed(2)}M
  - Gross Margin: ${((1 - data.totalPayouts / data.totalRevenue) * 100).toFixed(1)}%
`).join('\n')}
`;
        }
      }

      // Fetch rate desk inventory data
      const { data: inventoryUnits } = await supabase
        .from('ad_inventory_units')
        .select('*')
        .eq('is_active', true);

      if (inventoryUnits && inventoryUnits.length > 0) {
        const totalMonthlyImpressions = inventoryUnits.reduce((sum, unit) => sum + Number(unit.expected_monthly_impressions), 0);
        const avgCPM = inventoryUnits.reduce((sum, unit) => sum + Number(unit.target_cpm), 0) / inventoryUnits.length;
        const potentialMonthlyRevenue = (totalMonthlyImpressions / 1000) * avgCPM;

        rateDeskContext = `

** SALES RATE DESK - AD INVENTORY OVERVIEW **

Total Active Inventory Units: ${inventoryUnits.length}
Total Monthly Sellable Impressions: ${(totalMonthlyImpressions / 1000).toFixed(0)}K
Average Target CPM: $${avgCPM.toFixed(2)}
Potential Monthly Gross Ad Spend: $${(potentialMonthlyRevenue / 1000).toFixed(1)}K

CPM Ranges by Placement:
${inventoryUnits.map(u => `  - ${u.name} (${u.type}): Floor $${u.floor_cpm} - Target $${u.target_cpm} - Ceiling $${u.ceiling_cpm}`).join('\n')}
`;
      }
    } catch (err) {
      console.error('Failed to load financial data:', err);
    }

    const systemPrompt = `You are Seeksy Spark, a CFO AI Assistant for the Seeksy platform.

You have access to sensitive financial data. The user has been verified as having admin/CFO/board member access.

FINANCIAL DATA:
${combinedRevenueContext}
${scenarioAssumptionsContext}
${advertiserContext}
${campaignContext}
${adFinancialContext}
${rateDeskContext}
${contextString}

Provide helpful, accurate financial analysis. Be concise but data-driven.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    return new Response(JSON.stringify({ generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in cfo-ai-assistant:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
