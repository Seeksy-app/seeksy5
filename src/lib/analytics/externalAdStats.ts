import { supabase } from "@/integrations/supabase/client";

export interface ExternalStatsAggregation {
  totalImpressions: number;
  totalViewsOrListens: number;
  totalClicks: number;
  totalCompletedPlays: number;
  totalWatchTimeMs: number;
  totalListenTimeMs: number;
  totalEstimatedRevenue: number;
  platformBreakdown: {
    platform: string;
    impressions: number;
    viewsOrListens: number;
    estimatedRevenue: number;
  }[];
}

export interface CombinedAdStats {
  onSeeksyImpressions: number;
  externalPlatformImpressions: number;
  totalImpressions: number;
  onSeeksyEstimatedRevenue: number;
  externalPlatformEstimatedRevenue: number;
  totalEstimatedRevenue: number;
  platformBreakdown: {
    platform: string;
    impressions: number;
    revenue: number;
  }[];
}

/**
 * External Ad Stats Analytics Helper
 * Aggregates external platform stats for episodes, campaigns, and global views
 */
export class ExternalAdStatsAnalytics {
  /**
   * Get external stats for a specific episode
   */
  async getExternalStatsByEpisode(
    episodeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ExternalStatsAggregation> {
    try {
      let query = (supabase as any)
        .from('external_platform_ad_stats')
        .select('*')
        .eq('episode_id', episodeId);

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const result = await query;

      if (result.error) throw result.error;

      return this.aggregateStats((result.data as any[]) || []);
    } catch (error) {
      console.error('Failed to fetch external stats by episode:', error);
      return this.getEmptyAggregation();
    }
  }

  /**
   * Get external stats for a specific campaign
   */
  async getExternalStatsByCampaign(
    campaignId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ExternalStatsAggregation> {
    try {
      let query = (supabase as any)
        .from('external_platform_ad_stats')
        .select('*')
        .eq('ad_campaign_id', campaignId);

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const result = await query;

      if (result.error) throw result.error;

      return this.aggregateStats((result.data as any[]) || []);
    } catch (error) {
      console.error('Failed to fetch external stats by campaign:', error);
      return this.getEmptyAggregation();
    }
  }

  /**
   * Get external stats summary (all platforms)
   */
  async getExternalStatsSummary(
    startDate?: string,
    endDate?: string
  ): Promise<ExternalStatsAggregation> {
    try {
      let query = (supabase as any)
        .from('external_platform_ad_stats')
        .select('*');

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const result = await query;

      if (result.error) throw result.error;

      return this.aggregateStats((result.data as any[]) || []);
    } catch (error) {
      console.error('Failed to fetch external stats summary:', error);
      return this.getEmptyAggregation();
    }
  }

  /**
   * Get combined stats (on-Seeksy + external platforms)
   */
  async getCombinedStatsByEpisode(
    episodeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<CombinedAdStats> {
    try {
      // Fetch on-Seeksy impressions
      let onSeeksyQuery = (supabase as any)
        .from('ad_impressions')
        .select('*')
        .eq('episode_id', episodeId)
        .eq('is_valid', true);

      if (startDate) {
        onSeeksyQuery = onSeeksyQuery.gte('played_at', startDate);
      }
      if (endDate) {
        onSeeksyQuery = onSeeksyQuery.lte('played_at', endDate);
      }

      const result = await onSeeksyQuery;
      const onSeeksyData = result.data as any[];
      const onSeeksyError = result.error;
      
      if (onSeeksyError) throw onSeeksyError;

      const onSeeksyImpressions = onSeeksyData?.length || 0;
      const onSeeksyRevenue = this.estimateOnSeeksyRevenue(onSeeksyImpressions);

      // Fetch external platform stats
      const externalStats = await this.getExternalStatsByEpisode(episodeId, startDate, endDate);

      return {
        onSeeksyImpressions,
        externalPlatformImpressions: externalStats.totalImpressions,
        totalImpressions: onSeeksyImpressions + externalStats.totalImpressions,
        onSeeksyEstimatedRevenue: onSeeksyRevenue,
        externalPlatformEstimatedRevenue: externalStats.totalEstimatedRevenue,
        totalEstimatedRevenue: onSeeksyRevenue + externalStats.totalEstimatedRevenue,
        platformBreakdown: [
          {
            platform: 'seeksy',
            impressions: onSeeksyImpressions,
            revenue: onSeeksyRevenue
          },
          ...externalStats.platformBreakdown.map(p => ({
            platform: p.platform,
            impressions: p.impressions,
            revenue: p.estimatedRevenue
          }))
        ]
      };
    } catch (error) {
      console.error('Failed to fetch combined stats:', error);
      return {
        onSeeksyImpressions: 0,
        externalPlatformImpressions: 0,
        totalImpressions: 0,
        onSeeksyEstimatedRevenue: 0,
        externalPlatformEstimatedRevenue: 0,
        totalEstimatedRevenue: 0,
        platformBreakdown: []
      };
    }
  }

  /**
   * Aggregate raw stats into summary
   */
  private aggregateStats(stats: any[]): ExternalStatsAggregation {
    const platformMap = new Map<string, {
      impressions: number;
      viewsOrListens: number;
      revenue: number;
    }>();

    let totalImpressions = 0;
    let totalViewsOrListens = 0;
    let totalClicks = 0;
    let totalCompletedPlays = 0;
    let totalWatchTimeMs = 0;
    let totalListenTimeMs = 0;
    let totalEstimatedRevenue = 0;

    for (const stat of stats) {
      totalImpressions += stat.impressions || 0;
      totalViewsOrListens += stat.views_or_listens || 0;
      totalClicks += stat.clicks || 0;
      totalCompletedPlays += stat.completed_plays || 0;
      totalWatchTimeMs += stat.watch_time_ms || 0;
      totalListenTimeMs += stat.listen_time_ms || 0;
      totalEstimatedRevenue += parseFloat(stat.estimated_revenue || 0);

      // Platform breakdown
      const existing = platformMap.get(stat.platform) || {
        impressions: 0,
        viewsOrListens: 0,
        revenue: 0
      };

      platformMap.set(stat.platform, {
        impressions: existing.impressions + (stat.impressions || 0),
        viewsOrListens: existing.viewsOrListens + (stat.views_or_listens || 0),
        revenue: existing.revenue + parseFloat(stat.estimated_revenue || 0)
      });
    }

    return {
      totalImpressions,
      totalViewsOrListens,
      totalClicks,
      totalCompletedPlays,
      totalWatchTimeMs,
      totalListenTimeMs,
      totalEstimatedRevenue,
      platformBreakdown: Array.from(platformMap.entries()).map(([platform, data]) => ({
        platform,
        impressions: data.impressions,
        viewsOrListens: data.viewsOrListens,
        estimatedRevenue: data.revenue
      }))
    };
  }

  /**
   * Estimate on-Seeksy revenue (using CPM model)
   */
  private estimateOnSeeksyRevenue(impressions: number): number {
    const defaultCpm = 25; // $25 CPM
    return (impressions / 1000) * defaultCpm;
  }

  /**
   * Get empty aggregation result
   */
  private getEmptyAggregation(): ExternalStatsAggregation {
    return {
      totalImpressions: 0,
      totalViewsOrListens: 0,
      totalClicks: 0,
      totalCompletedPlays: 0,
      totalWatchTimeMs: 0,
      totalListenTimeMs: 0,
      totalEstimatedRevenue: 0,
      platformBreakdown: []
    };
  }
}

export const externalAdStatsAnalytics = new ExternalAdStatsAnalytics();
