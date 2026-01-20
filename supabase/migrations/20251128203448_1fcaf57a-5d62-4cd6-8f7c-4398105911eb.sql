-- Seed AI Financial Scenarios (Base, Conservative, Aggressive)
DO $$
DECLARE
  base_scenario_id UUID;
  conservative_scenario_id UUID;
  aggressive_scenario_id UUID;
  admin_user_id UUID := 'bdc068e7-2042-4cd4-ae1b-9261e96b27ec'::UUID;
BEGIN
  -- Insert Base Scenario
  INSERT INTO ad_financial_scenarios (id, name, description, is_default, created_by, created_at)
  VALUES (
    gen_random_uuid(),
    'Base Forecast',
    'Balanced projection based on moderate market conditions and steady platform growth',
    true,
    admin_user_id,
    now()
  )
  RETURNING id INTO base_scenario_id;

  -- Insert Conservative Scenario
  INSERT INTO ad_financial_scenarios (id, name, description, is_default, created_by, created_at)
  VALUES (
    gen_random_uuid(),
    'Conservative Forecast',
    'Cautious projection assuming slower market adoption and lower conversion rates',
    false,
    admin_user_id,
    now()
  )
  RETURNING id INTO conservative_scenario_id;

  -- Insert Aggressive Scenario
  INSERT INTO ad_financial_scenarios (id, name, description, is_default, created_by, created_at)
  VALUES (
    gen_random_uuid(),
    'Aggressive Forecast',
    'Optimistic projection assuming accelerated growth and high market penetration',
    false,
    admin_user_id,
    now()
  )
  RETURNING id INTO aggressive_scenario_id;

  -- Insert Base Assumptions
  INSERT INTO ad_financial_assumptions (
    scenario_id,
    cpm_preroll, cpm_midroll, cpm_postroll,
    share_preroll, share_midroll, share_postroll,
    creator_rev_share, platform_variable_cost_pct,
    starting_campaigns, monthly_campaign_growth, avg_campaign_monthly_budget, avg_campaign_duration_months,
    starting_creators, monthly_creator_growth, episodes_per_creator_per_month,
    percent_creators_monetized, fill_rate, ad_slots_per_listen, listens_per_episode,
    assumptions_json,
    created_at
  )
  VALUES (
    base_scenario_id,
    14.80, 18.50, 22.20,
    0.25, 0.50, 0.25,
    0.70, 0.05,
    50, 0.11, 1150, 3,
    200, 0.07, 4,
    0.05, 0.85, 2.5, 22,
    jsonb_build_object(
      'monthly_user_growth', 0.11,
      'creator_growth', 0.07,
      'average_cpm', 18.50,
      'impressions_per_user', 22,
      'advertiser_conversion_rate', 0.042,
      'campaign_renewal_rate', 0.56,
      'platform_fee', 0.30,
      'churn_rate', 0.06,
      'paid_creator_ratio', 0.05,
      'avg_campaign_budget', 1150,
      'ai_tools_attach_rate', 0.20
    ),
    now()
  );

  -- Insert Conservative Assumptions
  INSERT INTO ad_financial_assumptions (
    scenario_id,
    cpm_preroll, cpm_midroll, cpm_postroll,
    share_preroll, share_midroll, share_postroll,
    creator_rev_share, platform_variable_cost_pct,
    starting_campaigns, monthly_campaign_growth, avg_campaign_monthly_budget, avg_campaign_duration_months,
    starting_creators, monthly_creator_growth, episodes_per_creator_per_month,
    percent_creators_monetized, fill_rate, ad_slots_per_listen, listens_per_episode,
    assumptions_json,
    created_at
  )
  VALUES (
    conservative_scenario_id,
    9.80, 12.25, 14.70,
    0.25, 0.50, 0.25,
    0.75, 0.04,
    30, 0.05, 725, 3,
    150, 0.04, 3,
    0.03, 0.70, 2.0, 18,
    jsonb_build_object(
      'monthly_user_growth', 0.05,
      'creator_growth', 0.04,
      'average_cpm', 12.25,
      'impressions_per_user', 18,
      'advertiser_conversion_rate', 0.022,
      'campaign_renewal_rate', 0.39,
      'platform_fee', 0.25,
      'churn_rate', 0.098,
      'paid_creator_ratio', 0.03,
      'avg_campaign_budget', 725,
      'ai_tools_attach_rate', 0.09
    ),
    now()
  );

  -- Insert Aggressive Assumptions
  INSERT INTO ad_financial_assumptions (
    scenario_id,
    cpm_preroll, cpm_midroll, cpm_postroll,
    share_preroll, share_midroll, share_postroll,
    creator_rev_share, platform_variable_cost_pct,
    starting_campaigns, monthly_campaign_growth, avg_campaign_monthly_budget, avg_campaign_duration_months,
    starting_creators, monthly_creator_growth, episodes_per_creator_per_month,
    percent_creators_monetized, fill_rate, ad_slots_per_listen, listens_per_episode,
    assumptions_json,
    created_at
  )
  VALUES (
    aggressive_scenario_id,
    21.40, 26.75, 32.10,
    0.25, 0.50, 0.25,
    0.68, 0.06,
    80, 0.20, 1900, 4,
    300, 0.14, 5,
    0.08, 0.92, 3.0, 30,
    jsonb_build_object(
      'monthly_user_growth', 0.20,
      'creator_growth', 0.14,
      'average_cpm', 26.75,
      'impressions_per_user', 30,
      'advertiser_conversion_rate', 0.065,
      'campaign_renewal_rate', 0.72,
      'platform_fee', 0.32,
      'churn_rate', 0.041,
      'paid_creator_ratio', 0.08,
      'avg_campaign_budget', 1900,
      'ai_tools_attach_rate', 0.28
    ),
    now()
  );

END $$;