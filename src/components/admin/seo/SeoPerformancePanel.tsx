import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Search, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface SeoPerformancePanelProps {
  routePath: string;
}

interface AggregatedMetrics {
  gsc: { clicks: number; impressions: number; ctr: number; position: number } | null;
  ga4: { sessions: number; engagementRate: number; avgEngagementTime: number; conversions: number } | null;
}

const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

function formatPercent(num: number): string {
  return (num * 100).toFixed(1) + '%';
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

function normalizeRoutePath(path: string): string {
  // Remove trailing slash for matching
  return path.replace(/\/$/, '') || '/';
}

export function SeoPerformancePanel({ routePath }: SeoPerformancePanelProps) {
  const normalizedPath = normalizeRoutePath(routePath);
  
  // Check if analytics is connected
  const { data: connection, isLoading: connectionLoading } = useQuery({
    queryKey: ['google-connection', DEFAULT_WORKSPACE_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('google_connections')
        .select('id, access_token')
        .eq('workspace_id', DEFAULT_WORKSPACE_ID)
        .eq('provider', 'google')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  // Fetch 7-day metrics
  const { data: metrics7d, isLoading: loading7d } = useQuery({
    queryKey: ['seo-performance-7d', normalizedPath],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateStr = sevenDaysAgo.toISOString().split('T')[0];

      const [gscRes, ga4Res] = await Promise.all([
        supabase
          .from('gsc_page_daily')
          .select('clicks, impressions, ctr, position')
          .eq('workspace_id', DEFAULT_WORKSPACE_ID)
          .eq('page', normalizedPath)
          .gte('date', dateStr),
        supabase
          .from('ga4_page_daily')
          .select('sessions, engagement_rate, avg_engagement_time, conversions')
          .eq('workspace_id', DEFAULT_WORKSPACE_ID)
          .eq('page_path', normalizedPath)
          .gte('date', dateStr)
      ]);

      const gscData = gscRes.data || [];
      const ga4Data = ga4Res.data || [];

      const gsc = gscData.length > 0 ? {
        clicks: gscData.reduce((sum, r) => sum + (r.clicks || 0), 0),
        impressions: gscData.reduce((sum, r) => sum + (r.impressions || 0), 0),
        ctr: gscData.reduce((sum, r) => sum + (Number(r.ctr) || 0), 0) / gscData.length,
        position: gscData.reduce((sum, r) => sum + (Number(r.position) || 0), 0) / gscData.length
      } : null;

      const ga4 = ga4Data.length > 0 ? {
        sessions: ga4Data.reduce((sum, r) => sum + (r.sessions || 0), 0),
        engagementRate: ga4Data.reduce((sum, r) => sum + (Number(r.engagement_rate) || 0), 0) / ga4Data.length,
        avgEngagementTime: ga4Data.reduce((sum, r) => sum + (Number(r.avg_engagement_time) || 0), 0) / ga4Data.length,
        conversions: ga4Data.reduce((sum, r) => sum + (Number(r.conversions) || 0), 0)
      } : null;

      return { gsc, ga4 } as AggregatedMetrics;
    },
    enabled: !!connection?.access_token
  });

  // Fetch 28-day metrics
  const { data: metrics28d, isLoading: loading28d } = useQuery({
    queryKey: ['seo-performance-28d', normalizedPath],
    queryFn: async () => {
      const twentyEightDaysAgo = new Date();
      twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
      const dateStr = twentyEightDaysAgo.toISOString().split('T')[0];

      const [gscRes, ga4Res] = await Promise.all([
        supabase
          .from('gsc_page_daily')
          .select('clicks, impressions, ctr, position')
          .eq('workspace_id', DEFAULT_WORKSPACE_ID)
          .eq('page', normalizedPath)
          .gte('date', dateStr),
        supabase
          .from('ga4_page_daily')
          .select('sessions, engagement_rate, avg_engagement_time, conversions')
          .eq('workspace_id', DEFAULT_WORKSPACE_ID)
          .eq('page_path', normalizedPath)
          .gte('date', dateStr)
      ]);

      const gscData = gscRes.data || [];
      const ga4Data = ga4Res.data || [];

      const gsc = gscData.length > 0 ? {
        clicks: gscData.reduce((sum, r) => sum + (r.clicks || 0), 0),
        impressions: gscData.reduce((sum, r) => sum + (r.impressions || 0), 0),
        ctr: gscData.reduce((sum, r) => sum + (Number(r.ctr) || 0), 0) / gscData.length,
        position: gscData.reduce((sum, r) => sum + (Number(r.position) || 0), 0) / gscData.length
      } : null;

      const ga4 = ga4Data.length > 0 ? {
        sessions: ga4Data.reduce((sum, r) => sum + (r.sessions || 0), 0),
        engagementRate: ga4Data.reduce((sum, r) => sum + (Number(r.engagement_rate) || 0), 0) / ga4Data.length,
        avgEngagementTime: ga4Data.reduce((sum, r) => sum + (Number(r.avg_engagement_time) || 0), 0) / ga4Data.length,
        conversions: ga4Data.reduce((sum, r) => sum + (Number(r.conversions) || 0), 0)
      } : null;

      return { gsc, ga4 } as AggregatedMetrics;
    },
    enabled: !!connection?.access_token
  });

  const isLoading = connectionLoading || loading7d || loading28d;
  const isConnected = !!connection?.access_token;
  const hasData = metrics7d?.gsc || metrics7d?.ga4 || metrics28d?.gsc || metrics28d?.ga4;

  if (connectionLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Connect Google Analytics to see page performance metrics.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/analytics">
              <ExternalLink className="h-3 w-3 mr-1" />
              Connect Analytics
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!hasData && !isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            No metrics found for this page. Sync analytics data first.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/analytics">
              <ExternalLink className="h-3 w-3 mr-1" />
              Sync Analytics
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const renderMetrics = (metrics: AggregatedMetrics | undefined) => {
    if (!metrics) return null;
    
    return (
      <div className="grid grid-cols-2 gap-4">
        {/* GSC Metrics */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Search className="h-3 w-3" />
            GSC
          </div>
          {metrics.gsc ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Clicks</div>
                <div className="font-medium">{formatNumber(metrics.gsc.clicks)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Impressions</div>
                <div className="font-medium">{formatNumber(metrics.gsc.impressions)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">CTR</div>
                <div className="font-medium">{formatPercent(metrics.gsc.ctr)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Avg Position</div>
                <div className="font-medium">{metrics.gsc.position.toFixed(1)}</div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">—</p>
          )}
        </div>

        {/* GA4 Metrics */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <BarChart3 className="h-3 w-3" />
            GA4
          </div>
          {metrics.ga4 ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Sessions</div>
                <div className="font-medium">{formatNumber(metrics.ga4.sessions)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Engagement</div>
                <div className="font-medium">{formatPercent(metrics.ga4.engagementRate)}</div>
              </div>
              {metrics.ga4.avgEngagementTime > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground">Avg Time</div>
                  <div className="font-medium">{formatSeconds(metrics.ga4.avgEngagementTime)}</div>
                </div>
              )}
              {metrics.ga4.conversions > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground">Conversions</div>
                  <div className="font-medium">{formatNumber(metrics.ga4.conversions)}</div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">—</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/analytics">
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="7d" className="w-full">
            <TabsList className="mb-3 h-8">
              <TabsTrigger value="7d" className="text-xs h-7 px-2">Last 7 days</TabsTrigger>
              <TabsTrigger value="28d" className="text-xs h-7 px-2">Last 28 days</TabsTrigger>
            </TabsList>
            <TabsContent value="7d" className="mt-0">
              {renderMetrics(metrics7d)}
            </TabsContent>
            <TabsContent value="28d" className="mt-0">
              {renderMetrics(metrics28d)}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
