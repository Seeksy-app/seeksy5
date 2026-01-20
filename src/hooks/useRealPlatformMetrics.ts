import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformMetrics {
  totalCreators: number;
  totalPodcasts: number;
  totalEpisodes: number;
  monthlyActiveUsers: number;
  newSignups30d: number;
  totalCampaigns: number;
  totalEvents: number;
  revenueData: {
    total: number;
    subscriptions: number;
    advertising: number;
  };
}

export function useRealPlatformMetrics() {
  return useQuery({
    queryKey: ['real-platform-metrics'],
    queryFn: async () => {
      // Fetch all metrics in parallel
      const [
        profilesResult,
        podcastsResult,
        episodesResult,
        campaignsResult,
        eventsResult,
        recentSignupsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('podcasts').select('id', { count: 'exact', head: true }),
        supabase.from('episodes').select('id', { count: 'exact', head: true }),
        supabase.from('ad_campaigns').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      // Fetch revenue data (from subscriptions if available)
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('plan_id')
        .eq('status', 'active');

      const metrics: PlatformMetrics = {
        totalCreators: profilesResult.count || 0,
        totalPodcasts: podcastsResult.count || 0,
        totalEpisodes: episodesResult.count || 0,
        monthlyActiveUsers: profilesResult.count || 0, // Placeholder - would need activity tracking
        newSignups30d: recentSignupsResult.count || 0,
        totalCampaigns: campaignsResult.count || 0,
        totalEvents: eventsResult.count || 0,
        revenueData: {
          total: 0,
          subscriptions: (subscriptionData?.length || 0) * 29, // Estimate based on avg plan price
          advertising: 0,
        },
      };

      return metrics;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Formatting helpers
export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function formatCurrency(num: number): string {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
}
