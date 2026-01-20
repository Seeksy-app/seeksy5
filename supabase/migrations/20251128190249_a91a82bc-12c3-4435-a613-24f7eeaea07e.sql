
-- Add unique constraint on scenario_id for ad_financial_model_summaries to support upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_financial_model_summaries_scenario_unique
ON ad_financial_model_summaries (scenario_id);

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_ad_financial_assumptions_scenario
ON ad_financial_assumptions (scenario_id);

CREATE INDEX IF NOT EXISTS idx_ad_financial_projections_scenario_month
ON ad_financial_projections (scenario_id, month_index);
