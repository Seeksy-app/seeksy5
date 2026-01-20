/**
 * Ad Impression Tracking Implementation Examples
 * 
 * This file demonstrates how to implement ad impression tracking
 * for different ad types across the Seeksy platform.
 */

import { useEffect } from 'react';
import { useAdSlotImpression } from '@/hooks/useAdSlotImpression';
import { trackVASTAdImpression, trackBlogAdImpression } from '@/lib/tracking/adImpressionTracking';

// ==========================================
// Example 1: VAST Ad in Podcast Player
// ==========================================

export const VASTAdPlayerExample = () => {
  const handleAdPlayback = async (adConfig: {
    adId: string;
    campaignId?: string;
    episodeId: string;
    creatorId: string;
  }) => {
    // When VAST ad starts playing
    const startTime = Date.now();
    
    // Your VAST player logic here...
    // const vastResponse = await loadVASTTag(adConfig.vastTagUrl);
    
    // When ad completes (or user skips)
    const endTime = Date.now();
    const playbackMs = endTime - startTime;
    const fullyListened = playbackMs >= (30 * 1000 * 0.9); // 90% of 30sec ad
    
    await trackVASTAdImpression({
      adId: adConfig.adId,
      campaignId: adConfig.campaignId,
      episodeId: adConfig.episodeId,
      creatorId: adConfig.creatorId,
      slotType: 'mid-roll',
      playbackMs,
      fullyListened,
      externalImpressionId: 'vast-impression-from-network', // From VAST response
    });
  };

  return null; // This is just an example
};

// ==========================================
// Example 2: Blog Widget Ad
// ==========================================

export const BlogAdWidget = ({
  adId,
  campaignId,
  blogPostId,
  creatorId,
  adImageUrl,
  advertiserUrl,
}: {
  adId: string;
  campaignId?: string;
  blogPostId: string;
  creatorId: string;
  adImageUrl: string;
  advertiserUrl: string;
}) => {
  // Hook automatically tracks impression when 50% visible
  const { ref, impressionTracked } = useAdSlotImpression({
    adId,
    campaignId,
    blogPostId,
    creatorId,
  });

  return (
    <div 
      ref={ref} 
      className="ad-widget p-4 border rounded-lg bg-muted/20"
    >
      <div className="text-xs text-muted-foreground mb-2">Sponsored</div>
      <a href={advertiserUrl} target="_blank" rel="noopener noreferrer">
        <img 
          src={adImageUrl} 
          alt="Advertisement" 
          className="w-full rounded"
        />
      </a>
      {impressionTracked && (
        <div className="text-xs text-success mt-1">
          ✓ Impression tracked
        </div>
      )}
    </div>
  );
};

// ==========================================
// Example 3: Newsletter Ad Link Generator
// ==========================================

export const generateNewsletterAdLink = (params: {
  adId: string;
  campaignId?: string;
  newsletterId?: string;
  creatorId: string;
  destinationUrl: string;
}) => {
  const { adId, campaignId, newsletterId, creatorId, destinationUrl } = params;
  
  const queryParams = new URLSearchParams({
    url: destinationUrl,
    creator: creatorId,
  });
  
  if (campaignId) queryParams.set('campaign', campaignId);
  if (newsletterId) queryParams.set('newsletter', newsletterId);
  
  return `https://seeksy.io/ad/click/${adId}?${queryParams.toString()}`;
};

// Usage in newsletter template:
const newsletterAdLinkExample = generateNewsletterAdLink({
  adId: 'ad-newsletter-001',
  campaignId: 'campaign-winter-sale',
  newsletterId: 'newsletter-123',
  creatorId: 'creator-abc',
  destinationUrl: 'https://advertiser.com/product',
});
// Result: https://seeksy.io/ad/click/ad-newsletter-001?url=https://advertiser.com/product&creator=creator-abc&campaign=campaign-winter-sale&newsletter=newsletter-123

// ==========================================
// Example 4: Video Player Pre-roll Ad
// ==========================================

export const VideoPreRollAdExample = () => {
  useEffect(() => {
    const handlePreRollAd = async () => {
      const adConfig = {
        adId: 'video-pre-roll-001',
        campaignId: 'video-campaign-q1',
        episodeId: 'video-episode-456',
        creatorId: 'creator-xyz',
      };
      
      // Simulate video ad playback
      const adStartTime = Date.now();
      
      // Your video player ad logic...
      // await playVideoAd(adConfig);
      
      const adEndTime = Date.now();
      const playbackMs = adEndTime - adStartTime;
      
      await trackVASTAdImpression({
        ...adConfig,
        slotType: 'pre-roll',
        playbackMs,
        fullyListened: playbackMs >= 15000, // 15 second ad
      });
    };
    
    // Call when video loads
    handlePreRollAd();
  }, []);

  return null;
};

// ==========================================
// Example 5: Manual Blog Ad Tracking
// ==========================================

export const ManualBlogAdTracking = () => {
  const handleManualTrack = async () => {
    await trackBlogAdImpression({
      adId: 'blog-sidebar-ad-001',
      campaignId: 'blog-campaign-summer',
      blogPostId: 'blog-post-789',
      creatorId: 'creator-blog',
    });
  };

  return (
    <button onClick={handleManualTrack}>
      Track Blog Ad Manually
    </button>
  );
};

// ==========================================
// Configuration Example: VAST Ad Slots
// ==========================================

export const PODCAST_EPISODE_VAST_CONFIG = {
  preRoll: {
    adId: 'vast-pre-001',
    vastTagUrl: 'https://vast.example.com/pre-roll',
    slotType: 'pre-roll' as const,
    maxDurationSeconds: 15,
  },
  midRoll: {
    adId: 'vast-mid-001',
    vastTagUrl: 'https://vast.example.com/mid-roll',
    slotType: 'mid-roll' as const,
    timestampSeconds: 600, // 10 minutes in
    maxDurationSeconds: 30,
  },
  postRoll: {
    adId: 'vast-post-001',
    vastTagUrl: 'https://vast.example.com/post-roll',
    slotType: 'post-roll' as const,
    maxDurationSeconds: 15,
  },
};
