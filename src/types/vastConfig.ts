/**
 * VAST Ad Configuration Types
 * 
 * These types define the configuration for VAST-based ad slots
 * that can be integrated into podcast players, video players,
 * and other content delivery systems.
 */

export interface VASTAdSlotConfig {
  /** Internal ad slot identifier */
  adId: string;
  
  /** Campaign ID (if mapped to internal campaign) */
  campaignId?: string;
  
  /** VAST tag URL provided by ad network or agency */
  vastTagUrl?: string;
  
  /** Ad slot position in content */
  slotType: 'pre-roll' | 'mid-roll' | 'post-roll';
  
  /** Timestamp in seconds where ad should play (for mid-roll) */
  timestampSeconds?: number;
  
  /** Maximum duration for ad in seconds */
  maxDurationSeconds?: number;
  
  /** Skip button delay in seconds (0 = non-skippable) */
  skipDelaySeconds?: number;
  
  /** Additional metadata */
  metadata?: {
    advertiserName?: string;
    campaignName?: string;
    targetingRules?: Record<string, any>;
  };
}

export interface VASTAdPlaybackEvent {
  /** Internal ad slot ID */
  adId: string;
  
  /** Campaign ID (if known) */
  campaignId?: string;
  
  /** External impression ID from VAST tracking */
  externalImpressionId?: string;
  
  /** Actual playback duration in milliseconds */
  playbackMs: number;
  
  /** Whether ad was fully listened (90%+ completion) */
  fullyListened: boolean;
  
  /** Whether user skipped the ad */
  skipped?: boolean;
  
  /** Timestamp when ad started playing */
  startedAt: string;
  
  /** Timestamp when ad completed/stopped */
  completedAt: string;
}

/**
 * Example VAST Ad Slot Configuration
 * 
 * This would typically be stored in ad_slots table or fetched from
 * campaign management system.
 */
export const EXAMPLE_VAST_CONFIG: VASTAdSlotConfig = {
  adId: 'vast-ad-001',
  campaignId: 'campaign-external-agency',
  vastTagUrl: 'https://vast.example.com/ad-tag?id=12345',
  slotType: 'pre-roll',
  maxDurationSeconds: 30,
  skipDelaySeconds: 5,
  metadata: {
    advertiserName: 'External Agency',
    campaignName: 'Q1 2025 Campaign',
  },
};

/**
 * VAST Ad Slots for a typical podcast episode
 * 
 * This configuration would be generated when episode is published
 * or fetched dynamically based on campaign targeting rules.
 */
export const EXAMPLE_EPISODE_AD_SLOTS: VASTAdSlotConfig[] = [
  {
    adId: 'vast-pre-001',
    vastTagUrl: 'https://vast.example.com/pre-roll',
    slotType: 'pre-roll',
    maxDurationSeconds: 15,
  },
  {
    adId: 'vast-mid-001',
    vastTagUrl: 'https://vast.example.com/mid-roll',
    slotType: 'mid-roll',
    timestampSeconds: 600, // 10 minutes in
    maxDurationSeconds: 30,
  },
  {
    adId: 'vast-post-001',
    vastTagUrl: 'https://vast.example.com/post-roll',
    slotType: 'post-roll',
    maxDurationSeconds: 15,
  },
];
