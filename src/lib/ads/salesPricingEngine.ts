import { supabase } from "@/integrations/supabase/client";

// CPM multipliers by inventory type
const TYPE_CPM_MULTIPLIERS = {
  podcast: 1.0,
  livestream: 1.2,
  event: 1.4,
  creator_page: 0.8,
  newsletter: 0.9,
  other: 1.0,
};

// Scenario adjustments
const SCENARIO_MULTIPLIERS = {
  conservative: 0.85,
  base: 1.0,
  aggressive: 1.15,
};

export interface InventoryUnitWithPricing {
  id: string;
  name: string;
  slug: string;
  type: string;
  placement: string;
  target_cpm: number;
  floor_cpm: number;
  ceiling_cpm: number;
  expected_monthly_impressions: number;
  seasonality_factor: number;
  is_active: boolean;
  recommended_cpm: number;
  adjusted_floor_cpm: number;
  adjusted_ceiling_cpm: number;
  potential_revenue_30d: number;
  potential_revenue_90d: number;
  potential_revenue_12m: number;
  health_status: "Underpriced" | "Healthy" | "Premium";
}

export interface RateDeskView {
  scenario: {
    slug: string;
    name: string;
    description: string | null;
  };
  summary: {
    total_sellable_impressions_30d: number;
    total_sellable_impressions_90d: number;
    total_sellable_impressions_12m: number;
    potential_gross_spend_30d: number;
    potential_gross_spend_90d: number;
    potential_gross_spend_12m: number;
    seeksy_revenue_30d: number;
    seeksy_revenue_90d: number;
    seeksy_revenue_12m: number;
    average_recommended_cpm: number;
  };
  inventory: InventoryUnitWithPricing[];
}

export async function getRateDeskView(options: {
  scenarioSlug?: string;
  months?: number;
}): Promise<RateDeskView> {
  const { scenarioSlug = "base", months = 1 } = options;

  // Fetch the scenario
  const scenarioResult = await (supabase as any)
    .from("ad_financial_scenarios")
    .select("*")
    .eq("name", scenarioSlug.charAt(0).toUpperCase() + scenarioSlug.slice(1))
    .limit(1);

  if (scenarioResult.error) throw scenarioResult.error;
  const scenarios = scenarioResult.data as any[] || [];
  
  const scenario = scenarios?.[0] || { 
    id: "default", 
    name: "Base", 
    description: "Base scenario" 
  };

  // Fetch assumptions for the scenario
  const assumptionsResult = await (supabase as any)
    .from("ad_financial_assumptions")
    .select("*")
    .eq("scenario_id", scenario.id)
    .limit(1)
    .single();

  if (assumptionsResult.error) console.warn("No assumptions found, using defaults");
  const assumptions = assumptionsResult.data as any;

  const baseCPM = assumptions?.cpm_midroll || 25.0;
  const creatorRevShare = assumptions?.creator_rev_share || 0.7;
  const platformShare = 1 - creatorRevShare;

  // Fetch all active inventory units
  const inventoryResult = await (supabase as any)
    .from("ad_inventory_units")
    .select("*")
    .eq("is_active", true)
    .order("type", { ascending: true });

  if (inventoryResult.error) throw inventoryResult.error;
  const inventoryUnits = inventoryResult.data as any[] || [];

  // Calculate pricing for each unit
  const scenarioMultiplier = SCENARIO_MULTIPLIERS[scenarioSlug as keyof typeof SCENARIO_MULTIPLIERS] || 1.0;

  const inventoryWithPricing: InventoryUnitWithPricing[] = (inventoryUnits || []).map((unit: any) => {
    const typeMultiplier = TYPE_CPM_MULTIPLIERS[unit.type as keyof typeof TYPE_CPM_MULTIPLIERS] || 1.0;
    
    // Calculate recommended CPM
    const baseRecommendedCPM = unit.target_cpm * typeMultiplier * scenarioMultiplier * unit.seasonality_factor;
    const recommended_cpm = Math.max(unit.floor_cpm, Math.min(unit.ceiling_cpm, baseRecommendedCPM));

    // Adjusted floor and ceiling based on scenario
    const adjusted_floor_cpm = unit.floor_cpm * scenarioMultiplier;
    const adjusted_ceiling_cpm = unit.ceiling_cpm * scenarioMultiplier;

    // Calculate potential revenue
    const monthly_impressions = unit.expected_monthly_impressions;
    const revenue_per_1k = recommended_cpm;
    
    const potential_revenue_30d = (monthly_impressions / 1000) * revenue_per_1k;
    const potential_revenue_90d = potential_revenue_30d * 3;
    const potential_revenue_12m = potential_revenue_30d * 12;

    // Health status
    let health_status: "Underpriced" | "Healthy" | "Premium";
    if (recommended_cpm < unit.target_cpm * 0.9) {
      health_status = "Underpriced";
    } else if (recommended_cpm > unit.target_cpm * 1.2) {
      health_status = "Premium";
    } else {
      health_status = "Healthy";
    }

    return {
      ...unit,
      recommended_cpm: parseFloat(recommended_cpm.toFixed(2)),
      adjusted_floor_cpm: parseFloat(adjusted_floor_cpm.toFixed(2)),
      adjusted_ceiling_cpm: parseFloat(adjusted_ceiling_cpm.toFixed(2)),
      potential_revenue_30d: parseFloat(potential_revenue_30d.toFixed(2)),
      potential_revenue_90d: parseFloat(potential_revenue_90d.toFixed(2)),
      potential_revenue_12m: parseFloat(potential_revenue_12m.toFixed(2)),
      health_status,
    };
  });

  // Calculate summary metrics
  const total_sellable_impressions_30d = inventoryWithPricing.reduce((sum, unit) => sum + unit.expected_monthly_impressions, 0);
  const total_sellable_impressions_90d = total_sellable_impressions_30d * 3;
  const total_sellable_impressions_12m = total_sellable_impressions_30d * 12;

  const potential_gross_spend_30d = inventoryWithPricing.reduce((sum, unit) => sum + unit.potential_revenue_30d, 0);
  const potential_gross_spend_90d = inventoryWithPricing.reduce((sum, unit) => sum + unit.potential_revenue_90d, 0);
  const potential_gross_spend_12m = inventoryWithPricing.reduce((sum, unit) => sum + unit.potential_revenue_12m, 0);

  const seeksy_revenue_30d = potential_gross_spend_30d * platformShare;
  const seeksy_revenue_90d = potential_gross_spend_90d * platformShare;
  const seeksy_revenue_12m = potential_gross_spend_12m * platformShare;

  const average_recommended_cpm = inventoryWithPricing.length > 0
    ? inventoryWithPricing.reduce((sum, unit) => sum + unit.recommended_cpm, 0) / inventoryWithPricing.length
    : 0;

  return {
    scenario: {
      slug: scenarioSlug,
      name: scenario.name,
      description: scenario.description,
    },
    summary: {
      total_sellable_impressions_30d,
      total_sellable_impressions_90d,
      total_sellable_impressions_12m,
      potential_gross_spend_30d: parseFloat(potential_gross_spend_30d.toFixed(2)),
      potential_gross_spend_90d: parseFloat(potential_gross_spend_90d.toFixed(2)),
      potential_gross_spend_12m: parseFloat(potential_gross_spend_12m.toFixed(2)),
      seeksy_revenue_30d: parseFloat(seeksy_revenue_30d.toFixed(2)),
      seeksy_revenue_90d: parseFloat(seeksy_revenue_90d.toFixed(2)),
      seeksy_revenue_12m: parseFloat(seeksy_revenue_12m.toFixed(2)),
      average_recommended_cpm: parseFloat(average_recommended_cpm.toFixed(2)),
    },
    inventory: inventoryWithPricing,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toFixed(0);
}
