-- Add unique constraint on scenario_key + forecast_year for upsert to work
ALTER TABLE proforma_forecasts 
ADD CONSTRAINT proforma_forecasts_scenario_year_unique 
UNIQUE (scenario_key, forecast_year);