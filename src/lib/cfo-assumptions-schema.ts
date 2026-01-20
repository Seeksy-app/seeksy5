/**
 * Canonical CFO Assumptions Schema
 * 
 * This is the single source of truth for all CFO assumptions used across:
 * - CFO Assumption Studio
 * - Calculators (Growth & CAC, Subscription, Ad Revenue, Events)
 * - generate-proforma-forecast edge function
 * - All Board financial pages (Business Model, Revenue Insights, Key Metrics)
 */

export interface AssumptionConfig {
  label: string;
  unit: 'percent' | 'USD' | 'count' | 'impressions' | 'views' | 'slots';
  default: number;
  benchmark_key?: string;
  benchmark_keys?: string[];
  description?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface CFOAssumptionsSchema {
  growth: Record<string, AssumptionConfig>;
  subscriptions: Record<string, AssumptionConfig>;
  advertising: Record<string, AssumptionConfig>;
  impressions: Record<string, AssumptionConfig>;
  events: Record<string, AssumptionConfig>;
}

export const CFO_ASSUMPTIONS_SCHEMA: CFOAssumptionsSchema = {
  growth: {
    monthly_creator_growth_rate: {
      label: "Monthly Creator Growth Rate",
      unit: "percent",
      default: 4,
      benchmark_key: "creator_growth_rate",
      min: 1,
      max: 20,
      step: 1,
      description: "Expected month-over-month creator growth"
    },
    monthly_advertiser_growth_rate: {
      label: "Monthly Advertiser Growth Rate",
      unit: "percent",
      default: 3,
      benchmark_key: "advertiser_growth_rate",
      min: 1,
      max: 15,
      step: 1,
      description: "Expected month-over-month advertiser growth"
    },
    creator_monthly_churn_rate: {
      label: "Creator Monthly Churn",
      unit: "percent",
      default: 5,
      benchmark_key: "creator_monthly_churn",
      min: 1,
      max: 20,
      step: 0.5,
      description: "Percent of paying creators who cancel each month"
    },
    advertiser_monthly_churn_rate: {
      label: "Advertiser Monthly Churn",
      unit: "percent",
      default: 8,
      benchmark_key: "advertiser_monthly_churn",
      min: 1,
      max: 25,
      step: 1,
      description: "Percent of advertisers who leave each month"
    },
    creator_cac_paid: {
      label: "Creator CAC (Paid)",
      unit: "USD",
      default: 45,
      benchmark_key: "creator_cac_paid",
      min: 5,
      max: 500,
      step: 5,
      description: "Average cost to acquire one paying creator via paid channels"
    },
    creator_cac_organic: {
      label: "Creator CAC (Organic)",
      unit: "USD",
      default: 15,
      benchmark_key: "creator_cac_organic",
      min: 0,
      max: 100,
      step: 5,
      description: "Blended cost to acquire creators via organic/referral channels"
    }
  },

  subscriptions: {
    free_to_pro_conversion_rate: {
      label: "Free → Pro Conversion Rate",
      unit: "percent",
      default: 5,
      benchmark_key: "subscription_free_conversion",
      min: 0,
      max: 20,
      step: 1,
      description: "Monthly rate at which free users upgrade to Pro"
    },
    pro_arpu: {
      label: "Pro Tier ARPU",
      unit: "USD",
      default: 29,
      benchmark_key: "creator_subscription_arpu_pro",
      min: 9,
      max: 299,
      step: 1,
      description: "Average revenue per Pro subscriber"
    },
    business_arpu: {
      label: "Business Tier ARPU",
      unit: "USD",
      default: 79,
      benchmark_key: "creator_subscription_arpu_business",
      min: 29,
      max: 149,
      step: 5,
      description: "Average revenue per Business subscriber"
    },
    enterprise_arpu: {
      label: "Enterprise Tier ARPU",
      unit: "USD",
      default: 299,
      benchmark_key: "creator_subscription_arpu_enterprise",
      min: 99,
      max: 499,
      step: 10,
      description: "Average revenue per Enterprise subscriber"
    },
    subscription_churn_rate: {
      label: "Subscription Monthly Churn",
      unit: "percent",
      default: 4,
      benchmark_key: "subscription_monthly_churn",
      min: 1,
      max: 15,
      step: 0.5,
      description: "Monthly churn rate for paid subscriptions"
    }
  },

  advertising: {
    audio_cpm_hostread: {
      label: "Host-Read Audio CPM",
      unit: "USD",
      default: 22,
      benchmark_keys: ["audio_hostread_preroll_cpm_low", "audio_hostread_preroll_cpm_high"],
      min: 15,
      max: 40,
      step: 1,
      description: "CPM for host-read podcast ads"
    },
    audio_cpm_programmatic: {
      label: "Programmatic Audio CPM",
      unit: "USD",
      default: 12,
      benchmark_keys: ["audio_programmatic_cpm_low", "audio_programmatic_cpm_high"],
      min: 5,
      max: 20,
      step: 0.5,
      description: "CPM for programmatic audio ads"
    },
    video_cpm: {
      label: "Video Mid-roll CPM",
      unit: "USD",
      default: 20,
      benchmark_keys: ["video_midroll_cpm_low", "video_midroll_cpm_high"],
      min: 10,
      max: 40,
      step: 1,
      description: "CPM for video mid-roll ads"
    },
    newsletter_cpm: {
      label: "Newsletter CPM",
      unit: "USD",
      default: 35,
      benchmark_key: "newsletter_cpm_avg",
      min: 20,
      max: 60,
      step: 1,
      description: "CPM for newsletter/email ads"
    },
    display_cpm: {
      label: "Display CPM",
      unit: "USD",
      default: 5,
      benchmark_key: "display_cpm_avg",
      min: 2,
      max: 15,
      step: 0.5,
      description: "CPM for display/banner ads"
    },
    audio_fill_rate: {
      label: "Audio Fill Rate",
      unit: "percent",
      default: 65,
      benchmark_key: "audio_fill_rate",
      min: 30,
      max: 95,
      step: 5,
      description: "Percentage of audio ad inventory that is filled"
    },
    video_fill_rate: {
      label: "Video Fill Rate",
      unit: "percent",
      default: 55,
      benchmark_key: "video_fill_rate",
      min: 30,
      max: 95,
      step: 5,
      description: "Percentage of video ad inventory that is filled"
    },
    newsletter_fill_rate: {
      label: "Newsletter Fill Rate",
      unit: "percent",
      default: 80,
      benchmark_key: "newsletter_fill_rate",
      min: 30,
      max: 95,
      step: 5,
      description: "Percentage of newsletter ad slots that are filled"
    },
    display_fill_rate: {
      label: "Display Fill Rate",
      unit: "percent",
      default: 70,
      benchmark_key: "display_fill_rate",
      min: 30,
      max: 95,
      step: 5,
      description: "Percentage of display ad inventory that is filled"
    },
    hostread_platform_share: {
      label: "Platform Share — Host-Read Ads",
      unit: "percent",
      default: 30,
      benchmark_key: "hostread_platform_share",
      min: 10,
      max: 50,
      step: 5,
      description: "Platform revenue share for host-read ads"
    },
    programmatic_platform_share: {
      label: "Platform Share — Programmatic Ads",
      unit: "percent",
      default: 40,
      benchmark_key: "programmatic_platform_share",
      min: 20,
      max: 60,
      step: 5,
      description: "Platform revenue share for programmatic ads"
    },
    brand_deal_platform_share: {
      label: "Platform Share — Brand Deals",
      unit: "percent",
      default: 20,
      benchmark_key: "brand_deal_platform_share",
      min: 10,
      max: 40,
      step: 5,
      description: "Platform revenue share for brand deals"
    },
    ad_slots_audio: {
      label: "Audio Ad Slots per Episode",
      unit: "slots",
      default: 3,
      benchmark_key: "audio_ad_slots_per_episode",
      min: 1,
      max: 6,
      step: 1,
      description: "Number of ad slots per audio episode"
    },
    ad_slots_video: {
      label: "Video Ad Slots per Episode",
      unit: "slots",
      default: 2,
      benchmark_key: "video_ad_slots_per_video",
      min: 1,
      max: 5,
      step: 1,
      description: "Number of ad slots per video"
    }
  },

  impressions: {
    podcaster_small: {
      label: "Small Podcaster Monthly Impressions",
      unit: "impressions",
      default: 5000,
      benchmark_keys: ["podcaster_small_monthly_impressions_low", "podcaster_small_monthly_impressions_high"],
      min: 1000,
      max: 20000,
      step: 1000,
      description: "Average monthly impressions for small podcasters"
    },
    podcaster_mid: {
      label: "Mid Podcaster Monthly Impressions",
      unit: "impressions",
      default: 25000,
      benchmark_keys: ["podcaster_mid_monthly_impressions_low", "podcaster_mid_monthly_impressions_high"],
      min: 10000,
      max: 100000,
      step: 5000,
      description: "Average monthly impressions for mid-tier podcasters"
    },
    podcaster_large: {
      label: "Large Podcaster Monthly Impressions",
      unit: "impressions",
      default: 250000,
      benchmark_keys: ["podcaster_large_monthly_impressions_low", "podcaster_large_monthly_impressions_high"],
      min: 100000,
      max: 1000000,
      step: 50000,
      description: "Average monthly impressions for large podcasters"
    },
    video_small: {
      label: "Small Video Creator Monthly Views",
      unit: "views",
      default: 10000,
      benchmark_keys: ["video_creator_small_monthly_views_low", "video_creator_small_monthly_views_high"],
      min: 1000,
      max: 50000,
      step: 1000,
      description: "Average monthly views for small video creators"
    },
    video_mid: {
      label: "Mid Video Creator Monthly Views",
      unit: "views",
      default: 100000,
      benchmark_keys: ["video_creator_mid_monthly_views_low", "video_creator_mid_monthly_views_high"],
      min: 50000,
      max: 500000,
      step: 10000,
      description: "Average monthly views for mid-tier video creators"
    },
    video_large: {
      label: "Large Video Creator Monthly Views",
      unit: "views",
      default: 1000000,
      benchmark_keys: ["video_creator_large_monthly_views_low", "video_creator_large_monthly_views_high"],
      min: 500000,
      max: 5000000,
      step: 100000,
      description: "Average monthly views for large video creators"
    }
  },

  events: {
    events_per_year: {
      label: "Number of Events per Year",
      unit: "count",
      default: 12,
      min: 0,
      max: 200,
      step: 1,
      description: "Total events hosted annually"
    },
    avg_ticket_price: {
      label: "Average Ticket Price",
      unit: "USD",
      default: 45,
      benchmark_key: "avg_event_ticket_price",
      min: 10,
      max: 250,
      step: 5,
      description: "Average ticket price per event"
    },
    avg_event_sponsorship: {
      label: "Average Event Sponsorship",
      unit: "USD",
      default: 2500,
      benchmark_key: "avg_award_sponsorship_value",
      min: 500,
      max: 50000,
      step: 500,
      description: "Average sponsorship revenue per event"
    }
  }
};

// Helper to get all metric keys as a flat array
export function getAllMetricKeys(): string[] {
  const keys: string[] = [];
  Object.entries(CFO_ASSUMPTIONS_SCHEMA).forEach(([category, metrics]) => {
    Object.keys(metrics).forEach(key => keys.push(key));
  });
  return keys;
}

// Helper to get a specific assumption config
export function getAssumptionConfig(key: string): AssumptionConfig | undefined {
  for (const [category, metrics] of Object.entries(CFO_ASSUMPTIONS_SCHEMA)) {
    if (key in metrics) {
      return metrics[key as keyof typeof metrics];
    }
  }
  return undefined;
}

// Helper to get the category for a metric key
export function getMetricCategory(key: string): string | undefined {
  for (const [category, metrics] of Object.entries(CFO_ASSUMPTIONS_SCHEMA)) {
    if (key in metrics) {
      return category;
    }
  }
  return undefined;
}

// Helper to get default value for a metric
export function getDefaultValue(key: string): number {
  const config = getAssumptionConfig(key);
  return config?.default ?? 0;
}

// Helper to format value based on unit
export function formatAssumptionValue(value: number, unit: AssumptionConfig['unit']): string {
  switch (unit) {
    case 'USD':
      return `$${value.toLocaleString()}`;
    case 'percent':
      return `${value}%`;
    case 'impressions':
    case 'views':
    case 'count':
      return value.toLocaleString();
    case 'slots':
      return `${value} slot${value !== 1 ? 's' : ''}`;
    default:
      return String(value);
  }
}

// Type for a single assumption value with metadata
export interface AssumptionValue {
  key: string;
  value: number;
  source: 'cfo_override' | 'r_d_default' | 'schema_default';
  config: AssumptionConfig;
}

// Export category labels for display
export const CATEGORY_LABELS: Record<keyof CFOAssumptionsSchema, string> = {
  growth: 'Growth & Acquisition',
  subscriptions: 'Subscriptions',
  advertising: 'Advertising',
  impressions: 'Impressions & Views',
  events: 'Events & Awards'
};
