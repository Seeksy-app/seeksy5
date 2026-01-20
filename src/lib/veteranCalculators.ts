// Veteran Benefits Calculator Logic
// Based on OPM regulations and official DoD military pay tables

import {
  getMilitaryBasePay,
  getDepositRate,
  calculateInterest,
  calculateMultiPeriodDeposit,
  GradePeriod,
  OPM_INTEREST_RATES
} from './dodPayTables';

export interface MilitaryBuyBackInput {
  branch: string;
  payEntryDate: Date;
  separationDate: Date;
  separationGrade: string;
  fedStartDate: Date;
  retirementPlan: 'fers' | 'csrs';
  yearsToRetirement: number;
  annualBasePay: number;
  // Advanced mode: multiple grade periods
  gradePeriods?: GradePeriod[];
}

export interface MilitaryBuyBackResult {
  totalMilitaryService: number;
  depositAmount: number;
  baseDeposit: number;
  monthlyPaymentOption: number;
  interestAmount: number;
  annuityIncrease: number;
  breakEvenYears: number;
  lifetimeBenefit: number;
  recommendation: string;
  periodBreakdown?: { grade: string; years: number; deposit: number }[];
}

export function calculateMilitaryBuyBack(input: MilitaryBuyBackInput): MilitaryBuyBackResult {
  const serviceYears = 
    (input.separationDate.getTime() - input.payEntryDate.getTime()) / 
    (1000 * 60 * 60 * 24 * 365.25);

  let baseDeposit: number;
  let periodBreakdown: { grade: string; years: number; deposit: number }[] | undefined;

  // Check if using advanced mode (multiple grade periods)
  if (input.gradePeriods && input.gradePeriods.length > 0) {
    const multiPeriodResult = calculateMultiPeriodDeposit(input.gradePeriods, input.retirementPlan);
    baseDeposit = multiPeriodResult.totalDeposit;
    periodBreakdown = multiPeriodResult.periodBreakdown;
  } else {
    // Basic mode: calculate deposit year by year using official pay tables
    baseDeposit = 0;
    const startYear = input.payEntryDate.getFullYear();
    const endYear = input.separationDate.getFullYear();
    
    for (let year = startYear; year <= endYear; year++) {
      // Calculate what fraction of this year was served
      let yearFraction = 1;
      
      if (year === startYear) {
        const startMonth = input.payEntryDate.getMonth();
        yearFraction = (12 - startMonth) / 12;
      } else if (year === endYear) {
        const endMonth = input.separationDate.getMonth();
        yearFraction = (endMonth + 1) / 12;
      }
      
      const annualPay = getMilitaryBasePay(input.separationGrade, year);
      const depositRate = getDepositRate(year, input.retirementPlan);
      baseDeposit += annualPay * yearFraction * depositRate;
    }
  }

  // Calculate interest using OPM composite rates
  const fedStartYear = input.fedStartDate.getFullYear();
  const currentYear = new Date().getFullYear();
  const interestAmount = calculateInterest(baseDeposit, fedStartYear, currentYear);

  const totalDeposit = baseDeposit + Math.max(0, interestAmount);

  // Annuity calculation: FERS = 1% per year, CSRS = 1.5-2% per year (using 1.75% average)
  const annuityRate = input.retirementPlan === 'fers' ? 0.01 : 0.0175;
  const annualAnnuityIncrease = input.annualBasePay * serviceYears * annuityRate;

  const breakEvenYears = annualAnnuityIncrease > 0 ? totalDeposit / annualAnnuityIncrease : 0;
  const lifetimeBenefit = annualAnnuityIncrease * 20; // 20-year retirement assumption

  let recommendation = "";
  if (breakEvenYears < 2) {
    recommendation = "Buying back your military time is highly recommended. You'll recover your investment in just " + 
      breakEvenYears.toFixed(1) + " years of retirement and gain over $" + 
      Math.round(lifetimeBenefit / 1000) + ",000 in lifetime benefits.";
  } else if (breakEvenYears < 5) {
    recommendation = "Strongly recommended! You'll recoup your investment quickly and gain significant lifetime benefits.";
  } else if (breakEvenYears < 10) {
    recommendation = "Recommended. The investment pays off within a typical retirement period.";
  } else {
    recommendation = "Consider carefully. Consult a benefits specialist to evaluate your specific situation.";
  }

  return {
    totalMilitaryService: serviceYears,
    depositAmount: totalDeposit,
    baseDeposit,
    monthlyPaymentOption: input.yearsToRetirement > 0 ? totalDeposit / (input.yearsToRetirement * 12) : 0,
    interestAmount: Math.max(0, interestAmount),
    annuityIncrease: annualAnnuityIncrease,
    breakEvenYears,
    lifetimeBenefit,
    recommendation,
    periodBreakdown,
  };
}

// Re-export types for use in components
export type { GradePeriod };


// MRA Calculator
export interface MRAInput {
  dateOfBirth: Date;
  startDate: Date;
  hasMilitaryService: boolean;
  hasSpecialProvisions: boolean;
}

export interface MRAResult {
  minimumRetirementAge: number;
  mraYears: number;
  mraMonths: number;
  retirementEligibilityDate: Date;
  yearsOfServiceNeeded: number;
  monthsOfServiceNeeded: number;
  canRetireAt: string;
  specialProvisionAge?: number;
}

export function calculateMRA(input: MRAInput): MRAResult {
  const birthYear = input.dateOfBirth.getFullYear();
  
  let mraYears = 55;
  let mraMonths = 0;

  if (birthYear < 1948) {
    mraYears = 55;
  } else if (birthYear === 1948) {
    mraYears = 55; mraMonths = 0;
  } else if (birthYear === 1949) {
    mraYears = 55; mraMonths = 2;
  } else if (birthYear === 1950) {
    mraYears = 55; mraMonths = 4;
  } else if (birthYear === 1951) {
    mraYears = 55; mraMonths = 6;
  } else if (birthYear === 1952) {
    mraYears = 55; mraMonths = 8;
  } else if (birthYear === 1953) {
    mraYears = 55; mraMonths = 10;
  } else if (birthYear >= 1954 && birthYear <= 1964) {
    mraYears = 56;
  } else if (birthYear === 1965) {
    mraYears = 56; mraMonths = 2;
  } else if (birthYear === 1966) {
    mraYears = 56; mraMonths = 4;
  } else if (birthYear === 1967) {
    mraYears = 56; mraMonths = 6;
  } else if (birthYear === 1968) {
    mraYears = 56; mraMonths = 8;
  } else if (birthYear === 1969) {
    mraYears = 56; mraMonths = 10;
  } else {
    mraYears = 57;
  }

  let specialProvisionAge;
  if (input.hasSpecialProvisions) {
    specialProvisionAge = 50;
  }

  const retirementDate = new Date(input.dateOfBirth);
  retirementDate.setFullYear(retirementDate.getFullYear() + mraYears);
  retirementDate.setMonth(retirementDate.getMonth() + mraMonths);

  const serviceTime = retirementDate.getTime() - input.startDate.getTime();
  const totalMonths = serviceTime / (1000 * 60 * 60 * 24 * 30.44);
  const yearsOfService = Math.floor(totalMonths / 12);
  const monthsOfService = Math.floor(totalMonths % 12);

  let canRetireAt;
  if (input.hasSpecialProvisions) {
    canRetireAt = `Age ${specialProvisionAge} with 20 years of service, or age ${mraYears} with 30 years`;
  } else if (input.hasMilitaryService) {
    canRetireAt = `MRA (age ${mraYears} years ${mraMonths} months) with 30 years, or age 60 with 20 years (military time may count)`;
  } else {
    canRetireAt = `MRA (age ${mraYears} years ${mraMonths} months) with 30 years, or age 60 with 20 years, or age 62 with 5 years`;
  }

  return {
    minimumRetirementAge: mraYears + mraMonths / 12,
    mraYears,
    mraMonths,
    retirementEligibilityDate: retirementDate,
    yearsOfServiceNeeded: yearsOfService,
    monthsOfServiceNeeded: monthsOfService,
    canRetireAt,
    specialProvisionAge,
  };
}

// Sick Leave Calculator
export interface SickLeaveInput {
  unusedSickLeaveHours: number;
  currentSalary?: number;
}

export interface SickLeaveResult {
  totalHours: number;
  daysEquivalent: number;
  monthsCredit: number;
  yearsCredit: number;
  pensionIncrease: string;
  estimatedAnnualBenefit: number;
  description: string;
}

export function calculateSickLeave(input: SickLeaveInput): SickLeaveResult {
  const totalHours = input.unusedSickLeaveHours;
  const daysEquivalent = totalHours / 8;
  
  const yearsCredit = totalHours / 2087;
  const monthsCredit = (yearsCredit % 1) * 12;
  
  const pensionIncreasePercent = (yearsCredit * 1).toFixed(2);
  const estimatedAnnualBenefit = input.currentSalary 
    ? input.currentSalary * yearsCredit * 0.01 
    : 0;

  let description = "";
  if (yearsCredit >= 1) {
    description = `Your unused sick leave will add ${Math.floor(yearsCredit)} year(s) and ${Math.floor(monthsCredit)} month(s) to your total service time.`;
  } else {
    description = `Your unused sick leave will add ${Math.floor(monthsCredit)} month(s) to your total service time.`;
  }

  return {
    totalHours,
    daysEquivalent: Math.floor(daysEquivalent),
    monthsCredit: Math.floor(monthsCredit),
    yearsCredit: Math.floor(yearsCredit),
    pensionIncrease: `${pensionIncreasePercent}%`,
    estimatedAnnualBenefit,
    description,
  };
}
