import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getFinancialOverview } from "@/lib/api/financialApis";

interface CombinedProjection {
  month: number;
  year: number;
  periodLabel: string;
  subscriptionRevenue: number;
  adRevenue: number;
  totalRevenue: number;
  subscriptionPayouts: number;
  adPayouts: number;
  totalPayouts: number;
  netProfit: number;
  grossMargin: number;
}

interface CombinedYearlySummary {
  year: number;
  subscriptionRevenue: number;
  adRevenue: number;
  totalRevenue: number;
  subscriptionPayouts: number;
  adPayouts: number;
  totalPayouts: number;
  netProfit: number;
  grossMargin: number;
}

interface AdProjection {
  month_index: number;
  constrained_gross_revenue: number;
  creator_payout: number;
  [key: string]: any;
}

export function useCombinedFinancialData(scenarioId?: string) {
  // Fetch subscription/platform overview
  const { data: financialOverview, isLoading: loadingOverview } = useQuery({
    queryKey: ["financial-overview"],
    queryFn: getFinancialOverview,
  });

  // Fetch ad revenue projections
  const { data: adProjections, isLoading: loadingAd } = useQuery({
    queryKey: ["ad-financial-projections", scenarioId],
    queryFn: async () => {
      if (!scenarioId) {
        // Fetch base scenario if no scenario specified
        const scenarioResult = await (supabase as any)
          .from("ad_financial_scenarios")
          .select("id")
          .eq("name", "Base Case")
          .single();
        
        if (scenarioResult.error || !scenarioResult.data) return [];
        
        const result = await (supabase as any)
          .from("ad_financial_projections")
          .select("*")
          .eq("scenario_id", scenarioResult.data.id)
          .order("month_index", { ascending: true });
        
        if (result.error) throw result.error;
        return result.data as AdProjection[];
      }
      
      const result = await (supabase as any)
        .from("ad_financial_projections")
        .select("*")
        .eq("scenario_id", scenarioId)
        .order("month_index", { ascending: true });
      
      if (result.error) throw result.error;
      return result.data as AdProjection[];
    },
  });

  // Fetch ad summaries for all scenarios
  const { data: adSummaries, isLoading: loadingSummaries } = useQuery({
    queryKey: ["ad-financial-model-summaries"],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("ad_financial_model_summaries")
        .select("*");
      if (result.error) throw result.error;
      return result.data as any[];
    },
  });

  // Fetch scenarios
  const { data: scenarios } = useQuery({
    queryKey: ["ad-financial-scenarios"],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("ad_financial_scenarios")
        .select("*")
        .order("created_at", { ascending: true });
      if (result.error) throw result.error;
      return result.data as any[];
    },
  });

  // Combine monthly projections
  const combineMonthlyProjections = (): CombinedProjection[] => {
    if (!adProjections || adProjections.length === 0) return [];

    // Subscription assumptions (simplified monthly growth model)
    const baseSubscriptionMRR = financialOverview?.mrr || 82000;
    const monthlyGrowth = 0.15; // 15% monthly growth
    const subscriptionMargin = 0.75; // 25% platform fee
    
    return adProjections.map((adProj: AdProjection, index: number) => {
      // Calculate subscription revenue with growth
      const subscriptionRevenue = baseSubscriptionMRR * Math.pow(1 + monthlyGrowth, index);
      const subscriptionPayouts = subscriptionRevenue * subscriptionMargin;
      
      // Ad data from projections
      const adRevenue = Number(adProj.constrained_gross_revenue) || 0;
      const adPayouts = Number(adProj.creator_payout) || 0;
      
      // Combined totals
      const totalRevenue = subscriptionRevenue + adRevenue;
      const totalPayouts = subscriptionPayouts + adPayouts;
      const netProfit = totalRevenue - totalPayouts;
      const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalPayouts) / totalRevenue) * 100 : 0;
      
      return {
        month: adProj.month_index,
        year: Math.ceil(adProj.month_index / 12),
        periodLabel: `M${adProj.month_index}`,
        subscriptionRevenue,
        adRevenue,
        totalRevenue,
        subscriptionPayouts,
        adPayouts,
        totalPayouts,
        netProfit,
        grossMargin,
      };
    });
  };

  // Calculate yearly summaries
  const calculateYearlySummaries = (): CombinedYearlySummary[] => {
    const monthlyData = combineMonthlyProjections();
    if (monthlyData.length === 0) return [];

    const yearlyMap = new Map<number, CombinedYearlySummary>();
    
    monthlyData.forEach((month) => {
      const existing = yearlyMap.get(month.year);
      if (existing) {
        existing.subscriptionRevenue += month.subscriptionRevenue;
        existing.adRevenue += month.adRevenue;
        existing.totalRevenue += month.totalRevenue;
        existing.subscriptionPayouts += month.subscriptionPayouts;
        existing.adPayouts += month.adPayouts;
        existing.totalPayouts += month.totalPayouts;
        existing.netProfit += month.netProfit;
      } else {
        yearlyMap.set(month.year, {
          year: month.year,
          subscriptionRevenue: month.subscriptionRevenue,
          adRevenue: month.adRevenue,
          totalRevenue: month.totalRevenue,
          subscriptionPayouts: month.subscriptionPayouts,
          adPayouts: month.adPayouts,
          totalPayouts: month.totalPayouts,
          netProfit: month.netProfit,
          grossMargin: 0, // Will calculate after
        });
      }
    });

    // Calculate average gross margin for each year
    const yearlyData = Array.from(yearlyMap.values());
    yearlyData.forEach((year) => {
      year.grossMargin = year.totalRevenue > 0 
        ? ((year.totalRevenue - year.totalPayouts) / year.totalRevenue) * 100 
        : 0;
    });

    return yearlyData.sort((a, b) => a.year - b.year);
  };

  return {
    financialOverview,
    adProjections,
    adSummaries,
    scenarios,
    monthlyProjections: combineMonthlyProjections(),
    yearlySummaries: calculateYearlySummaries(),
    isLoading: loadingOverview || loadingAd || loadingSummaries,
  };
}
