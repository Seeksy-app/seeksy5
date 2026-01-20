import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProjectionInput {
  scenario_id: string;
  months?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { scenario_id, months = 12 }: ProjectionInput = await req.json();

    console.log(`[ad-financial-projection] Computing projection for scenario ${scenario_id}, ${months} months`);

    // 1. Load scenario
    const { data: scenario, error: scenarioError } = await supabase
      .from('ad_financial_scenarios')
      .select('*')
      .eq('id', scenario_id)
      .single();

    if (scenarioError || !scenario) {
      throw new Error(`Scenario not found: ${scenarioError?.message}`);
    }

    // 2. Load assumptions
    const { data: assumptions, error: assumptionsError } = await supabase
      .from('ad_financial_assumptions')
      .select('*')
      .eq('scenario_id', scenario_id)
      .single();

    if (assumptionsError || !assumptions) {
      throw new Error(`Assumptions not found: ${assumptionsError?.message}`);
    }

    // 3. Load recent actuals from admin_revenue_reports
    const { data: recentRevenue } = await supabase
      .from('admin_revenue_reports')
      .select('*')
      .order('period_start', { ascending: false })
      .limit(30);

    const baselineRevenue = recentRevenue?.reduce((sum, r) => sum + Number(r.net_revenue), 0) || 0;

    console.log(`[ad-financial-projection] Baseline revenue: ${baselineRevenue}`);

    // 4. Delete existing projections for this scenario
    await supabase
      .from('ad_financial_projections')
      .delete()
      .eq('scenario_id', scenario_id);

    // 5. Compute month-by-month projections
    const projections = [];
    let totalGrossRevenue = 0;
    let totalPlatformRevenue = 0;
    let totalCreatorPayout = 0;
    let totalImpressions = 0;

    const today = new Date();

    for (let m = 0; m < months; m++) {
      const monthIndex = m + 1;
      
      // Growth calculations
      const creators = Math.round(
        assumptions.starting_creators * Math.pow(1 + assumptions.monthly_creator_growth, m)
      );
      const monetizedCreators = Math.round(creators * assumptions.percent_creators_monetized);
      const episodes = monetizedCreators * assumptions.episodes_per_creator_per_month;
      const totalListens = episodes * assumptions.listens_per_episode;
      
      // Ad impressions
      const rawImpressions = totalListens * assumptions.ad_slots_per_listen;
      const filledImpressions = rawImpressions * assumptions.fill_rate;
      
      // Split by slot type
      const impressionsPreroll = filledImpressions * assumptions.share_preroll;
      const impressionsMidroll = filledImpressions * assumptions.share_midroll;
      const impressionsPostroll = filledImpressions * assumptions.share_postroll;
      
      // Revenue by slot type
      const grossPreroll = (impressionsPreroll / 1000) * assumptions.cpm_preroll;
      const grossMidroll = (impressionsMidroll / 1000) * assumptions.cpm_midroll;
      const grossPostroll = (impressionsPostroll / 1000) * assumptions.cpm_postroll;
      const grossTotalUnconstrained = grossPreroll + grossMidroll + grossPostroll;
      
      // Advertiser budget constraint
      const activeCampaigns = Math.round(
        assumptions.starting_campaigns * Math.pow(1 + assumptions.monthly_campaign_growth, m)
      );
      const maxBillableRevenue = activeCampaigns * assumptions.avg_campaign_monthly_budget;
      const constrainedGrossRevenue = Math.min(grossTotalUnconstrained, maxBillableRevenue);
      
      // Scale factor
      const scaleFactor = constrainedGrossRevenue / grossTotalUnconstrained;
      const finalGrossPreroll = grossPreroll * scaleFactor;
      const finalGrossMidroll = grossMidroll * scaleFactor;
      const finalGrossPostroll = grossPostroll * scaleFactor;
      
      // Payouts and net
      const creatorPayout = constrainedGrossRevenue * assumptions.creator_rev_share;
      const platformVariableCosts = constrainedGrossRevenue * assumptions.platform_variable_cost_pct;
      const platformNetRevenue = constrainedGrossRevenue - creatorPayout - platformVariableCosts;
      
      // Accumulate totals
      totalGrossRevenue += constrainedGrossRevenue;
      totalPlatformRevenue += platformNetRevenue;
      totalCreatorPayout += creatorPayout;
      totalImpressions += filledImpressions;
      
      // Period dates
      const periodStart = new Date(today);
      periodStart.setMonth(today.getMonth() + m);
      periodStart.setDate(1);
      
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodStart.getMonth() + 1);
      periodEnd.setDate(0);
      
      projections.push({
        scenario_id,
        month_index: monthIndex,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        creators,
        monetized_creators: monetizedCreators,
        episodes,
        impressions_preroll: Math.round(impressionsPreroll),
        impressions_midroll: Math.round(impressionsMidroll),
        impressions_postroll: Math.round(impressionsPostroll),
        total_impressions: Math.round(filledImpressions),
        gross_revenue_preroll: Math.round(finalGrossPreroll * 100) / 100,
        gross_revenue_midroll: Math.round(finalGrossMidroll * 100) / 100,
        gross_revenue_postroll: Math.round(finalGrossPostroll * 100) / 100,
        gross_revenue_total: Math.round(constrainedGrossRevenue * 100) / 100,
        active_campaigns: activeCampaigns,
        max_billable_revenue: Math.round(maxBillableRevenue * 100) / 100,
        constrained_gross_revenue: Math.round(constrainedGrossRevenue * 100) / 100,
        creator_payout: Math.round(creatorPayout * 100) / 100,
        platform_variable_costs: Math.round(platformVariableCosts * 100) / 100,
        platform_net_revenue: Math.round(platformNetRevenue * 100) / 100,
      });
    }

    // 6. Insert projections
    const { error: insertError } = await supabase
      .from('ad_financial_projections')
      .insert(projections);

    if (insertError) {
      throw new Error(`Failed to insert projections: ${insertError.message}`);
    }

    console.log(`[ad-financial-projection] Inserted ${projections.length} projection rows`);

    // 7. Calculate summary
    const avgCpm = totalGrossRevenue / (totalImpressions / 1000);
    const year1Projections = projections.slice(0, 12);
    const year1Revenue = year1Projections.reduce((sum, p) => sum + p.platform_net_revenue, 0);
    const year1CreatorPayout = year1Projections.reduce((sum, p) => sum + p.creator_payout, 0);
    const year1Impressions = year1Projections.reduce((sum, p) => sum + p.total_impressions, 0);

    const summaryText = `
${scenario.name} Scenario - ${months} Month Projection:
- Total Impressions: ${Math.round(totalImpressions).toLocaleString()}
- Total Gross Revenue: $${Math.round(totalGrossRevenue).toLocaleString()}
- Total Platform Revenue: $${Math.round(totalPlatformRevenue).toLocaleString()}
- Total Creator Payouts: $${Math.round(totalCreatorPayout).toLocaleString()}
- Average CPM: $${avgCpm.toFixed(2)}
- Year 1 Revenue: $${Math.round(year1Revenue).toLocaleString()}
- Year 1 Creator Payouts: $${Math.round(year1CreatorPayout).toLocaleString()}
- Year 1 Impressions: ${Math.round(year1Impressions).toLocaleString()}
    `.trim();

    // 8. Upsert summary
    await supabase
      .from('ad_financial_model_summaries')
      .upsert({
        scenario_id,
        summary_text: summaryText,
      }, {
        onConflict: 'scenario_id',
      });

    console.log(`[ad-financial-projection] Updated summary for scenario ${scenario_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        scenario_id,
        months,
        total_gross_revenue: totalGrossRevenue,
        total_platform_revenue: totalPlatformRevenue,
        total_creator_payout: totalCreatorPayout,
        total_impressions: totalImpressions,
        summary: summaryText,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ad-financial-projection] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
