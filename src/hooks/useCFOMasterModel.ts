import { useMemo, useCallback, useState } from 'react';

// =========================================
// CFO MASTER MODEL - Single Source of Truth
// =========================================

export type ScenarioType = 'base' | 'conservative' | 'aggressive';

export interface YearlyValues {
  year1: number;
  year2: number;
  year3: number;
}

export interface RevenueModel {
  saasSubscriptions: number[];
  aiProductionTools: number[];
  advertisingMarketplace: number[];
  enterpriseLicensing: number[];
}

export interface COGSModel {
  hostingBandwidth: number[];
  aiInference: number[];
  paymentProcessing: number[];
}

export interface OpExModel {
  productEngineering: number[];
  salesMarketing: number[];
  generalAdmin: number[];
  customerSuccess: number[];
  contractorsAI: number[];
}

export interface HeadcountRow {
  department: string;
  year1: number;
  year2: number;
  year3: number;
  avgSalary: number;
}

export interface CFOAssumptions {
  // Revenue
  monthlyCreatorGrowth: number;
  avgRevenuePerCreator: number;
  advertisingCPM: number;
  adFillRate: number;
  churnRate: number;
  pricingSensitivity: number;
  organicGrowthMix: number;
  enterpriseDealValue: number;
  // COGS
  hostingCostPerUser: number;
  bandwidthMultiplier: number;
  aiInferenceCostPerMin: number;
  paymentProcessingFee: number;
  aiUsageMultiplier: number;
  // OpEx
  monthlyMarketingBudget: number;
  cacPaid: number;
  proTierArpu: number;
  opexChurn: number;
  headcountProductivity: number;
  // Headcount
  salaryInflation: number;
  hiringRampSpeed: number;
  contractorToEmployee: boolean;
  // Legacy
  cacOrganic: number;
  grossMarginTarget: number;
  aiToolsAdoption: number;
}

export interface ScenarioMultipliers {
  revenueGrowth: number;   // e.g., 1.3 for +30%
  cpm: number;
  fillRate: number;
  churn: number;           // 0.75 means -25% churn (lower churn)
  cac: number;
  opex: number;
}

export interface KeyMetrics {
  totalRevenue: number[];
  totalCogs: number[];
  totalOpex: number[];
  grossProfit: number[];
  grossMargin: number[];
  ebitda: number[];
  arr: number[];
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  burnRate: number[];
  runway: number;
  breakEvenMonth: number | null;
}

const YEARS = [2025, 2026, 2027];

// Scenario multiplier configurations
const SCENARIO_MULTIPLIERS: Record<ScenarioType, ScenarioMultipliers> = {
  base: {
    revenueGrowth: 1.0,
    cpm: 1.0,
    fillRate: 1.0,
    churn: 1.0,
    cac: 1.0,
    opex: 1.0,
  },
  conservative: {
    revenueGrowth: 0.7,   // -30%
    cpm: 0.85,            // -15%
    fillRate: 0.8,        // -20%
    churn: 1.25,          // +25% (higher churn = worse)
    cac: 1.15,            // +15% (higher CAC = worse)
    opex: 1.1,            // +10%
  },
  aggressive: {
    revenueGrowth: 1.3,   // +30%
    cpm: 1.15,            // +15%
    fillRate: 1.25,       // +25%
    churn: 0.75,          // -25% (lower churn = better)
    cac: 0.85,            // -15% (lower CAC = better)
    opex: 0.9,            // -10%
  },
};

export function getScenarioMultiplierDisplay(scenario: ScenarioType, metric: keyof ScenarioMultipliers): string {
  const mult = SCENARIO_MULTIPLIERS[scenario][metric];
  if (scenario === 'base') return '0% (Baseline)';
  const pct = (mult - 1) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
}

const DEFAULT_ASSUMPTIONS: CFOAssumptions = {
  monthlyCreatorGrowth: 8,
  avgRevenuePerCreator: 45,
  advertisingCPM: 22,
  adFillRate: 65,
  churnRate: 5,
  pricingSensitivity: 0,
  organicGrowthMix: 30,
  enterpriseDealValue: 150000,
  hostingCostPerUser: 12,
  bandwidthMultiplier: 1.0,
  aiInferenceCostPerMin: 0.005,
  paymentProcessingFee: 3,
  aiUsageMultiplier: 1.0,
  monthlyMarketingBudget: 10000,
  cacPaid: 85,
  proTierArpu: 29,
  opexChurn: 5,
  headcountProductivity: 1.0,
  salaryInflation: 5,
  hiringRampSpeed: 1.0,
  contractorToEmployee: false,
  cacOrganic: 15,
  grossMarginTarget: 70,
  aiToolsAdoption: 35,
};

const DEFAULT_REVENUE: RevenueModel = {
  saasSubscriptions: [480000, 1200000, 2400000],
  aiProductionTools: [120000, 420000, 960000],
  advertisingMarketplace: [180000, 720000, 1800000],
  enterpriseLicensing: [0, 150000, 500000],
};

const DEFAULT_COGS: COGSModel = {
  hostingBandwidth: [48000, 96000, 180000],
  aiInference: [36000, 84000, 192000],
  paymentProcessing: [24000, 60000, 144000],
};

const DEFAULT_OPEX: OpExModel = {
  productEngineering: [360000, 540000, 720000],
  salesMarketing: [180000, 360000, 540000],
  generalAdmin: [120000, 180000, 240000],
  customerSuccess: [60000, 120000, 180000],
  contractorsAI: [48000, 72000, 96000],
};

const DEFAULT_HEADCOUNT: HeadcountRow[] = [
  { department: 'Engineering', year1: 4, year2: 7, year3: 12, avgSalary: 120000 },
  { department: 'Product', year1: 2, year2: 3, year3: 5, avgSalary: 110000 },
  { department: 'Sales', year1: 2, year2: 4, year3: 8, avgSalary: 90000 },
  { department: 'Marketing', year1: 1, year2: 2, year3: 4, avgSalary: 85000 },
  { department: 'Customer Success', year1: 1, year2: 2, year3: 4, avgSalary: 75000 },
  { department: 'G&A', year1: 2, year2: 3, year3: 4, avgSalary: 95000 },
];

export function useCFOMasterModel() {
  // Core state - represents CFO's baseline assumptions
  const [assumptions, setAssumptions] = useState<CFOAssumptions>(DEFAULT_ASSUMPTIONS);
  const [revenue, setRevenue] = useState<RevenueModel>(DEFAULT_REVENUE);
  const [cogs, setCogs] = useState<COGSModel>(DEFAULT_COGS);
  const [opex, setOpex] = useState<OpExModel>(DEFAULT_OPEX);
  const [headcount, setHeadcount] = useState<HeadcountRow[]>(DEFAULT_HEADCOUNT);
  const [enterpriseEnabled, setEnterpriseEnabled] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('base');
  const [startingCash, setStartingCash] = useState(500000);

  // Calculate adjusted values for a given scenario
  const calculateForScenario = useCallback((scenario: ScenarioType) => {
    const mult = SCENARIO_MULTIPLIERS[scenario];
    
    // Apply scenario multipliers to assumptions
    const scenarioAssumptions = {
      ...assumptions,
      monthlyCreatorGrowth: assumptions.monthlyCreatorGrowth * mult.revenueGrowth,
      advertisingCPM: assumptions.advertisingCPM * mult.cpm,
      adFillRate: assumptions.adFillRate * mult.fillRate,
      churnRate: assumptions.churnRate * mult.churn,
      cacPaid: assumptions.cacPaid * mult.cac,
    };

    // Calculate adjusted revenue
    const growthMultiplier = 1 + (scenarioAssumptions.monthlyCreatorGrowth / 100);
    const pricingMultiplier = 1 + (scenarioAssumptions.pricingSensitivity / 100);
    const churnImpact = 1 - (scenarioAssumptions.churnRate / 100);

    const adjustedRevenue = {
      saasSubscriptions: revenue.saasSubscriptions.map((v, i) => 
        Math.round(v * Math.pow(growthMultiplier, i) * pricingMultiplier * churnImpact * mult.revenueGrowth)
      ),
      aiProductionTools: revenue.aiProductionTools.map((v, i) =>
        Math.round(v * (scenarioAssumptions.aiToolsAdoption / 35) * Math.pow(growthMultiplier, i) * mult.revenueGrowth)
      ),
      advertisingMarketplace: revenue.advertisingMarketplace.map((v, i) =>
        Math.round(v * (scenarioAssumptions.advertisingCPM / 22) * (scenarioAssumptions.adFillRate / 65) * Math.pow(growthMultiplier, i))
      ),
      enterpriseLicensing: enterpriseEnabled 
        ? [0, scenarioAssumptions.enterpriseDealValue, scenarioAssumptions.enterpriseDealValue * 3.33]
        : [0, 0, 0],
    };

    // Calculate total revenue per year
    const totalRevenue = YEARS.map((_, i) => 
      adjustedRevenue.saasSubscriptions[i] + 
      adjustedRevenue.aiProductionTools[i] + 
      adjustedRevenue.advertisingMarketplace[i] + 
      adjustedRevenue.enterpriseLicensing[i]
    );

    // Calculate adjusted COGS
    const adjustedCogs = {
      hostingBandwidth: cogs.hostingBandwidth.map((v) =>
        Math.round(v * (scenarioAssumptions.hostingCostPerUser / 12) * scenarioAssumptions.bandwidthMultiplier)
      ),
      aiInference: cogs.aiInference.map((v) =>
        Math.round(v * (scenarioAssumptions.aiInferenceCostPerMin / 0.005) * scenarioAssumptions.aiUsageMultiplier)
      ),
      paymentProcessing: totalRevenue.map(rev =>
        Math.round(rev * (scenarioAssumptions.paymentProcessingFee / 100))
      ),
    };

    const totalCogs = YEARS.map((_, i) => 
      adjustedCogs.hostingBandwidth[i] + adjustedCogs.aiInference[i] + adjustedCogs.paymentProcessing[i]
    );

    // Calculate adjusted OpEx
    const productivityFactor = scenarioAssumptions.headcountProductivity;
    const marketingBudgetRatio = scenarioAssumptions.monthlyMarketingBudget / 10000;

    const adjustedOpex = {
      productEngineering: opex.productEngineering.map(v => Math.round(v / productivityFactor * mult.opex)),
      salesMarketing: opex.salesMarketing.map(v => Math.round(v * marketingBudgetRatio * mult.opex)),
      generalAdmin: opex.generalAdmin.map(v => Math.round(v / productivityFactor * mult.opex)),
      customerSuccess: opex.customerSuccess.map(v => Math.round(v / productivityFactor * mult.opex)),
      contractorsAI: assumptions.contractorToEmployee 
        ? opex.contractorsAI.map(v => Math.round(v * 1.2 * mult.opex))
        : opex.contractorsAI.map(v => Math.round(v * mult.opex)),
    };

    const totalOpex = YEARS.map((_, i) =>
      adjustedOpex.productEngineering[i] + adjustedOpex.salesMarketing[i] + adjustedOpex.generalAdmin[i] +
      adjustedOpex.customerSuccess[i] + adjustedOpex.contractorsAI[i]
    );

    // Calculate P&L metrics
    const grossProfit = totalRevenue.map((rev, i) => rev - totalCogs[i]);
    const grossMargin = totalRevenue.map((rev, i) => rev > 0 ? (grossProfit[i] / rev) * 100 : 0);
    const ebitda = grossProfit.map((gp, i) => gp - totalOpex[i]);
    const burnRate = ebitda.map(e => e < 0 ? Math.abs(e) / 12 : 0);

    // CAC/LTV calculations
    const blendedCAC = (scenarioAssumptions.cacPaid * (100 - scenarioAssumptions.organicGrowthMix) / 100) + 
                       (scenarioAssumptions.cacOrganic * scenarioAssumptions.organicGrowthMix / 100);
    const avgMonthlyRevenue = scenarioAssumptions.proTierArpu;
    const churnRate = scenarioAssumptions.churnRate / 100;
    const ltv = churnRate > 0 ? avgMonthlyRevenue / churnRate : avgMonthlyRevenue * 24;
    const ltvCacRatio = blendedCAC > 0 ? ltv / blendedCAC : 0;

    // Find breakeven month
    let breakEvenMonth: number | null = null;
    let cumulative = 0;
    for (let month = 1; month <= 36; month++) {
      const yearIndex = Math.floor((month - 1) / 12);
      const monthlyEbitda = ebitda[yearIndex] / 12;
      cumulative += monthlyEbitda;
      if (cumulative > 0 && breakEvenMonth === null) {
        breakEvenMonth = month;
        break;
      }
    }

    const currentBurn = burnRate[0];
    const runway = currentBurn > 0 ? startingCash / currentBurn : 36;

    return {
      revenue: adjustedRevenue,
      cogs: adjustedCogs,
      opex: adjustedOpex,
      metrics: {
        totalRevenue,
        totalCogs,
        totalOpex,
        grossProfit,
        grossMargin,
        ebitda,
        arr: totalRevenue,
        cac: blendedCAC,
        ltv,
        ltvCacRatio,
        burnRate,
        runway: Math.min(runway, 36),
        breakEvenMonth,
      } as KeyMetrics,
    };
  }, [assumptions, revenue, cogs, opex, enterpriseEnabled, startingCash]);

  // Get current scenario data
  const currentScenarioData = useMemo(() => {
    return calculateForScenario(selectedScenario);
  }, [selectedScenario, calculateForScenario]);

  // Get base scenario metrics (always needed for comparison)
  const baseMetrics = useMemo(() => {
    return calculateForScenario('base');
  }, [calculateForScenario]);

  // Get all scenario data for comparison
  const allScenarios = useMemo(() => ({
    base: calculateForScenario('base'),
    conservative: calculateForScenario('conservative'),
    aggressive: calculateForScenario('aggressive'),
  }), [calculateForScenario]);

  // Update handlers
  const updateAssumption = useCallback(<K extends keyof CFOAssumptions>(key: K, value: CFOAssumptions[K]) => {
    setAssumptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateRevenue = useCallback((key: keyof RevenueModel, yearIndex: number, value: number) => {
    setRevenue(prev => ({
      ...prev,
      [key]: prev[key].map((v, i) => i === yearIndex ? value : v)
    }));
  }, []);

  const updateCogs = useCallback((key: keyof COGSModel, yearIndex: number, value: number) => {
    setCogs(prev => ({
      ...prev,
      [key]: prev[key].map((v, i) => i === yearIndex ? value : v)
    }));
  }, []);

  const updateOpex = useCallback((key: keyof OpExModel, yearIndex: number, value: number) => {
    setOpex(prev => ({
      ...prev,
      [key]: prev[key].map((v, i) => i === yearIndex ? value : v)
    }));
  }, []);

  const updateHeadcount = useCallback((index: number, field: 'year1' | 'year2' | 'year3' | 'avgSalary', value: number) => {
    setHeadcount(prev => prev.map((row, i) => 
      i === index ? { ...row, [field]: value } : row
    ));
  }, []);

  return {
    // State
    assumptions,
    revenue,
    cogs,
    opex,
    headcount,
    enterpriseEnabled,
    selectedScenario,
    startingCash,
    
    // Calculated data
    currentScenarioData,
    baseMetrics,
    allScenarios,
    
    // Multiplier helpers
    scenarioMultipliers: SCENARIO_MULTIPLIERS,
    getMultiplierDisplay: (metric: keyof ScenarioMultipliers) => getScenarioMultiplierDisplay(selectedScenario, metric),
    
    // Setters
    setSelectedScenario,
    setEnterpriseEnabled,
    setStartingCash,
    updateAssumption,
    updateRevenue,
    updateCogs,
    updateOpex,
    updateHeadcount,
    calculateForScenario,
    
    // Constants
    years: YEARS,
  };
}

// Export multipliers for external use
export { SCENARIO_MULTIPLIERS };
