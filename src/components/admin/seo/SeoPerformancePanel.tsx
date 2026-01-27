import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export function SeoPerformancePanel({ routePath }: SeoPerformancePanelProps) {
  // This panel requires google_connections and gsc_page_daily tables which may not exist
  // For now, show a placeholder since these tables weren't created in the migration
  
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

  // Show connect analytics prompt since tables don't exist
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
          Connect Google Analytics to see page performance metrics for: <code className="text-xs">{routePath}</code>
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
