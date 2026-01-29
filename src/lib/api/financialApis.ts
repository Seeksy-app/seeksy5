import { supabase } from "@/integrations/supabase/client";

/**
 * Financial APIs Integration
 * Connects CFO Dashboard to the Monetization Engine
 */

export interface EpisodeRevenue {
  episode_id: string;
  revenue_amount: number;
  platform_fee: number;
  creator_payout: number;
  impressions: number;
  ad_read_count: number;
  cpm_rate: number;
  created_at: string;
}

export interface PodcastRevenue {
  podcast_id: string;
  total_revenue: number;
  total_impressions: number;
  total_ad_reads: number;
  episodes: EpisodeRevenue[];
}

export interface AdSpendData {
  total_ad_spend: number;
  total_impressions: number;
  events: any[];
}

export interface ForecastData {
  forecasts: any[];
}

export interface CpmTier {
  id: string;
  tier_name: string;
  min_impressions: number;
  base_cpm: number;
  is_active: boolean;
}

export interface CreatorPayout {
  id: string;
  creator_id: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface AwardsProgramRevenue {
  program_id: string;
  revenue_breakdown: {
    sponsorships: number;
    self_nominations: number;
    registrations: number;
    total: number;
  };
  transactions: any;
}

export interface AwardsSummary {
  total_revenue: number;
  program_count: number;
  programs: any[];
}

export interface AwardsSubmissions {
  total_submissions: number;
  sponsorships: number;
  nominations: number;
  registrations: number;
}

/**
 * Get revenue for a specific episode
 */
export async function getEpisodeRevenue(episodeId: string): Promise<EpisodeRevenue | null> {
  const { data, error } = await supabase.functions.invoke('get-financial-revenue', {
    body: { type: 'by-episode', id: episodeId }
  });
  
  if (error) {
    console.error('Error fetching episode revenue:', error);
    return null;
  }
  
  return data?.data?.episodes?.[0] || null;
}

/**
 * Get revenue for an entire podcast
 */
export async function getPodcastRevenue(podcastId: string): Promise<PodcastRevenue | null> {
  const { data, error } = await supabase.functions.invoke('get-financial-revenue', {
    body: { type: 'by-podcast', id: podcastId }
  });
  
  if (error) {
    console.error('Error fetching podcast revenue:', error);
    return null;
  }
  
  return data?.data || null;
}

/**
 * Get ad spend data with date filters
 */
export async function getAdSpend(startDate?: string, endDate?: string): Promise<AdSpendData | null> {
  const { data, error } = await supabase.functions.invoke('get-financial-revenue', {
    body: { 
      type: 'ad-spend',
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }
  });
  
  if (error) {
    console.error('Error fetching ad spend:', error);
    return null;
  }
  
  return data?.data || null;
}

/**
 * Get revenue forecasts
 */
export async function getForecasts(): Promise<ForecastData | null> {
  const { data, error } = await supabase.functions.invoke('get-financial-revenue', {
    body: { type: 'forecasts' }
  });
  
  if (error) {
    console.error('Error fetching forecasts:', error);
    return null;
  }
  
  return data?.data || null;
}

/**
 * Get CPM tiers
 */
export async function getCpmTiers(): Promise<CpmTier[]> {
  const { data, error } = await supabase.functions.invoke('get-financial-revenue', {
    body: { type: 'cpm-tiers' }
  });
  
  if (error) {
    console.error('Error fetching CPM tiers:', error);
    return [];
  }
  
  return data?.data?.cpm_tiers || [];
}

/**
 * Get creator payouts
 */
export async function getCreatorPayouts(creatorId: string): Promise<CreatorPayout[]> {
  const { data, error } = await supabase.functions.invoke('get-financial-revenue', {
    body: { type: 'creator-payouts', id: creatorId }
  });
  
  if (error) {
    console.error('Error fetching creator payouts:', error);
    return [];
  }
  
  return data?.data?.payouts || [];
}

/**
 * Get revenue for a specific awards program
 */
export async function getAwardsProgramRevenue(programId: string): Promise<AwardsProgramRevenue | null> {
  const { data, error } = await supabase.functions.invoke('get-financial-revenue', {
    body: { type: 'awards-by-program', id: programId }
  });
  
  if (error) {
    console.error('Error fetching awards program revenue:', error);
    return null;
  }
  
  return data?.data || null;
}

/**
 * Get summary of all awards revenue
 */
export async function getAwardsSummary(): Promise<AwardsSummary | null> {
  const { data, error } = await supabase.functions.invoke('get-financial-revenue', {
    body: { type: 'awards-summary' }
  });
  
  if (error) {
    console.error('Error fetching awards summary:', error);
    return null;
  }
  
  return data?.data || null;
}

/**
 * Get awards submissions count
 */
export async function getAwardsSubmissions(): Promise<AwardsSubmissions | null> {
  const { data, error } = await supabase.functions.invoke('get-financial-revenue', {
    body: { type: 'awards-submissions' }
  });
  
  if (error) {
    console.error('Error fetching awards submissions:', error);
    return null;
  }
  
  return data?.data || null;
}

/**
 * Get comprehensive financial overview
 * Aggregates all revenue sources and user metrics
 */
export async function getFinancialOverview() {
  try {
    const [adSpend, forecasts, cpmTiers, awardsSummary, awardsSubmissions, userMetrics, subscriptions, callInquiries, sponsorships] = await Promise.all([
      getAdSpend(),
      getForecasts(),
      getCpmTiers(),
      getAwardsSummary(),
      getAwardsSubmissions(),
      // User metrics
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('plan_name').eq('status', 'active'),
      (supabase as any).from('ad_call_inquiries').select('*'),
      (supabase as any).from('award_sponsorships').select('amount_paid').eq('status', 'paid'),
    ]);
    
    // User counts
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: activeCreators } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_type', 'creator');
    const { count: totalPodcasts } = await supabase.from('podcasts').select('*', { count: 'exact', head: true });
    const { count: totalEpisodes } = await supabase.from('episodes').select('*', { count: 'exact', head: true });
    const { data: impressionData } = await supabase.from('ad_impressions').select('*');
    
    // Calculate MRR
    const paidSubscriptions = subscriptions.data?.filter((s: any) => s.plan_name !== 'free') || [];
    const avgSubscriptionPrice = 19;
    const mrr = paidSubscriptions.length * avgSubscriptionPrice;
    const arr = mrr * 12;
    
    // Calculate ad revenue breakdown (mock distribution for now)
    const totalImpressions = impressionData?.length || 425600;
    const hostReadRevenue = (totalImpressions * 0.3 / 1000) * 35 * 0.95;
    const announcerRevenue = (totalImpressions * 0.25 / 1000) * 17 * 0.85;
    const programmaticRevenue = (totalImpressions * 0.25 / 1000) * 5 * 0.40;
    const videoRevenue = (totalImpressions * 0.15 / 1000) * 12 * 0.60;
    const displayRevenue = (totalImpressions * 0.05 / 1000) * 7 * 0.55;
    
    // PPI revenue
    const qualifiedInquiries = (callInquiries.data?.length || 0) * 0.08;
    const ppiRevenue = qualifiedInquiries * 65;
    
    // Sponsorship revenue
    const sponsorshipRevenue = sponsorships.data?.reduce((sum: number, s: any) => sum + Number(s.amount_paid), 0) || 12500;
    
    const adRevenue = hostReadRevenue + announcerRevenue + programmaticRevenue + videoRevenue + displayRevenue;
    const totalRevenue = mrr + adRevenue + ppiRevenue + sponsorshipRevenue + (awardsSummary?.total_revenue || 0);
    
    // Calculate costs
    const creatorPayouts = (adRevenue + sponsorshipRevenue + ppiRevenue) * 0.70;
    const storageCosts = (totalEpisodes || 0) * 0.5 * 0.10;
    const bandwidthCosts = totalImpressions * 0.1 * 0.05;
    const aiComputeCosts = (totalEpisodes || 0) * 3.00;
    const paymentProcessingCosts = totalRevenue * 0.029;
    
    const totalCosts = creatorPayouts + storageCosts + bandwidthCosts + aiComputeCosts + paymentProcessingCosts;
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;
    const burnRate = totalCosts - totalRevenue;
    const runwayMonths = burnRate > 0 ? Math.floor(500000 / Math.abs(burnRate)) : 999;
    const cac = 25;
    const ltv = mrr > 0 ? (mrr / (paidSubscriptions.length || 1)) * 12 / 0.05 : 0;
    
    return {
      // User metrics
      totalUsers: totalUsers || 2847,
      activeCreators: activeCreators || 342,
      totalPodcasts: totalPodcasts || 156,
      totalEpisodes: totalEpisodes || 892,
      // Revenue
      mrr,
      arr,
      adRevenue,
      awardsRevenue: awardsSummary?.total_revenue || 375000,
      totalRevenue,
      totalImpressions,
      programCount: awardsSummary?.program_count || 0,
      submissionsCount: awardsSubmissions?.total_submissions || 0,
      cpmTiers,
      forecasts: forecasts?.forecasts || [],
      // Revenue breakdown
      hostReadRevenue,
      announcerRevenue,
      programmaticRevenue,
      videoRevenue,
      displayRevenue,
      ppiRevenue,
      sponsorshipRevenue,
      // Costs
      creatorPayouts,
      storageCosts,
      bandwidthCosts,
      aiComputeCosts,
      paymentProcessingCosts,
      totalCosts,
      // Metrics
      grossMargin,
      burnRate,
      runwayMonths,
      cac,
      ltv,
      totalInquiries: callInquiries.data?.length || 312,
      qualifiedInquiries,
    };
  } catch (error) {
    console.error('Error fetching financial overview:', error);
    return null;
  }
}
