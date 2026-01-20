import { supabase } from "@/integrations/supabase/client";

export interface YouTubeVideoMetrics {
  videoId: string;
  date: string;
  views: number;
  impressions: number;
  estimatedMinutesWatched: number;
  estimatedRevenue?: number;
  averageViewDuration: number;
  clicks?: number;
}

export interface YouTubeSyncResult {
  success: boolean;
  videosProcessed: number;
  rowsInserted: number;
  errors: string[];
}

/**
 * YouTube Analytics API integration
 * Fetches daily metrics for tracked videos and imports into external_platform_ad_stats
 */
export class YouTubeAnalyticsService {
  private accessToken: string | null = null;

  /**
   * Initialize with OAuth access token
   */
  async initialize(): Promise<boolean> {
    try {
      // Fetch active YouTube account credentials
      const { data: account, error } = await supabase
        .from('external_platform_accounts')
        .select('*')
        .eq('platform', 'youtube')
        .eq('is_active', true)
        .single();

      if (error || !account) {
        console.error('No active YouTube account found:', error);
        return false;
      }

      // Check if token is expired
      if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
        // Token expired, need to refresh
        const refreshed = await this.refreshAccessToken(account.refresh_token);
        if (!refreshed) {
          return false;
        }
      } else {
        this.accessToken = account.access_token;
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize YouTube Analytics:', error);
      return false;
    }
  }

  /**
   * Refresh OAuth access token using refresh token
   */
  private async refreshAccessToken(refreshToken: string): Promise<boolean> {
    try {
      // Call edge function to refresh token (keeps client_secret secure)
      const { data, error } = await supabase.functions.invoke('youtube-refresh-token', {
        body: { refreshToken }
      });

      if (error || !data?.access_token) {
        console.error('Failed to refresh YouTube token:', error);
        return false;
      }

      this.accessToken = data.access_token;

      // Update stored credentials
      await supabase
        .from('external_platform_accounts')
        .update({
          access_token: data.access_token,
          token_expires_at: new Date(Date.now() + (data.expires_in * 1000)).toISOString()
        })
        .eq('platform', 'youtube')
        .eq('is_active', true);

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  /**
   * Fetch metrics for a video for a date range
   */
  async fetchVideoMetrics(
    videoId: string,
    startDate: string,
    endDate: string
  ): Promise<YouTubeVideoMetrics[]> {
    if (!this.accessToken) {
      throw new Error('YouTube Analytics not initialized');
    }

    try {
      const response = await fetch(
        `https://youtubeanalytics.googleapis.com/v2/reports?` +
        new URLSearchParams({
          ids: 'channel==MINE',
          startDate,
          endDate,
          metrics: 'views,estimatedMinutesWatched,averageViewDuration,cardImpressions,cardClicks',
          dimensions: 'day,video',
          filters: `video==${videoId}`,
          sort: 'day'
        }),
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Parse YouTube Analytics response
      const metrics: YouTubeVideoMetrics[] = [];
      if (data.rows) {
        for (const row of data.rows) {
          metrics.push({
            videoId: row[1], // video dimension
            date: row[0], // day dimension (YYYY-MM-DD)
            views: row[2] || 0,
            estimatedMinutesWatched: row[3] || 0,
            averageViewDuration: row[4] || 0,
            impressions: row[5] || 0,
            clicks: row[6] || 0
          });
        }
      }

      return metrics;
    } catch (error) {
      console.error('Failed to fetch YouTube metrics:', error);
      throw error;
    }
  }

  /**
   * Sync YouTube video metrics to external_platform_ad_stats
   */
  async syncVideoStats(
    videoId: string,
    startDate: string,
    endDate: string
  ): Promise<{ rowsInserted: number; errors: string[] }> {
    const errors: string[] = [];
    let rowsInserted = 0;

    try {
      // Fetch content mapping to link video to internal campaign/episode
      const { data: mapping } = await supabase
        .from('external_content_mapping')
        .select('*')
        .eq('platform', 'youtube')
        .eq('external_content_id', videoId)
        .single();

      // Fetch metrics from YouTube API
      const metrics = await this.fetchVideoMetrics(videoId, startDate, endDate);

      // Insert/update stats for each day
      for (const metric of metrics) {
        try {
          const { error } = await supabase
            .from('external_platform_ad_stats')
            .upsert([{
              platform: 'youtube',
              source_type: 'youtube_campaign',
              external_content_id: videoId,
              date: metric.date,
              impressions: metric.impressions,
              views_or_listens: metric.views,
              clicks: metric.clicks || 0,
              completed_plays: 0, // YouTube doesn't provide this directly
              watch_time_ms: Math.round(metric.estimatedMinutesWatched * 60 * 1000),
              estimated_revenue: metric.estimatedRevenue || null,
              ad_campaign_id: mapping?.ad_campaign_id || null,
              episode_id: mapping?.episode_id || null,
              video_id: mapping?.video_id || null,
              raw_payload: JSON.parse(JSON.stringify(metric))
            }]);

          if (error) {
            errors.push(`Failed to insert stats for ${videoId} on ${metric.date}: ${error.message}`);
          } else {
            rowsInserted++;
          }
        } catch (err) {
          errors.push(`Error processing metric for ${videoId} on ${metric.date}: ${err}`);
        }
      }
    } catch (error) {
      errors.push(`Failed to sync video ${videoId}: ${error}`);
    }

    return { rowsInserted, errors };
  }

  /**
   * Sync multiple videos for a date range
   */
  async syncMultipleVideos(
    videoIds: string[],
    startDate: string,
    endDate: string
  ): Promise<YouTubeSyncResult> {
    const initialized = await this.initialize();
    if (!initialized) {
      return {
        success: false,
        videosProcessed: 0,
        rowsInserted: 0,
        errors: ['Failed to initialize YouTube Analytics']
      };
    }

    let totalRowsInserted = 0;
    const allErrors: string[] = [];

    for (const videoId of videoIds) {
      const { rowsInserted, errors } = await this.syncVideoStats(videoId, startDate, endDate);
      totalRowsInserted += rowsInserted;
      allErrors.push(...errors);
    }

    return {
      success: allErrors.length === 0,
      videosProcessed: videoIds.length,
      rowsInserted: totalRowsInserted,
      errors: allErrors
    };
  }
}

export const youtubeAnalytics = new YouTubeAnalyticsService();
