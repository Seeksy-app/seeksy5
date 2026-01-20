import { useEffect, useRef, useState } from 'react';
import { trackBlogAdImpression } from '@/lib/tracking/adImpressionTracking';

interface UseAdSlotImpressionParams {
  adId: string;
  campaignId?: string;
  blogPostId: string;
  creatorId: string;
  enabled?: boolean;
}

/**
 * Hook to track blog ad impressions when ad slot becomes visible
 * 
 * @example
 * ```typescript
 * const AdSlot = ({ adId, campaignId, blogPostId, creatorId }) => {
 *   const { ref, impressionTracked } = useAdSlotImpression({
 *     adId,
 *     campaignId,
 *     blogPostId,
 *     creatorId,
 *   });
 *   
 *   return (
 *     <div ref={ref}>
 *       <img src={adImageUrl} alt="Advertisement" />
 *     </div>
 *   );
 * };
 * ```
 */
export const useAdSlotImpression = (params: UseAdSlotImpressionParams) => {
  const { adId, campaignId, blogPostId, creatorId, enabled = true } = params;
  const [impressionTracked, setImpressionTracked] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!enabled || impressionTracked || !elementRef.current) {
      return;
    }

    // Track impression when element is 50% visible in viewport
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !impressionTracked) {
            trackBlogAdImpression({
              adId,
              campaignId,
              blogPostId,
              creatorId,
            }).then(() => {
              setImpressionTracked(true);
            }).catch((error) => {
              console.error('Failed to track blog ad impression:', error);
            });
          }
        });
      },
      {
        threshold: 0.5, // 50% visibility
      }
    );

    observerRef.current.observe(elementRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [adId, campaignId, blogPostId, creatorId, enabled, impressionTracked]);

  return {
    ref: elementRef,
    impressionTracked,
  };
};
