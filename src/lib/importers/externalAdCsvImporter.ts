import { supabase } from "@/integrations/supabase/client";
import Papa from 'papaparse';

export interface CsvImportResult {
  success: boolean;
  rowsProcessed: number;
  rowsInserted: number;
  errors: string[];
}

export interface ExternalAdStatsRow {
  platform: 'spotify' | 'apple_podcasts' | 'youtube' | 'other';
  externalContentId: string;
  date: string;
  impressions: number;
  viewsOrListens: number;
  clicks?: number;
  completedPlays?: number;
  watchTimeMs?: number;
  listenTimeMs?: number;
  estimatedRevenue?: number;
  adCampaignId?: string;
  episodeId?: string;
  videoId?: string;
}

/**
 * CSV column mappings for different platforms
 */
const PLATFORM_MAPPINGS = {
  spotify: {
    expectedColumns: ['date', 'episode_id', 'impressions', 'listens', 'completion_rate'],
    transform: (row: any): Partial<ExternalAdStatsRow> => ({
      externalContentId: row.episode_id || row['Episode ID'] || '',
      date: row.date || row['Date'] || '',
      impressions: parseInt(row.impressions || row['Impressions'] || '0', 10),
      viewsOrListens: parseInt(row.listens || row['Listens'] || '0', 10),
      completedPlays: parseInt(row.completion_rate || row['Completion Rate'] || '0', 10),
      listenTimeMs: parseInt(row.listen_time_ms || row['Listen Time (ms)'] || '0', 10)
    })
  },
  apple_podcasts: {
    expectedColumns: ['date', 'episode_id', 'impressions', 'plays', 'average_consumption'],
    transform: (row: any): Partial<ExternalAdStatsRow> => ({
      externalContentId: row.episode_id || row['Episode ID'] || '',
      date: row.date || row['Date'] || '',
      impressions: parseInt(row.impressions || row['Impressions'] || '0', 10),
      viewsOrListens: parseInt(row.plays || row['Plays'] || '0', 10),
      completedPlays: parseInt(row.completed_plays || row['Completed Plays'] || '0', 10),
      listenTimeMs: parseInt(row.listen_time_ms || row['Listen Time (ms)'] || '0', 10)
    })
  },
  youtube: {
    expectedColumns: ['date', 'video_id', 'impressions', 'views', 'watch_time_minutes'],
    transform: (row: any): Partial<ExternalAdStatsRow> => ({
      externalContentId: row.video_id || row['Video ID'] || '',
      date: row.date || row['Date'] || '',
      impressions: parseInt(row.impressions || row['Impressions'] || '0', 10),
      viewsOrListens: parseInt(row.views || row['Views'] || '0', 10),
      clicks: parseInt(row.clicks || row['Clicks'] || '0', 10),
      watchTimeMs: Math.round((parseFloat(row.watch_time_minutes || row['Watch Time (Minutes)'] || '0')) * 60 * 1000)
    })
  }
};

/**
 * External Ad CSV Importer
 * Handles CSV uploads for Spotify, Apple Podcasts, and YouTube ad stats
 */
export class ExternalAdCsvImporter {
  /**
   * Parse and import CSV file
   */
  async importCsv(
    file: File,
    platform: 'spotify' | 'apple_podcasts' | 'youtube'
  ): Promise<CsvImportResult> {
    const errors: string[] = [];
    let rowsProcessed = 0;
    let rowsInserted = 0;

    try {
      // Parse CSV
      const csvData = await this.parseCsvFile(file);
      
      if (!csvData || csvData.length === 0) {
        return {
          success: false,
          rowsProcessed: 0,
          rowsInserted: 0,
          errors: ['CSV file is empty or invalid']
        };
      }

      // Validate columns
      const mapping = PLATFORM_MAPPINGS[platform];
      if (!mapping) {
        return {
          success: false,
          rowsProcessed: 0,
          rowsInserted: 0,
          errors: [`Unsupported platform: ${platform}`]
        };
      }

      // Process each row
      for (const row of csvData) {
        rowsProcessed++;
        try {
          const transformed = mapping.transform(row);
          
          // Validate required fields
          if (!transformed.externalContentId || !transformed.date) {
            errors.push(`Row ${rowsProcessed}: Missing required fields (content ID or date)`);
            continue;
          }

          // Fetch content mapping to link to internal IDs
          const mappingResult = await (supabase as any)
            .from('external_content_mapping')
            .select('*')
            .eq('platform', platform)
            .eq('external_content_id', transformed.externalContentId)
            .single();
          
          const contentMapping = mappingResult.data as any;

          // Insert into external_platform_ad_stats
          const insertResult = await (supabase as any)
            .from('external_platform_ad_stats')
            .upsert([{
              platform,
              source_type: `${platform}_campaign`,
              external_content_id: transformed.externalContentId,
              date: transformed.date,
              impressions: transformed.impressions || 0,
              views_or_listens: transformed.viewsOrListens || 0,
              clicks: transformed.clicks || 0,
              completed_plays: transformed.completedPlays || 0,
              watch_time_ms: transformed.watchTimeMs || 0,
              listen_time_ms: transformed.listenTimeMs || 0,
              estimated_revenue: transformed.estimatedRevenue || null,
              ad_campaign_id: contentMapping?.ad_campaign_id || null,
              episode_id: contentMapping?.episode_id || null,
              video_id: contentMapping?.video_id || null,
              raw_payload: JSON.parse(JSON.stringify(row))
            }]);

          if (insertResult.error) {
            errors.push(`Row ${rowsProcessed}: ${insertResult.error.message}`);
          } else {
            rowsInserted++;
          }
        } catch (err) {
          errors.push(`Row ${rowsProcessed}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        rowsProcessed,
        rowsInserted,
        errors
      };
    } catch (error) {
      return {
        success: false,
        rowsProcessed,
        rowsInserted,
        errors: [`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Parse CSV file using PapaParse
   */
  private parseCsvFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  /**
   * Get example CSV format for a platform
   */
  getExampleCsvFormat(platform: 'spotify' | 'apple_podcasts' | 'youtube'): string {
    const examples = {
      spotify: `date,episode_id,impressions,listens,completion_rate,listen_time_ms
2025-01-15,ep_123456,1500,1200,85,3600000
2025-01-16,ep_123456,1800,1400,82,4200000`,
      apple_podcasts: `date,episode_id,impressions,plays,completed_plays,listen_time_ms
2025-01-15,ep_abc123,2000,1600,1400,4800000
2025-01-16,ep_abc123,2200,1750,1500,5100000`,
      youtube: `date,video_id,impressions,views,clicks,watch_time_minutes
2025-01-15,dQw4w9WgXcQ,5000,3200,150,160.5
2025-01-16,dQw4w9WgXcQ,5500,3500,175,185.2`
    };

    return examples[platform] || '';
  }
}

export const externalAdCsvImporter = new ExternalAdCsvImporter();
