/**
 * CFO Expenses Schema
 * Defines the structure for the Expense Engine
 */

export interface ExpenseConfig {
  key: string;
  label: string;
  category: 'fixed' | 'variable' | 'marketing';
  unit: 'USD' | 'percent';
  default: number;
  isMonthly: boolean;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const CFO_EXPENSES_SCHEMA: Record<string, ExpenseConfig[]> = {
  fixed: [
    {
      key: 'headcount_engineering',
      label: 'Engineering Team',
      category: 'fixed',
      unit: 'USD',
      default: 45000,
      isMonthly: true,
      description: 'Monthly engineering team salaries',
      min: 0,
      max: 500000,
      step: 5000
    },
    {
      key: 'headcount_sales',
      label: 'Sales Team',
      category: 'fixed',
      unit: 'USD',
      default: 25000,
      isMonthly: true,
      description: 'Monthly sales team salaries',
      min: 0,
      max: 300000,
      step: 5000
    },
    {
      key: 'headcount_support',
      label: 'Customer Support',
      category: 'fixed',
      unit: 'USD',
      default: 15000,
      isMonthly: true,
      description: 'Monthly support team salaries',
      min: 0,
      max: 200000,
      step: 2500
    },
    {
      key: 'headcount_executive',
      label: 'Executive Team',
      category: 'fixed',
      unit: 'USD',
      default: 40000,
      isMonthly: true,
      description: 'Monthly executive compensation',
      min: 0,
      max: 500000,
      step: 5000
    },
    {
      key: 'rent',
      label: 'Office Rent',
      category: 'fixed',
      unit: 'USD',
      default: 5000,
      isMonthly: true,
      description: 'Monthly office space costs',
      min: 0,
      max: 50000,
      step: 500
    },
    {
      key: 'saas_tools',
      label: 'SaaS Subscriptions',
      category: 'fixed',
      unit: 'USD',
      default: 3000,
      isMonthly: true,
      description: 'Monthly software tools',
      min: 0,
      max: 50000,
      step: 500
    },
    {
      key: 'insurance',
      label: 'Insurance',
      category: 'fixed',
      unit: 'USD',
      default: 2000,
      isMonthly: true,
      description: 'Monthly business insurance',
      min: 0,
      max: 20000,
      step: 250
    },
    {
      key: 'infrastructure_base',
      label: 'Infrastructure Baseline',
      category: 'fixed',
      unit: 'USD',
      default: 8000,
      isMonthly: true,
      description: 'AWS/GCP baseline hosting costs',
      min: 0,
      max: 100000,
      step: 1000
    }
  ],
  variable: [
    {
      key: 'infra_per_creator',
      label: 'Infrastructure per Creator',
      category: 'variable',
      unit: 'USD',
      default: 2,
      isMonthly: true,
      description: 'Variable cloud cost per active creator',
      min: 0,
      max: 20,
      step: 0.5
    },
    {
      key: 'payment_processing',
      label: 'Payment Processing',
      category: 'variable',
      unit: 'percent',
      default: 2.9,
      isMonthly: true,
      description: 'Stripe/payment processing fees',
      min: 0,
      max: 10,
      step: 0.1
    },
    {
      key: 'creator_payouts',
      label: 'Creator Payouts',
      category: 'variable',
      unit: 'percent',
      default: 70,
      isMonthly: true,
      description: 'Revenue share to creators (% of ad revenue)',
      min: 0,
      max: 100,
      step: 5
    }
  ],
  marketing: [
    {
      key: 'paid_ads',
      label: 'Paid Advertising',
      category: 'marketing',
      unit: 'USD',
      default: 10000,
      isMonthly: true,
      description: 'Monthly paid ad spend',
      min: 0,
      max: 500000,
      step: 1000
    },
    {
      key: 'content_marketing',
      label: 'Content Marketing',
      category: 'marketing',
      unit: 'USD',
      default: 3000,
      isMonthly: true,
      description: 'Blog, video, social content creation',
      min: 0,
      max: 50000,
      step: 500
    },
    {
      key: 'events_marketing',
      label: 'Events & Conferences',
      category: 'marketing',
      unit: 'USD',
      default: 2000,
      isMonthly: true,
      description: 'Event sponsorships and attendance',
      min: 0,
      max: 100000,
      step: 500
    }
  ]
};

export const CATEGORY_LABELS: Record<string, string> = {
  fixed: 'Fixed Costs',
  variable: 'Variable Costs',
  marketing: 'Marketing'
};

export function getExpenseConfig(key: string): ExpenseConfig | undefined {
  for (const category of Object.values(CFO_EXPENSES_SCHEMA)) {
    const found = category.find(e => e.key === key);
    if (found) return found;
  }
  return undefined;
}

export function getAllExpenseKeys(): string[] {
  return Object.values(CFO_EXPENSES_SCHEMA).flat().map(e => e.key);
}

export function formatExpenseValue(value: number, unit: 'USD' | 'percent'): string {
  if (unit === 'percent') return `${value}%`;
  return `$${value.toLocaleString()}`;
}