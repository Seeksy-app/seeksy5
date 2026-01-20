import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncRequest {
  videoIds?: string[];
  startDate?: string;
  endDate?: string;
  syncAllTracked?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || !['admin', 'super_admin'].includes(userRole.role)) {
      throw new Error('Admin access required')
    }

    // Parse request
    const { videoIds, startDate, endDate, syncAllTracked }: SyncRequest = await req.json()

    // Default date range: last 30 days
    const end = endDate || new Date().toISOString().split('T')[0]
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Determine which videos to sync
    let videosToSync: string[] = []

    if (syncAllTracked) {
      // Fetch all tracked YouTube videos from content mapping
      const { data: mappings, error: mappingError } = await supabase
        .from('external_content_mapping')
        .select('external_content_id')
        .eq('platform', 'youtube')

      if (mappingError) throw mappingError

      videosToSync = mappings?.map(m => m.external_content_id) || []
    } else if (videoIds && videoIds.length > 0) {
      videosToSync = videoIds
    } else {
      throw new Error('Must provide videoIds or set syncAllTracked=true')
    }

    if (videosToSync.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No videos to sync',
          videosProcessed: 0,
          rowsInserted: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch YouTube OAuth credentials
    const { data: account, error: accountError } = await supabase
      .from('external_platform_accounts')
      .select('*')
      .eq('platform', 'youtube')
      .eq('is_active', true)
      .single()

    if (accountError || !account) {
      throw new Error('No active YouTube account configured')
    }

    // Check token expiration and refresh if needed
    let accessToken = account.access_token

    if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
      // Token expired, refresh it
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('YOUTUBE_CLIENT_ID')!,
          client_secret: Deno.env.get('YOUTUBE_CLIENT_SECRET')!,
          refresh_token: account.refresh_token,
          grant_type: 'refresh_token'
        })
      })

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh YouTube access token')
      }

      const refreshData = await refreshResponse.json()
      accessToken = refreshData.access_token

      // Update stored token
      await supabase
        .from('external_platform_accounts')
        .update({
          access_token: refreshData.access_token,
          token_expires_at: new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString()
        })
        .eq('id', account.id)
    }

    // Sync each video
    let totalRowsInserted = 0
    const errors: string[] = []

    for (const videoId of videosToSync) {
      try {
        // Fetch content mapping
        const { data: mapping } = await supabase
          .from('external_content_mapping')
          .select('*')
          .eq('platform', 'youtube')
          .eq('external_content_id', videoId)
          .single()

        // Fetch YouTube Analytics data
        const analyticsUrl = `https://youtubeanalytics.googleapis.com/v2/reports?` +
          new URLSearchParams({
            ids: 'channel==MINE',
            startDate: start,
            endDate: end,
            metrics: 'views,estimatedMinutesWatched,averageViewDuration,cardImpressions,cardClicks',
            dimensions: 'day,video',
            filters: `video==${videoId}`,
            sort: 'day'
          })

        const analyticsResponse = await fetch(analyticsUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        })

        if (!analyticsResponse.ok) {
          errors.push(`Failed to fetch analytics for ${videoId}: ${analyticsResponse.statusText}`)
          continue
        }

        const analyticsData = await analyticsResponse.json()

        // Insert stats for each day
        if (analyticsData.rows) {
          for (const row of analyticsData.rows) {
            const metric = {
              videoId: row[1],
              date: row[0],
              views: row[2] || 0,
              estimatedMinutesWatched: row[3] || 0,
              averageViewDuration: row[4] || 0,
              impressions: row[5] || 0,
              clicks: row[6] || 0
            }

            const { error: insertError } = await supabase
              .from('external_platform_ad_stats')
              .upsert({
                platform: 'youtube',
                source_type: 'youtube_campaign',
                external_content_id: videoId,
                date: metric.date,
                impressions: metric.impressions,
                views_or_listens: metric.views,
                clicks: metric.clicks,
                completed_plays: 0,
                watch_time_ms: Math.round(metric.estimatedMinutesWatched * 60 * 1000),
                ad_campaign_id: mapping?.ad_campaign_id || null,
                episode_id: mapping?.episode_id || null,
                video_id: mapping?.video_id || null,
                raw_payload: metric
              }, {
                onConflict: 'platform,external_content_id,date'
              })

            if (insertError) {
              errors.push(`Failed to insert stats for ${videoId} on ${metric.date}: ${insertError.message}`)
            } else {
              totalRowsInserted++
            }
          }
        }
      } catch (err) {
        errors.push(`Error processing video ${videoId}: ${err}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        videosProcessed: videosToSync.length,
        rowsInserted: totalRowsInserted,
        errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error syncing YouTube stats:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
