# External Platform Ad Analytics Ingestion

## Overview

Seeksy ingests ad performance data from external platforms (Spotify, Apple Podcasts, YouTube) to provide unified financial reporting across all distribution channels. This system normalizes external platform metrics into a consistent schema and integrates with the CFO Dashboard and Monetization Engine.

---

## Database Schema

### `external_platform_ad_stats`

Stores daily performance metrics for ads running on external platforms.

**Key Fields:**
- `platform`: youtube | spotify | apple_podcasts | other
- `source_type`: youtube_campaign | spotify_campaign | apple_campaign | other
- `external_content_id`: Platform-specific video/episode ID
- `date`: Stats date (YYYY-MM-DD)
- `impressions`, `views_or_listens`, `clicks`, `completed_plays`
- `watch_time_ms` / `listen_time_ms`: Engagement duration
- `estimated_revenue`: Platform-reported revenue (if available)
- `ad_campaign_id`, `episode_id`, `video_id`: Links to internal Seeksy content
- `raw_payload`: Complete platform response (JSONB) for auditing

**Indexes:**
- `(platform, date)` - Platform-level reporting
- `(ad_campaign_id, date)` - Campaign performance tracking
- `(episode_id, date)` - Episode-level analytics

### `external_content_mapping`

Maps external platform IDs to internal Seeksy entities.

**Fields:**
- `platform`, `external_content_id`
- `episode_id`, `video_id`, `ad_campaign_id`

**Purpose:** Links YouTube video IDs, Spotify episode IDs, etc. to Seeksy campaigns and episodes for unified reporting.

### `external_platform_accounts`

Stores OAuth credentials for API integrations.

**Fields:**
- `platform`, `access_token`, `refresh_token`, `token_expires_at`
- `external_account_id`, `is_active`

---

## Import Flows

### 1. YouTube API Sync (Automated)

**Edge Function:** `supabase/functions/sync-youtube-ad-stats`

**Process:**
1. Fetch active YouTube OAuth account from `external_platform_accounts`
2. Check token expiration, refresh if needed
3. Call YouTube Analytics API for specified video IDs and date range
4. Fetch metrics: views, impressions, watch time, clicks
5. Map to `external_platform_ad_stats` with internal campaign/episode links
6. Upsert daily stats per `(platform, external_content_id, date)`

**Admin UI:** `/admin/ad-analytics-import` → YouTube API Sync tab

**Configuration:**
- Requires YouTube OAuth setup in `external_platform_accounts`
- Environment variables: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`

### 2. Spotify & Apple CSV Import (Manual)

**CSV Importer:** `src/lib/importers/externalAdCsvImporter.ts`

**Expected CSV Formats:**

**Spotify:**
```csv
date,episode_id,impressions,listens,completion_rate,listen_time_ms
2025-01-15,ep_123456,1500,1200,85,3600000
```

**Apple Podcasts:**
```csv
date,episode_id,impressions,plays,completed_plays,listen_time_ms
2025-01-15,ep_abc123,2000,1600,1400,4800000
```

**Process:**
1. Admin uploads CSV at `/admin/ad-analytics-import`
2. Select platform (Spotify or Apple Podcasts)
3. Parser transforms CSV rows to `ExternalAdStatsRow` format
4. Fetch `external_content_mapping` to link to internal IDs
5. Upsert into `external_platform_ad_stats`
6. Display import summary with errors

**Admin UI:** `/admin/ad-analytics-import` → CSV Import tab

---

## Analytics & Reporting

### Helper Module: `src/lib/analytics/externalAdStats.ts`

**Functions:**

- `getExternalStatsByEpisode(episodeId, dateRange)` - Episode-level external performance
- `getExternalStatsByCampaign(campaignId, dateRange)` - Campaign-level external metrics
- `getExternalStatsSummary(dateRange)` - Platform-wide aggregation
- `getCombinedStatsByEpisode(episodeId, dateRange)` - Combines on-Seeksy + external stats

**Aggregation Output:**
```typescript
{
  totalImpressions: number,
  totalViewsOrListens: number,
  totalClicks: number,
  totalEstimatedRevenue: number,
  platformBreakdown: [
    { platform: 'seeksy', impressions: 1500, revenue: 37.5 },
    { platform: 'youtube', impressions: 3200, revenue: 0 },
    { platform: 'spotify', impressions: 1200, revenue: 0 }
  ]
}
```

---

## Integration with Monetization Engine

### CFO Dashboard Integration

External platform stats integrate into existing CFO Dashboard views:

**Financial Overview:**
- Combines on-Seeksy and external impressions
- Displays platform breakdown chart
- Shows combined revenue estimates

**Episode Analytics:**
- Separate cards for On-Seeksy vs External vs Combined
- Platform-specific metrics (YouTube views, Spotify listens)

**Campaign Performance:**
- Cross-platform impression tracking
- Total reach across all distribution channels

### Revenue Calculation

**On-Seeksy Revenue:** CPM-based ($25 default per 1,000 impressions)

**External Revenue:** Platform-reported `estimated_revenue` when available, otherwise $0

**Total Revenue:** `onSeeksyRevenue + externalPlatformRevenue`

---

## Limitations & Future Roadmap

### Current Limitations

1. **Spotify & Apple:** Manual CSV import only
2. **Revenue Data:** YouTube/Spotify don't expose ad revenue via API
3. **Real-time Sync:** YouTube API is batch-only (not real-time)
4. **Attribution:** External impressions not linked to specific Seeksy ad campaigns (only episodes)

### Future Enhancements

1. **Spotify API Integration:** Migrate from CSV to Spotify for Podcasters API
2. **Apple Podcasts Connect API:** Automate Apple import
3. **Revenue Sharing Data:** Partner integrations for actual revenue splits
4. **Real-time Webhooks:** Instant impression tracking from platforms
5. **Cross-platform Attribution:** Link external impressions to specific ad campaigns

---

## Security & Access Control

**RLS Policies:**
- Only `admin` and `super_admin` roles can view/insert external platform stats
- External platform accounts table is admin-only
- OAuth tokens are encrypted at rest

**Admin UI Access:**
- `/admin/ad-analytics-import` requires admin authentication
- CSV upload and YouTube sync are audit-logged

---

## Example Workflow

### Complete Import & Reporting Flow

1. **Admin Setup:**
   - Connect YouTube OAuth account in `external_platform_accounts`
   - Map YouTube video IDs to Seeksy episodes in `external_content_mapping`

2. **YouTube Sync:**
   - Navigate to `/admin/ad-analytics-import`
   - Enter video IDs and date range
   - Click "Sync YouTube Analytics"
   - System fetches daily metrics and inserts into `external_platform_ad_stats`

3. **Spotify/Apple Import:**
   - Download CSV from Spotify for Podcasters
   - Upload to `/admin/ad-analytics-import`
   - Select "Spotify" platform
   - System parses and imports stats

4. **CFO Dashboard View:**
   - Navigate to `/podcasts/:podcastId/stats`
   - View combined on-Seeksy + external performance
   - See platform breakdown chart
   - Analyze total impressions and estimated revenue

5. **Financial Reporting:**
   - CFO Dashboard pulls combined stats
   - Revenue Reports include external platform data
   - Investor spreadsheets show multi-platform reach

---

## API Reference

### Edge Function: `sync-youtube-ad-stats`

**Request:**
```json
{
  "videoIds": ["dQw4w9WgXcQ", "abc123def45"],
  "startDate": "2025-01-01",
  "endDate": "2025-01-31"
}
```

**Response:**
```json
{
  "success": true,
  "videosProcessed": 2,
  "rowsInserted": 62,
  "errors": []
}
```

### Analytics Helper: `externalAdStatsAnalytics`

**Usage:**
```typescript
import { externalAdStatsAnalytics } from '@/lib/analytics/externalAdStats';

const stats = await externalAdStatsAnalytics.getCombinedStatsByEpisode(
  episodeId,
  '2025-01-01',
  '2025-01-31'
);

console.log(stats.totalImpressions); // 5900 (1500 Seeksy + 3200 YouTube + 1200 Spotify)
console.log(stats.platformBreakdown); // Array of per-platform metrics
```

---

## Conclusion

The External Platform Ad Analytics system extends Seeksy's monetization tracking beyond the platform itself, providing comprehensive financial visibility across all content distribution channels. By normalizing external metrics into a unified schema, CFOs and creators gain complete insight into their multi-platform ad performance and revenue potential.
