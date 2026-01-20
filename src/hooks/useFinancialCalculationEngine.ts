import { useMemo, useCallback } from 'react';
import { useCFOMasterModel, CFOAssumptions, KeyMetrics } from './useCFOMasterModel';

/**
 * Financial Calculation Engine
 * 
 * This hook provides real-time EBITDA and Break-Even calculations
 * that update whenever ANY of the input drivers change.
 * 
 * Drivers:
 * - Revenue: Subscriptions, Advertising, Marketplace, Creator Growth, Churn, ARPU, Identity Verification
 * - COGS: Hosting Cost/User, Bandwidth Multiplier, AI Inference, Payment Processing
 * - OpEx: Headcount productivity, CAC, Marketing budget, AI efficiency
 */

export interface FinancialProjection {
  // Monthly projections (36 months)
  monthlyRevenue: number[];
  monthlyCogs: number[];
  monthlyOpex: number[];
  monthlyGrossProfit: number[];
  monthlyEbitda: number[];
  cumulativeEbitda: number[];
  
  // Yearly summaries
  yearlyRevenue: number[];
  yearlyCogs: number[];
  yearlyOpex: number[];
  yearlyGrossProfit: number[];
  yearlyEbitda: number[];
  yearlyGrossMargin: number[];
  yearlyEbitdaMargin: number[];
  
  // Key metrics
  breakEvenMonth: number | null;
  runwayMonths: number;
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  paybackPeriod: number;
  
  // Identity Verification specific
  verifiedCreatorRevenue: number[];
  verificationAdoptionRate: number;
}

export interface CalculationDrivers {
  // Revenue Drivers
  subscriptionRevenue: number[];
  advertisingRevenue: number[];
  marketplaceFillRate: number;
  cpm: number;
  impressions: number[];
  creatorGrowth: number;
  churn: number;
  arpu: number;
  pricingSensitivity: number;
  identityVerificationAdoption: number;
  
  // COGS Drivers
  hostingCostPerUser: number;
  bandwidthMultiplier: number;
  aiInferenceCostPerMin: number;
  aiUsageMultiplier: number;
  paymentProcessingFee: number;
  
  // OpEx Drivers
  headcountProductivity: number;
  cacPaid: number;
  cacOrganic: number;
  organicGrowthMix: number;
  marketingBudget: number;
  aiEfficiencyMultiplier: number;
  
  // Capital
  startingCash: number;
}

const DEFAULT_DRIVERS: CalculationDrivers = {
  subscriptionRevenue: [480000, 1200000, 2400000],
  advertisingRevenue: [180000, 720000, 1800000],
  marketplaceFillRate: 65,
  cpm: 22,
  impressions: [1000000, 4000000, 10000000],
  creatorGrowth: 8,
  churn: 5,
  arpu: 45,
  pricingSensitivity: 0,
  identityVerificationAdoption: 25,
  
  hostingCostPerUser: 12,
  bandwidthMultiplier: 1.0,
  aiInferenceCostPerMin: 0.005,
  aiUsageMultiplier: 1.0,
  paymentProcessingFee: 3,
  
  headcountProductivity: 1.0,
  cacPaid: 85,
  cacOrganic: 15,
  organicGrowthMix: 30,
  marketingBudget: 10000,
  aiEfficiencyMultiplier: 1.0,
  
  startingCash: 500000,
};

export function useFinancialCalculationEngine(overrides?: Partial<CalculationDrivers>) {
  const {
    assumptions,
    currentScenarioData,
    startingCash,
  } = useCFOMasterModel();
  
  // Merge CFO assumptions with any overrides
  const drivers = useMemo((): CalculationDrivers => {
    return {
      subscriptionRevenue: currentScenarioData.revenue.saasSubscriptions,
      advertisingRevenue: currentScenarioData.revenue.advertisingMarketplace,
      marketplaceFillRate: assumptions.adFillRate,
      cpm: assumptions.advertisingCPM,
      impressions: [1000000, 4000000, 10000000], // Base impressions
      creatorGrowth: assumptions.monthlyCreatorGrowth,
      churn: assumptions.churnRate,
      arpu: assumptions.avgRevenuePerCreator,
      pricingSensitivity: assumptions.pricingSensitivity,
      identityVerificationAdoption: assumptions.aiToolsAdoption, // Using AI tools as proxy
      
      hostingCostPerUser: assumptions.hostingCostPerUser,
      bandwidthMultiplier: assumptions.bandwidthMultiplier,
      aiInferenceCostPerMin: assumptions.aiInferenceCostPerMin,
      aiUsageMultiplier: assumptions.aiUsageMultiplier,
      paymentProcessingFee: assumptions.paymentProcessingFee,
      
      headcountProductivity: assumptions.headcountProductivity,
      cacPaid: assumptions.cacPaid,
      cacOrganic: assumptions.cacOrganic,
      organicGrowthMix: assumptions.organicGrowthMix,
      marketingBudget: assumptions.monthlyMarketingBudget,
      aiEfficiencyMultiplier: assumptions.headcountProductivity,
      
      startingCash,
      ...overrides,
    };
  }, [assumptions, currentScenarioData, startingCash, overrides]);
  
  // Calculate financial projections
  const projections = useMemo((): FinancialProjection => {
    const months = 36;
    const years = 3;
    
    // Monthly growth factor
    const monthlyGrowth = 1 + (drivers.creatorGrowth / 100);
    const monthlyChurn = drivers.churn / 100;
    const pricingMultiplier = 1 + (drivers.pricingSensitivity / 100);
    
    // Initialize monthly arrays
    const monthlyRevenue: number[] = [];
    const monthlyCogs: number[] = [];
    const monthlyOpex: number[] = [];
    const monthlyGrossProfit: number[] = [];
    const monthlyEbitda: number[] = [];
    const cumulativeEbitda: number[] = [];
    
    // Calculate monthly values
    for (let month = 0; month < months; month++) {
      const yearIndex = Math.floor(month / 12);
      const monthInYear = month % 12;
      
      // Revenue calculation with growth and churn impact
      const growthFactor = Math.pow(monthlyGrowth, month);
      const churnImpact = Math.pow(1 - monthlyChurn, month);
      
      // Base monthly revenue from yearly projections
      const baseSubscription = (drivers.subscriptionRevenue[yearIndex] || 0) / 12;
      const baseAdvertising = (drivers.advertisingRevenue[yearIndex] || 0) / 12;
      
      // Apply growth, churn, and pricing
      const subscriptionRev = baseSubscription * growthFactor * churnImpact * pricingMultiplier;
      const advertisingRev = baseAdvertising * (drivers.marketplaceFillRate / 65) * (drivers.cpm / 22);
      
      // Identity verification revenue boost
      const verificationBoost = 1 + (drivers.identityVerificationAdoption / 100) * 0.15;
      
      const totalRevenue = (subscriptionRev + advertisingRev) * verificationBoost;
      monthlyRevenue.push(totalRevenue);
      
      // COGS calculation
      const estimatedUsers = 1000 * growthFactor * churnImpact;
      const hostingCost = estimatedUsers * (drivers.hostingCostPerUser / 12) * drivers.bandwidthMultiplier;
      const aiCost = estimatedUsers * 5 * drivers.aiInferenceCostPerMin * drivers.aiUsageMultiplier; // 5 mins avg per user
      const paymentCost = totalRevenue * (drivers.paymentProcessingFee / 100);
      
      const totalCogs = hostingCost + aiCost + paymentCost;
      monthlyCogs.push(totalCogs);
      
      // Gross Profit
      const grossProfit = totalRevenue - totalCogs;
      monthlyGrossProfit.push(grossProfit);
      
      // OpEx calculation
      const baseOpex = [64000, 100000, 150000][yearIndex] || 150000; // Monthly base OpEx
      const productivityAdjusted = baseOpex / drivers.headcountProductivity;
      const marketingCost = drivers.marketingBudget;
      
      const totalOpex = (productivityAdjusted + marketingCost) / drivers.aiEfficiencyMultiplier;
      monthlyOpex.push(totalOpex);
      
      // EBITDA
      const ebitda = grossProfit - totalOpex;
      monthlyEbitda.push(ebitda);
      
      // Cumulative EBITDA
      const prevCumulative = month > 0 ? cumulativeEbitda[month - 1] : 0;
      cumulativeEbitda.push(prevCumulative + ebitda);
    }
    
    // Find break-even month
    let breakEvenMonth: number | null = null;
    let cumulative = drivers.startingCash;
    for (let month = 0; month < months; month++) {
      cumulative += monthlyEbitda[month];
      if (cumulative > 0 && monthlyEbitda[month] > 0 && breakEvenMonth === null) {
        breakEvenMonth = month + 1;
      }
    }
    
    // Calculate runway
    const avgBurn = monthlyEbitda.slice(0, 12).reduce((a, b) => a + b, 0) / 12;
    const runwayMonths = avgBurn < 0 ? drivers.startingCash / Math.abs(avgBurn) : 36;
    
    // CAC/LTV calculations
    const blendedCAC = (drivers.cacPaid * (100 - drivers.organicGrowthMix) / 100) + 
                       (drivers.cacOrganic * drivers.organicGrowthMix / 100);
    const ltv = drivers.churn > 0 ? (drivers.arpu / (drivers.churn / 100)) : drivers.arpu * 24;
    const ltvCacRatio = blendedCAC > 0 ? ltv / blendedCAC : 0;
    const paybackPeriod = blendedCAC > 0 ? blendedCAC / drivers.arpu : 0;
    
    // Aggregate yearly values
    const yearlyRevenue: number[] = [];
    const yearlyCogs: number[] = [];
    const yearlyOpex: number[] = [];
    const yearlyGrossProfit: number[] = [];
    const yearlyEbitda: number[] = [];
    const yearlyGrossMargin: number[] = [];
    const yearlyEbitdaMargin: number[] = [];
    
    for (let year = 0; year < years; year++) {
      const startMonth = year * 12;
      const endMonth = startMonth + 12;
      
      const yearRev = monthlyRevenue.slice(startMonth, endMonth).reduce((a, b) => a + b, 0);
      const yearCogs = monthlyCogs.slice(startMonth, endMonth).reduce((a, b) => a + b, 0);
      const yearOpex = monthlyOpex.slice(startMonth, endMonth).reduce((a, b) => a + b, 0);
      const yearGross = monthlyGrossProfit.slice(startMonth, endMonth).reduce((a, b) => a + b, 0);
      const yearEbitda = monthlyEbitda.slice(startMonth, endMonth).reduce((a, b) => a + b, 0);
      
      yearlyRevenue.push(yearRev);
      yearlyCogs.push(yearCogs);
      yearlyOpex.push(yearOpex);
      yearlyGrossProfit.push(yearGross);
      yearlyEbitda.push(yearEbitda);
      yearlyGrossMargin.push(yearRev > 0 ? (yearGross / yearRev) * 100 : 0);
      yearlyEbitdaMargin.push(yearRev > 0 ? (yearEbitda / yearRev) * 100 : 0);
    }
    
    // Identity verification revenue
    const verifiedCreatorRevenue = yearlyRevenue.map((rev, i) => {
      const adoptionRate = Math.min(drivers.identityVerificationAdoption + (i * 10), 100);
      return rev * (adoptionRate / 100) * 0.15; // 15% premium from verified creators
    });
    
    return {
      monthlyRevenue,
      monthlyCogs,
      monthlyOpex,
      monthlyGrossProfit,
      monthlyEbitda,
      cumulativeEbitda,
      yearlyRevenue,
      yearlyCogs,
      yearlyOpex,
      yearlyGrossProfit,
      yearlyEbitda,
      yearlyGrossMargin,
      yearlyEbitdaMargin,
      breakEvenMonth,
      runwayMonths: Math.round(Math.min(runwayMonths, 36)),
      ltv,
      cac: blendedCAC,
      ltvCacRatio,
      paybackPeriod,
      verifiedCreatorRevenue,
      verificationAdoptionRate: drivers.identityVerificationAdoption,
    };
  }, [drivers]);
  
  return {
    drivers,
    projections,
  };
}

export { DEFAULT_DRIVERS };
