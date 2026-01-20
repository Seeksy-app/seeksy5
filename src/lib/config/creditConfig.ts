/**
 * Credit System Configuration
 * 
 * Centralized config for all credit pricing, usage rates, and limits.
 */

// Subscription Pricing (USD/month)
export const SUBSCRIPTION_PRICING = {
  podcaster_basic: 19,
  podcaster_pro: 49,
  podcaster_enterprise: 199,
  event_creator: 29,
  event_org: 299,
  political_campaign: 499,
  mypage_basic: 9,
  mypage_pro: 29,
  industry_creator: 149,
  awards_pro: 79,
} as const;

// Credit Pack Pricing (USD)
export const CREDIT_PACK_PRICING = {
  starter_300: { credits: 300, price: 19 },
  creator_600: { credits: 600, price: 39 },
  pro_1200: { credits: 1200, price: 79 },
  power_2500: { credits: 2500, price: 149 },
  studio_5000: { credits: 5000, price: 279 },
} as const;

// Free Monthly Limits
export const FREE_LIMITS = {
  recording_minutes: 600,  // 10 hours
  streaming_minutes: 300,  // 5 hours
  storage_gb: 25,
} as const;

// Credit Usage Rates
export const CREDIT_USAGE = {
  recording_per_min: 1,
  streaming_per_min: 1.5,
  ai_clips: 3,
  ai_enhancements: 2,
  transcription_per_10min: 1,
  extra_storage_per_gb: 10,
  voice_cloning: 5,
  // Content Scan Costs
  scan_hourly: 5,
  scan_daily: 2,
  scan_weekly: 1,
  scan_monthly: 0,
} as const;

// Monthly Credit Usage by User Persona
export const MONTHLY_CREDIT_USAGE = {
  mypage_basic: 40,
  mypage_pro: 100,
  podcaster_basic: 120,
  podcaster_pro: 350,
  podcaster_enterprise: 1500,
  event_creator: 200,
  awards_pro: 600,
} as const;

// Credit Purchase Rates (cost per credit by persona)
export const CREDIT_PURCHASE_RATES = {
  mypage_basic: 0.10,
  mypage_pro: 0.22,
  podcaster_basic: 0.38,
  podcaster_pro: 0.64,
  podcaster_enterprise: 1.0,
  event_creator: 0.32,
  awards_pro: 0.55,
} as const;

// Average Credit Revenue Per User (monthly)
export const AVG_CREDIT_REVENUE_PER_USER = {
  mypage_basic: 8,
  mypage_pro: 15,
  podcaster_basic: 20,
  podcaster_pro: 35,
  podcaster_enterprise: 85,
  event_creator: 18,
  awards_pro: 40,
} as const;

// Helper functions
export const getPricePerCredit = (packKey: keyof typeof CREDIT_PACK_PRICING): number => {
  const pack = CREDIT_PACK_PRICING[packKey];
  return pack.price / pack.credits;
};

export const formatCredits = (credits: number): string => {
  return new Intl.NumberFormat('en-US').format(credits);
};

export const formatCreditPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};
