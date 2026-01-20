/**
 * Revenue Model Configuration
 * 
 * This config centralizes all revenue calculation logic for podcast analytics.
 * Adjust these values to match financial model assumptions.
 */

export const revenueModelConfig = {
  // CPM (Cost Per Mille) - dollars earned per 1000 impressions
  defaultCpm: 25,

  // Ad read multiplier - increases revenue based on number of ad reads
  // 1.0 = no bonus, 1.2 = 20% increase per ad read, etc.
  adReadMultiplier: 1.0,

  // Base impressions per episode (mock data until real tracking is integrated)
  baseImpressionsPerEpisode: 1000,

  // Impressions growth factor for newer episodes
  // Newer episodes get higher impressions than older ones
  newEpisodeBonus: 1.5, // 50% bonus for episodes < 30 days old
  newEpisodeThresholdDays: 30,

  // Impressions bonus for episodes with ad reads
  // Each ad read increases impressions by this percentage
  adReadImpressionBonus: 0.1, // 10% bonus per ad read

  // Voice Certification CPM Uplift
  // Certified voices earn higher CPM due to authenticity verification
  certifiedVoiceCpmMultiplier: 1.25, // 25% CPM boost for certified voices
  
  // Advertiser-side CPM rates
  advertiserHostReadCpm: 30, // CPM paid by advertisers for host-read ads
  advertiserAnnouncerCpm: 20, // CPM for announcer/pre-recorded ads
  
  // Platform revenue share
  platformRevenueShare: 0.30, // 30% platform fee
  creatorRevenueShare: 0.70, // 70% to creator
};

/**
 * Calculate impressions for an episode
 * 
 * @param episodeAge - Age of episode in days
 * @param adReadCount - Number of ad reads in the episode
 * @returns Estimated impressions
 */
export const calculateEpisodeImpressions = (
  episodeAge: number,
  adReadCount: number
): number => {
  let impressions = revenueModelConfig.baseImpressionsPerEpisode;

  // Newer episodes get more impressions
  if (episodeAge < revenueModelConfig.newEpisodeThresholdDays) {
    impressions *= revenueModelConfig.newEpisodeBonus;
  }

  // Episodes with ad reads get more impressions (higher engagement)
  const adReadBonus = 1 + (adReadCount * revenueModelConfig.adReadImpressionBonus);
  impressions *= adReadBonus;

  return Math.round(impressions);
};

/**
 * Calculate revenue for given impressions and ad reads
 * 
 * @param impressions - Total impressions
 * @param adReadCount - Number of ad reads
 * @returns Estimated revenue in dollars
 */
export const calculateRevenue = (
  impressions: number,
  adReadCount: number
): number => {
  const baseRevenue = (impressions / 1000) * revenueModelConfig.defaultCpm;
  
  // Ad read multiplier increases revenue
  const multiplier = 1 + (adReadCount * (revenueModelConfig.adReadMultiplier - 1));
  
  return baseRevenue * multiplier;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format large numbers with commas
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};
