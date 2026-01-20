// Extended Veteran Calculator Functions
// Additional calculations for all new calculators

// VA Combined Rating Calculator using "whole person" method
export interface VACombinedRatingInput {
  ratings: number[];
  hasBilateralFactor: boolean;
}

export interface VACombinedRatingResult {
  combinedRatingPercent: number;
  roundedCombinedRating: number;
  bilateralFactorApplied: boolean;
  explanation: string;
}

export function calculateVACombinedRating(input: VACombinedRatingInput): VACombinedRatingResult {
  // Sort ratings from highest to lowest
  const sortedRatings = [...input.ratings].sort((a, b) => b - a);
  
  // VA "whole person" method: each rating applies to remaining efficiency
  let remainingEfficiency = 100;
  
  for (const rating of sortedRatings) {
    const disability = (remainingEfficiency * rating) / 100;
    remainingEfficiency -= disability;
  }
  
  let combinedPercent = 100 - remainingEfficiency;
  
  // Apply bilateral factor (10% of bilateral ratings added)
  if (input.hasBilateralFactor) {
    combinedPercent *= 1.10;
  }
  
  // Round to nearest 10
  const rounded = Math.round(combinedPercent / 10) * 10;
  
  return {
    combinedRatingPercent: parseFloat(combinedPercent.toFixed(1)),
    roundedCombinedRating: Math.min(100, rounded),
    bilateralFactorApplied: input.hasBilateralFactor,
    explanation: `Using VA's "whole person" method, your combined rating is ${combinedPercent.toFixed(1)}%, rounded to ${rounded}%.`,
  };
}

// VA Monthly Compensation Estimator
// 2024 VA compensation rates (simplified)
const VA_COMPENSATION_RATES_2024: Record<number, { single: number; married: number }> = {
  10: { single: 171.23, married: 171.23 },
  20: { single: 338.49, married: 338.49 },
  30: { single: 524.31, married: 586.31 },
  40: { single: 755.28, married: 839.28 },
  50: { single: 1075.16, married: 1180.16 },
  60: { single: 1361.88, married: 1487.88 },
  70: { single: 1716.28, married: 1863.28 },
  80: { single: 1995.01, married: 2163.01 },
  90: { single: 2241.91, married: 2430.91 },
  100: { single: 3737.85, married: 3946.25 },
};

export interface VACompensationInput {
  combinedRating: number;
  maritalStatus: 'Single' | 'Married';
  hasDependentParents: boolean;
  childCount: number;
}

export interface VACompensationResult {
  estimatedMonthlyCompensation: number;
  dependencyBreakdown: string;
  annualCompensation: number;
}

export function calculateVACompensation(input: VACompensationInput): VACompensationResult {
  const roundedRating = Math.round(input.combinedRating / 10) * 10;
  const rates = VA_COMPENSATION_RATES_2024[roundedRating] || { single: 0, married: 0 };
  
  let base = input.maritalStatus === 'Married' ? rates.married : rates.single;
  
  // Add for dependent parents (simplified: ~$40-80 per parent for 30%+ ratings)
  let parentAdd = 0;
  if (input.hasDependentParents && roundedRating >= 30) {
    parentAdd = 75;
  }
  
  // Add for children (simplified: ~$30-100 per child based on rating)
  let childAdd = 0;
  if (roundedRating >= 30) {
    childAdd = input.childCount * 50;
  }
  
  const total = base + parentAdd + childAdd;
  
  const breakdown = [];
  if (input.maritalStatus === 'Married') breakdown.push('Married veteran rate');
  if (parentAdd > 0) breakdown.push('Dependent parent(s)');
  if (childAdd > 0) breakdown.push(`${input.childCount} child(ren)`);
  
  return {
    estimatedMonthlyCompensation: parseFloat(total.toFixed(2)),
    dependencyBreakdown: breakdown.length ? breakdown.join(', ') : 'Base single rate',
    annualCompensation: parseFloat((total * 12).toFixed(2)),
  };
}

// FERS Pension Estimator
export interface FERSPensionInput {
  high3Salary: number;
  yearsOfService: number;
  retiringAt62PlusWith20: boolean;
}

export interface FERSPensionResult {
  annualPension: number;
  monthlyPension: number;
  multiplierUsed: string;
}

export function calculateFERSPension(input: FERSPensionInput): FERSPensionResult {
  // FERS uses 1% for most, 1.1% if 62+ with 20+ years
  const multiplier = input.retiringAt62PlusWith20 ? 0.011 : 0.01;
  const annualPension = input.high3Salary * input.yearsOfService * multiplier;
  
  return {
    annualPension: parseFloat(annualPension.toFixed(2)),
    monthlyPension: parseFloat((annualPension / 12).toFixed(2)),
    multiplierUsed: input.retiringAt62PlusWith20 ? '1.1% per year' : '1.0% per year',
  };
}

// TSP Growth Calculator
export interface TSPGrowthInput {
  currentBalance: number;
  monthlyContribution: number;
  employerMatchPercent: number;
  annualReturnRate: number;
  yearsUntilRetirement: number;
}

export interface TSPGrowthResult {
  projectedBalanceAtRetirement: number;
  totalContributions: number;
  totalGrowth: number;
}

export function calculateTSPGrowth(input: TSPGrowthInput): TSPGrowthResult {
  const monthlyRate = input.annualReturnRate / 100 / 12;
  const months = input.yearsUntilRetirement * 12;
  const monthlyTotal = input.monthlyContribution * (1 + (input.employerMatchPercent / 100));
  
  // Future value formula with regular contributions
  let balance = input.currentBalance || 0;
  let totalContributions = input.currentBalance || 0;
  
  for (let i = 0; i < months; i++) {
    balance = balance * (1 + monthlyRate) + monthlyTotal;
    totalContributions += monthlyTotal;
  }
  
  return {
    projectedBalanceAtRetirement: parseFloat(balance.toFixed(2)),
    totalContributions: parseFloat(totalContributions.toFixed(2)),
    totalGrowth: parseFloat((balance - totalContributions).toFixed(2)),
  };
}

// Separation Readiness Score
export interface SeparationReadinessInput {
  monthsUntilSeparation: number;
  hasIntentToFile: boolean;
  claimsStarted: boolean;
  hasTransitionCounseling: boolean;
  hasPostSeparationPlan: boolean;
}

export interface SeparationReadinessResult {
  readinessScorePercent: number;
  readinessLevel: 'Critical' | 'Behind' | 'On Track' | 'Ahead';
  recommendedActions: string[];
}

export function calculateSeparationReadiness(input: SeparationReadinessInput): SeparationReadinessResult {
  let score = 0;
  const recommendations: string[] = [];
  
  if (input.hasIntentToFile) {
    score += 25;
  } else {
    recommendations.push('File your Intent to File to preserve your effective date');
  }
  
  if (input.claimsStarted) {
    score += 25;
  } else if (input.monthsUntilSeparation < 12) {
    recommendations.push('Start gathering evidence for your VA claims');
  }
  
  if (input.hasTransitionCounseling) {
    score += 25;
  } else {
    recommendations.push('Complete TAP or equivalent transition counseling');
  }
  
  if (input.hasPostSeparationPlan) {
    score += 25;
  } else {
    recommendations.push('Develop your post-separation employment or education plan');
  }
  
  // Adjust based on timeline
  if (input.monthsUntilSeparation < 6 && score < 75) {
    recommendations.unshift('URGENT: You\'re less than 6 months out - prioritize these items immediately');
  }
  
  let level: SeparationReadinessResult['readinessLevel'];
  if (score >= 75) level = 'Ahead';
  else if (score >= 50) level = 'On Track';
  else if (score >= 25) level = 'Behind';
  else level = 'Critical';
  
  return {
    readinessScorePercent: score,
    readinessLevel: level,
    recommendedActions: recommendations,
  };
}

// Leave Sell-Back Calculator
export interface LeaveSellBackInput {
  unusedLeaveDays: number;
  basePayPerMonth: number;
  federalTaxRate: number;
}

export interface LeaveSellBackResult {
  grossSellBackAmount: number;
  estimatedTaxes: number;
  netSellBackAmount: number;
}

export function calculateLeaveSellBack(input: LeaveSellBackInput): LeaveSellBackResult {
  // Daily rate = monthly base pay / 30
  const dailyRate = input.basePayPerMonth / 30;
  // Max 60 days can be sold
  const sellableDays = Math.min(input.unusedLeaveDays, 60);
  const gross = dailyRate * sellableDays;
  
  const taxRate = (input.federalTaxRate || 22) / 100;
  const taxes = gross * taxRate;
  
  return {
    grossSellBackAmount: parseFloat(gross.toFixed(2)),
    estimatedTaxes: parseFloat(taxes.toFixed(2)),
    netSellBackAmount: parseFloat((gross - taxes).toFixed(2)),
  };
}

// SBP Calculator
export interface SBPInput {
  grossRetiredPay: number;
  coverageBasePercent: number;
  sbpPremiumRatePercent: number;
}

export interface SBPResult {
  monthlyPremium: number;
  monthlySurvivorBenefit: number;
  annualPremium: number;
}

export function calculateSBP(input: SBPInput): SBPResult {
  const coverageBase = input.grossRetiredPay * (input.coverageBasePercent / 100);
  const premium = coverageBase * (input.sbpPremiumRatePercent / 100);
  const survivorBenefit = coverageBase * 0.55; // SBP pays 55% of base amount
  
  return {
    monthlyPremium: parseFloat(premium.toFixed(2)),
    monthlySurvivorBenefit: parseFloat(survivorBenefit.toFixed(2)),
    annualPremium: parseFloat((premium * 12).toFixed(2)),
  };
}

// Insurance Needs Estimator
export interface InsuranceNeedsInput {
  annualIncome: number;
  yearsOfIncomeReplacement: number;
  outstandingDebt: number;
  mortgageBalance: number;
  currentCoverage: number;
}

export interface InsuranceNeedsResult {
  recommendedTotalCoverage: number;
  additionalCoverageNeeded: number;
}

export function calculateInsuranceNeeds(input: InsuranceNeedsInput): InsuranceNeedsResult {
  const incomeReplacement = input.annualIncome * input.yearsOfIncomeReplacement;
  const totalNeeds = incomeReplacement + (input.outstandingDebt || 0) + (input.mortgageBalance || 0);
  const additional = Math.max(0, totalNeeds - (input.currentCoverage || 0));
  
  return {
    recommendedTotalCoverage: parseFloat(totalNeeds.toFixed(2)),
    additionalCoverageNeeded: parseFloat(additional.toFixed(2)),
  };
}

// GI Bill Estimator
export interface GIBillInput {
  serviceTimeMonths: number;
  schoolType: 'Public' | 'Private' | 'Foreign' | 'Online';
  zipCode?: string;
}

export interface GIBillResult {
  tuitionCoveragePercent: number;
  estimatedMonthlyHousingAllowance: number;
  booksStipendEstimate: number;
}

export function calculateGIBill(input: GIBillInput): GIBillResult {
  // Percentage based on service time
  let percent = 40; // Minimum
  if (input.serviceTimeMonths >= 36) percent = 100;
  else if (input.serviceTimeMonths >= 30) percent = 90;
  else if (input.serviceTimeMonths >= 24) percent = 80;
  else if (input.serviceTimeMonths >= 18) percent = 70;
  else if (input.serviceTimeMonths >= 12) percent = 60;
  else if (input.serviceTimeMonths >= 6) percent = 50;
  
  // Estimated housing (national average E-5 BAH)
  let housing = 1800;
  if (input.schoolType === 'Online') housing = housing * 0.5;
  housing = housing * (percent / 100);
  
  // Books stipend
  const books = 1000 * (percent / 100);
  
  return {
    tuitionCoveragePercent: percent,
    estimatedMonthlyHousingAllowance: parseFloat(housing.toFixed(2)),
    booksStipendEstimate: parseFloat(books.toFixed(2)),
  };
}

// COLA Estimator
export interface COLAInput {
  currentBenefit: number;
  expectedColaPercent: number;
  years: number;
}

export interface COLAResult {
  projectedMonthlyBenefit: number;
  projectedAnnualBenefit: number;
  totalIncreaseOverPeriod: number;
}

export function calculateCOLA(input: COLAInput): COLAResult {
  const rate = 1 + (input.expectedColaPercent / 100);
  const projectedMonthly = input.currentBenefit * Math.pow(rate, input.years);
  const increase = projectedMonthly - input.currentBenefit;
  
  return {
    projectedMonthlyBenefit: parseFloat(projectedMonthly.toFixed(2)),
    projectedAnnualBenefit: parseFloat((projectedMonthly * 12).toFixed(2)),
    totalIncreaseOverPeriod: parseFloat((increase * 12 * input.years / 2).toFixed(2)), // Rough total
  };
}

// VA Travel Reimbursement
export interface VATravelInput {
  oneWayMiles: number;
  roundTripsPerMonth: number;
  mileageRate?: number;
}

export interface VATravelResult {
  reimbursementPerTrip: number;
  reimbursementPerMonth: number;
  reimbursementPerYear: number;
}

export function calculateVATravel(input: VATravelInput): VATravelResult {
  const rate = input.mileageRate || 0.415; // 2024 VA rate
  const tripMiles = input.oneWayMiles * 2;
  const perTrip = tripMiles * rate;
  const perMonth = perTrip * (input.roundTripsPerMonth || 1);
  
  return {
    reimbursementPerTrip: parseFloat(perTrip.toFixed(2)),
    reimbursementPerMonth: parseFloat(perMonth.toFixed(2)),
    reimbursementPerYear: parseFloat((perMonth * 12).toFixed(2)),
  };
}

// BRS vs Legacy Comparison
export interface BRSComparisonInput {
  yearsOfServiceAtSeparation: number;
  basePayAtSeparation: number;
  tspContributionPercent: number;
  expectedReturnRate: number;
}

export interface BRSComparisonResult {
  legacyPensionEstimate: number;
  brsPensionEstimate: number;
  brsTspProjectedBalance: number;
  highLevelComparisonSummary: string;
}

export function calculateBRSComparison(input: BRSComparisonInput): BRSComparisonResult {
  // Legacy: 2.5% per year
  const legacyMultiplier = input.yearsOfServiceAtSeparation >= 20 ? input.yearsOfServiceAtSeparation * 0.025 : 0;
  const legacyPension = input.basePayAtSeparation * legacyMultiplier * 12;
  
  // BRS: 2.0% per year + TSP
  const brsMultiplier = input.yearsOfServiceAtSeparation >= 20 ? input.yearsOfServiceAtSeparation * 0.02 : 0;
  const brsPension = input.basePayAtSeparation * brsMultiplier * 12;
  
  // Simplified TSP projection (assumes contributions over full career)
  const monthlyContrib = input.basePayAtSeparation * (input.tspContributionPercent / 100);
  const monthlyMatch = input.basePayAtSeparation * 0.05; // 5% match
  const months = input.yearsOfServiceAtSeparation * 12;
  const rate = (input.expectedReturnRate || 7) / 100 / 12;
  
  let tspBalance = 0;
  for (let i = 0; i < months; i++) {
    tspBalance = tspBalance * (1 + rate) + monthlyContrib + monthlyMatch;
  }
  
  let summary = '';
  if (input.yearsOfServiceAtSeparation < 20) {
    summary = 'With less than 20 years, BRS is generally better due to continuation pay and vested TSP matching.';
  } else {
    const legacyTotal = legacyPension * 20;
    const brsTotal = brsPension * 20 + tspBalance;
    if (brsTotal > legacyTotal) {
      summary = 'BRS appears more favorable when combining pension and TSP growth.';
    } else {
      summary = 'Legacy may provide higher guaranteed income, but BRS offers flexibility.';
    }
  }
  
  return {
    legacyPensionEstimate: parseFloat(legacyPension.toFixed(2)),
    brsPensionEstimate: parseFloat(brsPension.toFixed(2)),
    brsTspProjectedBalance: parseFloat(tspBalance.toFixed(2)),
    highLevelComparisonSummary: summary,
  };
}
