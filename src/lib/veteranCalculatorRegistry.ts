// Veteran Calculator Registry
// Central configuration for all calculators in the Military & Federal Benefits Hub

export interface CalculatorInput {
  name: string;
  label: string;
  type: 'number' | 'text' | 'date' | 'select' | 'boolean' | 'list:number';
  required: boolean;
  default?: any;
  options?: string[];
  optionsSource?: string;
  placeholder?: string;
  helperText?: string;
}

export interface CalculatorConfig {
  id: string;
  title: string;
  route: string;
  category: 'Retirement' | 'VA Disability' | 'Transition' | 'Taxes' | 'Protection' | 'Education' | 'Healthcare' | 'Assistant';
  description: string;
  icon: string;
  color: string;
  inputs: CalculatorInput[];
  outputs: string[];
  aiSupport?: {
    enabled: boolean;
    mode: 'inline_explanation' | 'agent';
    promptHint?: string;
  };
}

export const CALCULATOR_CATEGORIES = [
  { id: 'Retirement', label: 'Retirement', icon: 'Clock', color: 'text-blue-500' },
  { id: 'VA Disability', label: 'VA Disability', icon: 'Shield', color: 'text-red-500' },
  { id: 'Transition', label: 'Transition', icon: 'ArrowRight', color: 'text-amber-500' },
  { id: 'Taxes', label: 'Taxes', icon: 'Receipt', color: 'text-green-500' },
  { id: 'Protection', label: 'Protection', icon: 'Heart', color: 'text-pink-500' },
  { id: 'Education', label: 'Education', icon: 'GraduationCap', color: 'text-purple-500' },
  { id: 'Healthcare', label: 'Healthcare', icon: 'Stethoscope', color: 'text-cyan-500' },
  { id: 'Assistant', label: 'AI Assistant', icon: 'MessageSquare', color: 'text-orange-500' },
] as const;

export const CALCULATORS: CalculatorConfig[] = [
  // Existing calculators
  {
    id: 'military_buyback',
    title: 'Military Buy-Back Calculator',
    route: '/yourbenefits/calculators/military-buyback',
    category: 'Retirement',
    description: 'Estimate the cost and long-term benefit of buying back active-duty time toward a federal retirement.',
    icon: 'DollarSign',
    color: 'text-emerald-500',
    inputs: [
      { name: 'yearsOfMilitaryService', label: 'Years of military service', type: 'number', required: true },
      { name: 'high3Salary', label: 'Estimated High-3 federal salary', type: 'number', required: true },
      { name: 'depositPercent', label: 'Deposit percent', type: 'number', required: true, default: 3 },
      { name: 'yearsUntilRetirement', label: 'Years until retirement', type: 'number', required: true },
    ],
    outputs: ['estimatedDepositAmount', 'projectedPensionIncreasePerYear', 'breakEvenYears'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'mra_calculator',
    title: 'Minimum Retirement Age (MRA) Calculator',
    route: '/yourbenefits/calculators/mra',
    category: 'Retirement',
    description: 'Find your MRA and earliest retirement eligibility window as a federal employee.',
    icon: 'Clock',
    color: 'text-blue-500',
    inputs: [
      { name: 'dateOfBirth', label: 'Date of birth', type: 'date', required: true },
      { name: 'serviceType', label: 'Service type', type: 'select', options: ['FERS', 'FERS-RAE', 'FERS-FRAE'], required: true },
      { name: 'yearsOfService', label: 'Years of creditable service', type: 'number', required: true },
    ],
    outputs: ['minimumRetirementAge', 'earliestImmediateRetirementDate', 'reducedAnnuityEligible'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'sick_leave_calculator',
    title: 'Sick Leave Credit Calculator',
    route: '/yourbenefits/calculators/sick-leave',
    category: 'Retirement',
    description: 'Estimate how unused sick leave converts into additional service credit for your FERS retirement.',
    icon: 'Heart',
    color: 'text-purple-500',
    inputs: [
      { name: 'sickLeaveHours', label: 'Unused sick leave (hours)', type: 'number', required: true },
      { name: 'currentYearsOfService', label: 'Current years of service', type: 'number', required: true },
    ],
    outputs: ['additionalServiceTime', 'revisedServiceTotal'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  
  // NEW Calculators
  {
    id: 'va_combined_rating',
    title: 'VA Combined Rating Estimator',
    route: '/yourbenefits/calculators/va-combined-rating',
    category: 'VA Disability',
    description: 'Estimate your combined VA disability rating using the VA\'s "whole person" method.',
    icon: 'Calculator',
    color: 'text-red-500',
    inputs: [
      { name: 'ratings', label: 'Individual ratings (%)', type: 'list:number', required: true, helperText: 'Enter each rating percentage, e.g., 30, 20, 10' },
      { name: 'hasBilateralFactor', label: 'Bilateral conditions?', type: 'boolean', required: false },
    ],
    outputs: ['combinedRatingPercent', 'roundedCombinedRating', 'bilateralFactorApplied'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'va_compensation_estimator',
    title: 'VA Monthly Compensation Estimator',
    route: '/yourbenefits/calculators/va-compensation',
    category: 'VA Disability',
    description: 'Estimate monthly VA disability pay based on rating and dependents.',
    icon: 'DollarSign',
    color: 'text-red-500',
    inputs: [
      { name: 'combinedRating', label: 'Combined rating (%)', type: 'number', required: true },
      { name: 'maritalStatus', label: 'Marital status', type: 'select', options: ['Single', 'Married'], required: true },
      { name: 'hasDependentParents', label: 'Dependent parents?', type: 'boolean', required: false },
      { name: 'childCount', label: 'Number of dependent children', type: 'number', required: false },
    ],
    outputs: ['estimatedMonthlyCompensation', 'dependencyBreakdown'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'fers_pension_estimator',
    title: 'FERS Pension Estimator',
    route: '/yourbenefits/calculators/fers-pension',
    category: 'Retirement',
    description: 'Estimate your FERS pension based on High-3 salary, years of service, and applicable multiplier.',
    icon: 'TrendingUp',
    color: 'text-blue-500',
    inputs: [
      { name: 'high3Salary', label: 'High-3 average salary', type: 'number', required: true },
      { name: 'yearsOfService', label: 'Years of creditable service', type: 'number', required: true },
      { name: 'retiringAt62PlusWith20', label: 'Age 62+ with 20+ years?', type: 'boolean', required: true },
    ],
    outputs: ['annualPension', 'monthlyPension', 'multiplierUsed'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'tsp_growth_calculator',
    title: 'TSP Retirement Growth Calculator',
    route: '/yourbenefits/calculators/tsp-growth',
    category: 'Retirement',
    description: 'Project your Thrift Savings Plan balance over time with contributions and assumed returns.',
    icon: 'TrendingUp',
    color: 'text-green-500',
    inputs: [
      { name: 'currentBalance', label: 'Current TSP balance', type: 'number', required: false },
      { name: 'monthlyContribution', label: 'Monthly contribution', type: 'number', required: true },
      { name: 'employerMatchPercent', label: 'Agency/service match % of salary', type: 'number', required: false },
      { name: 'annualReturnRate', label: 'Assumed annual return (%)', type: 'number', required: true },
      { name: 'yearsUntilRetirement', label: 'Years until retirement', type: 'number', required: true },
    ],
    outputs: ['projectedBalanceAtRetirement', 'totalContributions', 'totalGrowth'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'separation_readiness_score',
    title: 'Separation Readiness Score',
    route: '/yourbenefits/tools/separation-readiness',
    category: 'Transition',
    description: 'Answer a few questions to see how ready you are for separation or retirement.',
    icon: 'CheckCircle',
    color: 'text-amber-500',
    inputs: [
      { name: 'monthsUntilSeparation', label: 'Months until separation/retirement', type: 'number', required: true },
      { name: 'hasIntentToFile', label: 'Intent to File submitted?', type: 'boolean', required: true },
      { name: 'claimsStarted', label: 'Any claims already filed?', type: 'boolean', required: true },
      { name: 'hasTransitionCounseling', label: 'Completed TAP or equivalent?', type: 'boolean', required: true },
      { name: 'hasPostSeparationPlan', label: 'Post-service employment/education plan?', type: 'boolean', required: true },
    ],
    outputs: ['readinessScorePercent', 'readinessLevel', 'recommendedActions'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'leave_sellback_calculator',
    title: 'Military Leave Sell-Back Calculator',
    route: '/yourbenefits/calculators/leave-sellback',
    category: 'Transition',
    description: 'Estimate how much you\'ll receive if you sell back unused leave at separation.',
    icon: 'Calendar',
    color: 'text-amber-500',
    inputs: [
      { name: 'unusedLeaveDays', label: 'Unused leave days', type: 'number', required: true },
      { name: 'basePayPerMonth', label: 'Base pay per month', type: 'number', required: true },
      { name: 'federalTaxRate', label: 'Estimated federal tax rate (%)', type: 'number', required: false },
    ],
    outputs: ['grossSellBackAmount', 'estimatedTaxes', 'netSellBackAmount'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'state_tax_benefits_calculator',
    title: 'State Tax Benefits Estimator',
    route: '/yourbenefits/calculators/state-tax-benefits',
    category: 'Taxes',
    description: 'Estimate potential state tax savings based on location, retirement income, and disability status.',
    icon: 'MapPin',
    color: 'text-green-500',
    inputs: [
      { name: 'state', label: 'State of residence', type: 'select', optionsSource: 'usStates', required: true },
      { name: 'annualMilitaryRetirementIncome', label: 'Military retirement income (annual)', type: 'number', required: false },
      { name: 'vaDisabilityRating', label: 'VA disability rating (%)', type: 'number', required: false },
      { name: 'isPropertyOwner', label: 'Own a home in this state?', type: 'boolean', required: false },
    ],
    outputs: ['estimatedIncomeTaxSavings', 'propertyTaxBenefitFlag', 'benefitsSummary'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'sbp_calculator',
    title: 'Survivor Benefit Plan (SBP) Calculator',
    route: '/yourbenefits/calculators/sbp',
    category: 'Protection',
    description: 'Estimate SBP costs and potential survivor benefits for your spouse or dependents.',
    icon: 'Shield',
    color: 'text-pink-500',
    inputs: [
      { name: 'grossRetiredPay', label: 'Gross retired pay (monthly)', type: 'number', required: true },
      { name: 'coverageBasePercent', label: 'Coverage base (% of retired pay)', type: 'number', required: true, default: 100 },
      { name: 'sbpPremiumRatePercent', label: 'SBP premium rate (%)', type: 'number', required: true, default: 6.5 },
    ],
    outputs: ['monthlyPremium', 'monthlySurvivorBenefit'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'insurance_needs_estimator',
    title: 'Life Insurance Needs Estimator',
    route: '/yourbenefits/calculators/insurance-needs',
    category: 'Protection',
    description: 'Estimate how much life insurance you may need as you move between SGLI, VGLI, and FEGLI.',
    icon: 'Heart',
    color: 'text-pink-500',
    inputs: [
      { name: 'annualIncome', label: 'Annual income', type: 'number', required: true },
      { name: 'yearsOfIncomeReplacement', label: 'Years of income to protect', type: 'number', required: true },
      { name: 'outstandingDebt', label: 'Total debts (excluding mortgage)', type: 'number', required: false },
      { name: 'mortgageBalance', label: 'Mortgage balance', type: 'number', required: false },
      { name: 'currentCoverage', label: 'Current life insurance coverage', type: 'number', required: false },
    ],
    outputs: ['recommendedTotalCoverage', 'additionalCoverageNeeded'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'gi_bill_estimator',
    title: 'GI Bill Benefits Estimator',
    route: '/yourbenefits/calculators/gi-bill',
    category: 'Education',
    description: 'Estimate GI Bill tuition and housing benefits based on service history and school type.',
    icon: 'GraduationCap',
    color: 'text-purple-500',
    inputs: [
      { name: 'serviceTimeMonths', label: 'Qualifying active-duty months', type: 'number', required: true },
      { name: 'schoolType', label: 'School type', type: 'select', options: ['Public', 'Private', 'Foreign', 'Online'], required: true },
      { name: 'zipCode', label: 'School ZIP code', type: 'text', required: false },
    ],
    outputs: ['tuitionCoveragePercent', 'estimatedMonthlyHousingAllowance', 'booksStipendEstimate'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'champva_eligibility_checker',
    title: 'CHAMPVA Eligibility Checker',
    route: '/yourbenefits/tools/champva-eligibility',
    category: 'Healthcare',
    description: 'Quick screening to see if you or your family may qualify for CHAMPVA or other VA health benefits.',
    icon: 'Stethoscope',
    color: 'text-cyan-500',
    inputs: [
      { name: 'relationship', label: 'Relationship to veteran', type: 'select', options: ['Veteran', 'Spouse', 'Child', 'Caregiver'], required: true },
      { name: 'vaDisabilityRating', label: 'Veteran\'s VA disability rating (%)', type: 'number', required: false },
      { name: 'isDiedInLineOrServiceConnected', label: 'Veteran died in line of duty or from service-connected condition?', type: 'boolean', required: false },
    ],
    outputs: ['eligibilityLikely', 'programType', 'nextSteps'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'crsc_screening_tool',
    title: 'CRSC Screener',
    route: '/yourbenefits/tools/crsc',
    category: 'VA Disability',
    description: 'Screen for potential eligibility for Combat-Related Special Compensation.',
    icon: 'Award',
    color: 'text-red-500',
    inputs: [
      { name: 'isMilitaryRetiree', label: 'Receiving military retired pay?', type: 'boolean', required: true },
      { name: 'hasDoDRetiredPayOffset', label: 'Retired pay reduced by VA compensation?', type: 'boolean', required: false },
      { name: 'hasCombatRelatedConditions', label: 'Any combat-related or hazardous duty conditions?', type: 'boolean', required: true },
    ],
    outputs: ['eligibilityFlag', 'summaryMessage', 'recommendedEvidenceList'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'tricare_coverage_finder',
    title: 'TRICARE Coverage Finder',
    route: '/yourbenefits/tools/tricare-finder',
    category: 'Healthcare',
    description: 'Identify likely TRICARE coverage options based on status, location, and beneficiary type.',
    icon: 'Stethoscope',
    color: 'text-cyan-500',
    inputs: [
      { name: 'status', label: 'Status', type: 'select', options: ['Active Duty', 'Reserve/Guard', 'Retired', 'Family Member', 'Survivor'], required: true },
      { name: 'zipCode', label: 'ZIP code', type: 'text', required: false },
      { name: 'isOver65', label: 'Age 65 or older?', type: 'boolean', required: false },
    ],
    outputs: ['eligiblePlans', 'primaryRecommendation'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'cola_estimator',
    title: 'COLA Growth Estimator',
    route: '/yourbenefits/calculators/cola',
    category: 'Retirement',
    description: 'Project how annual cost-of-living adjustments may change your retired pay over time.',
    icon: 'TrendingUp',
    color: 'text-blue-500',
    inputs: [
      { name: 'currentBenefit', label: 'Current monthly benefit', type: 'number', required: true },
      { name: 'expectedColaPercent', label: 'Average annual COLA (%)', type: 'number', required: true },
      { name: 'years', label: 'Years to project', type: 'number', required: true },
    ],
    outputs: ['projectedMonthlyBenefit', 'projectedAnnualBenefit', 'totalIncreaseOverPeriod'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'brs_vs_legacy_comparison',
    title: 'BRS vs. Legacy Comparison',
    route: '/yourbenefits/calculators/brs-comparison',
    category: 'Retirement',
    description: 'Compare potential outcomes between the Blended Retirement System and legacy retirement.',
    icon: 'Scale',
    color: 'text-blue-500',
    inputs: [
      { name: 'yearsOfServiceAtSeparation', label: 'Years of service at separation/retirement', type: 'number', required: true },
      { name: 'basePayAtSeparation', label: 'Base pay at separation', type: 'number', required: true },
      { name: 'tspContributionPercent', label: 'TSP contribution %', type: 'number', required: false },
      { name: 'expectedReturnRate', label: 'Expected TSP annual return (%)', type: 'number', required: false },
    ],
    outputs: ['legacyPensionEstimate', 'brsPensionEstimate', 'brsTspProjectedBalance', 'highLevelComparisonSummary'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'va_health_means_test_tool',
    title: 'VA Means Test Helper',
    route: '/yourbenefits/tools/va-means-test',
    category: 'Healthcare',
    description: 'Rough screening tool to estimate which VA priority group you may fall into.',
    icon: 'ClipboardCheck',
    color: 'text-cyan-500',
    inputs: [
      { name: 'householdIncome', label: 'Household income (annual)', type: 'number', required: true },
      { name: 'householdSize', label: 'Household size', type: 'number', required: true },
      { name: 'zipCode', label: 'ZIP code', type: 'text', required: false },
      { name: 'isServiceConnected', label: 'Service-connected disability?', type: 'boolean', required: false },
    ],
    outputs: ['approximatePriorityGroup', 'meansTestFlag', 'notes'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'va_travel_reimbursement',
    title: 'VA Travel Reimbursement Estimator',
    route: '/yourbenefits/calculators/va-travel',
    category: 'Healthcare',
    description: 'Estimate mileage reimbursement for approved VA healthcare travel.',
    icon: 'Car',
    color: 'text-cyan-500',
    inputs: [
      { name: 'oneWayMiles', label: 'One-way distance to facility (miles)', type: 'number', required: true },
      { name: 'roundTripsPerMonth', label: 'Number of round trips per month', type: 'number', required: false },
      { name: 'mileageRate', label: 'VA mileage rate per mile', type: 'number', required: false },
    ],
    outputs: ['reimbursementPerTrip', 'reimbursementPerMonth', 'reimbursementPerYear'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
  {
    id: 'property_tax_exemption_finder',
    title: 'Property Tax Exemption Finder',
    route: '/yourbenefits/tools/property-tax-exemption',
    category: 'Taxes',
    description: 'Quickly see if your state offers property tax relief for disabled veterans or surviving spouses.',
    icon: 'Home',
    color: 'text-green-500',
    inputs: [
      { name: 'state', label: 'State of residence', type: 'select', optionsSource: 'usStates', required: true },
      { name: 'vaDisabilityRating', label: 'VA disability rating (%)', type: 'number', required: true },
      { name: 'isSurvivingSpouse', label: 'Surviving spouse?', type: 'boolean', required: false },
    ],
    outputs: ['benefitAvailable', 'estimatedExemptionRange', 'programSummary'],
    aiSupport: { enabled: true, mode: 'inline_explanation' },
  },
];

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
  'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
  'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia'
];

export function getCalculatorsByCategory(category: string): CalculatorConfig[] {
  return CALCULATORS.filter(calc => calc.category === category);
}

export function getCalculatorById(id: string): CalculatorConfig | undefined {
  return CALCULATORS.find(calc => calc.id === id);
}

export function getCalculatorByRoute(route: string): CalculatorConfig | undefined {
  return CALCULATORS.find(calc => calc.route === route);
}
