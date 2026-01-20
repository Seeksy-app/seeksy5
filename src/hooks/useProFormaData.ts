import { useState, useMemo, useCallback } from "react";

export interface ProFormaAssumptions {
  sponsor_conversion_rate: number;
  category_sponsors: { "2026": number; "2027": number; "2028": number };
  engagement_sponsors: { "2026": number; "2027": number; "2028": number };
  vertical_expansion: { "2026": number; "2027": number; "2028": number };
  livestream_impressions: { "2026": number; "2027": number; "2028": number };
  livestream_cpm: number;
  branded_content_growth: number;
  award_purchase_revenue: { "2026": number; "2027": number; "2028": number };
  mic_bundle_revenue: { "2026": number; "2027": number; "2028": number };
  production_costs: { "2026": number; "2027": number; "2028": number };
  staffing_costs: { "2026": number; "2027": number; "2028": number };
  marketing_costs: { "2026": number; "2027": number; "2028": number };
  commission_rate: number;
}

export interface FinancialData {
  years: string[];
  revenue: number[];
  expenses: number[];
  ebitda: number[];
}

const defaultAssumptions: ProFormaAssumptions = {
  sponsor_conversion_rate: 0.85,
  category_sponsors: { "2026": 6, "2027": 8, "2028": 12 },
  engagement_sponsors: { "2026": 3, "2027": 4, "2028": 5 },
  vertical_expansion: { "2026": 2, "2027": 4, "2028": 6 },
  livestream_impressions: { "2026": 4000000, "2027": 8000000, "2028": 12000000 },
  livestream_cpm: 12.50,
  branded_content_growth: 0.65,
  award_purchase_revenue: { "2026": 8000, "2027": 15000, "2028": 25000 },
  mic_bundle_revenue: { "2026": 40000, "2027": 75000, "2028": 120000 },
  production_costs: { "2026": 45000, "2027": 80000, "2028": 110000 },
  staffing_costs: { "2026": 110000, "2027": 150000, "2028": 200000 },
  marketing_costs: { "2026": 35000, "2027": 50000, "2028": 65000 },
  commission_rate: 0.10,
};

export function useProFormaData() {
  const [assumptions, setAssumptions] = useState<ProFormaAssumptions>(defaultAssumptions);

  const calculateFinancials = useCallback((a: ProFormaAssumptions): FinancialData => {
    const years = ["2026", "2027", "2028"] as const;
    
    const revenue = years.map((year) => {
      // Sponsorship revenue
      const categoryRevenue = a.category_sponsors[year] * 25000 * a.sponsor_conversion_rate;
      const engagementRevenue = a.engagement_sponsors[year] * 15000 * a.sponsor_conversion_rate;
      const verticalRevenue = a.vertical_expansion[year] * 20000;
      
      // Livestream advertising
      const livestreamRevenue = (a.livestream_impressions[year] / 1000) * a.livestream_cpm;
      
      // Additional revenue streams
      const brandedContent = livestreamRevenue * a.branded_content_growth;
      const awardRevenue = a.award_purchase_revenue[year];
      const micRevenue = a.mic_bundle_revenue[year];
      
      return Math.round(
        categoryRevenue + engagementRevenue + verticalRevenue + 
        livestreamRevenue + brandedContent + awardRevenue + micRevenue
      );
    });

    const expenses = years.map((year, idx) => {
      const production = a.production_costs[year];
      const staffing = a.staffing_costs[year];
      const marketing = a.marketing_costs[year];
      const commission = revenue[idx] * a.commission_rate;
      const overhead = (production + staffing + marketing) * 0.15;
      
      return Math.round(production + staffing + marketing + commission + overhead);
    });

    const ebitda = revenue.map((rev, idx) => rev - expenses[idx]);

    return {
      years: [...years],
      revenue,
      expenses,
      ebitda,
    };
  }, []);

  const financialData = useMemo(() => calculateFinancials(assumptions), [assumptions, calculateFinancials]);

  const updateAssumptions = useCallback((updates: Partial<ProFormaAssumptions>) => {
    setAssumptions(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    financialData,
    assumptions,
    updateAssumptions,
  };
}
