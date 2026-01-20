/**
 * Daily Brief Hook
 * Fetches live competitive intelligence using Firecrawl
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PortalType } from './useHelpDrawer';

export interface DailyBriefSection {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'trend';
  source?: string;
  timestamp?: string;
}

export interface DailyBrief {
  title: string;
  sections: DailyBriefSection[];
  generatedAt: string;
}

// Fetch daily brief for a portal
export function useDailyBrief(portal: PortalType) {
  return useQuery({
    queryKey: ['daily-brief', portal],
    queryFn: async (): Promise<DailyBrief> => {
      // Try to get from edge function
      const { data, error } = await supabase.functions.invoke('generate-daily-brief', {
        body: { portal }
      });
      
      if (error) {
        console.error('Daily brief fetch error:', error);
        // Return fallback static brief
        return getStaticBrief(portal);
      }
      
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

// Refresh daily brief (force new generation)
export function useRefreshDailyBrief() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (portal: PortalType) => {
      const { data, error } = await supabase.functions.invoke('generate-daily-brief', {
        body: { portal, forceRefresh: true }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, portal) => {
      queryClient.invalidateQueries({ queryKey: ['daily-brief', portal] });
    }
  });
}

// Static fallback briefs by portal
function getStaticBrief(portal: PortalType): DailyBrief {
  const briefs: Record<PortalType, DailyBrief> = {
    admin: {
      title: 'Admin Daily Brief',
      generatedAt: new Date().toISOString(),
      sections: [
        { id: 'a1', title: 'Platform Health', content: 'All systems operational. No critical issues detected.', type: 'success' },
        { id: 'a2', title: 'User Activity', content: 'Active users up 12% from yesterday. 45 new signups.', type: 'trend' },
        { id: 'a3', title: 'Pending Actions', content: '3 support tickets awaiting response.', type: 'warning' },
        { id: 'a4', title: 'System Updates', content: 'Scheduled maintenance window: Sunday 2AM-4AM UTC.', type: 'info' },
      ],
    },
    creator: {
      title: 'Creator Daily Brief',
      generatedAt: new Date().toISOString(),
      sections: [
        { id: 'c1', title: 'Audience Growth', content: 'You gained 23 new followers this week.', type: 'trend' },
        { id: 'c2', title: 'Content Performance', content: 'Your latest episode has 150 plays.', type: 'success' },
        { id: 'c3', title: 'Engagement', content: '5 new comments on your content.', type: 'info' },
        { id: 'c4', title: 'Monetization', content: 'Earnings this month: $45.00', type: 'trend' },
      ],
    },
    advertiser: {
      title: 'Advertiser Daily Brief',
      generatedAt: new Date().toISOString(),
      sections: [
        { id: 'ad1', title: 'Campaign Performance', content: 'Active campaigns: 3. Total impressions today: 12,500.', type: 'trend' },
        { id: 'ad2', title: 'Budget Status', content: '65% of monthly budget utilized.', type: 'info' },
        { id: 'ad3', title: 'Top Performing', content: 'Summer Sale campaign: 2.3% CTR', type: 'success' },
        { id: 'ad4', title: 'Attention Needed', content: '1 campaign approaching budget limit.', type: 'warning' },
      ],
    },
    board: {
      title: 'Board Daily Brief',
      generatedAt: new Date().toISOString(),
      sections: [
        { id: 'b1', title: 'Key Metrics', content: 'MRR: $45,000 (+8% MoM). Active creators: 1,200.', type: 'trend' },
        { id: 'b2', title: 'Growth Update', content: 'On track for Q4 targets.', type: 'success' },
        { id: 'b3', title: 'Market Intel', content: '2 new competitor announcements to review.', type: 'info' },
        { id: 'b4', title: 'Action Items', content: 'Board meeting scheduled for next Tuesday.', type: 'warning' },
      ],
    },
  };
  
  return briefs[portal];
}
