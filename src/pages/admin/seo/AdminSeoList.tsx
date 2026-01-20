import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Search, Plus, Image, Edit2, Loader2, Globe, ArrowUpDown, ExternalLink, Info, Sparkles } from "lucide-react";
import { getScoreProgressColor } from "@/lib/seo/seoScoring";
import { formatDistanceToNow } from "date-fns";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { SeoLinkStatusChip } from "@/components/admin/shared/SeoLinkStatusChip";
import { useSeoAnalyticsConnection, useSeoListMetrics, TimeRange } from "@/hooks/useSeoAnalyticsMetrics";
import { useSeoBaselinesForList } from "@/hooks/useSeoBaselines";
import { useSeoViewMode } from "@/hooks/useSeoViewMode";
import { SeoPerformanceAlertBadges, detectPerformanceAlerts } from "@/components/admin/seo/SeoPerformanceAlerts";
import { SeoExplainChangeDialog } from "@/components/admin/seo/SeoExplainChangeDialog";
import { Skeleton } from "@/components/ui/skeleton";

type SeoStatus = 'all' | 'draft' | 'published' | 'archived';
type SortField = 'updated_at' | 'score' | 'gsc_clicks' | 'gsc_impressions' | 'gsc_ctr' | 'gsc_position' | 'ga4_users' | 'ga4_sessions' | 'ga4_views' | 'ga4_engagement';
type SortDir = 'asc' | 'desc';

function formatNumber(n: number | undefined | null): string {
  if (n == null) return '—';
  return n.toLocaleString();
}

function formatPercent(n: number | undefined | null): string {
  if (n == null) return '—';
  return `${n.toFixed(1)}%`;
}

function formatPosition(n: number | undefined | null): string {
  if (n == null || n === 0) return '—';
  return n.toFixed(1);
}

function AdminSeoListContent() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SeoStatus>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [sortField, setSortField] = useState<SortField>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  
  // Explain dialog state
  const [explainDialogOpen, setExplainDialogOpen] = useState(false);
  const [explainPage, setExplainPage] = useState<{
    id: string;
    name: string;
    path: string;
    gbpLocationId?: string;
  } | null>(null);

  // Fetch SEO pages with GBP link info
  const { data: pages, isLoading } = useQuery({
    queryKey: ['seo-pages', statusFilter, search],
    queryFn: async () => {
      let query = supabase
        .from('seo_pages')
        .select('*')
        .order('updated_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (search.trim()) {
        query = query.or(`page_name.ilike.%${search}%,route_path.ilike.%${search}%,meta_title.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Fetch GBP links for all SEO pages
  const { data: gbpLinks } = useQuery({
    queryKey: ['seo-gbp-links-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_seo_links')
        .select(`
          seo_page_id,
          gbp_location_id,
          sync_status,
          gbp_locations:gbp_location_id (
            id,
            title
          )
        `);
      if (error) throw error;
      const linkMap = new Map<string, { gbpLocationId: string; gbpTitle: string; syncStatus: string }>();
      data?.forEach(link => {
        const location = link.gbp_locations as any;
        if (location) {
          linkMap.set(link.seo_page_id, {
            gbpLocationId: link.gbp_location_id,
            gbpTitle: location.title,
            syncStatus: link.sync_status
          });
        }
      });
      return linkMap;
    }
  });

  // Analytics connection check
  const { data: connectionStatus, isLoading: connectionLoading } = useSeoAnalyticsConnection();

  // Get route paths for metrics lookup
  const routePaths = useMemo(() => pages?.map(p => p.route_path) || [], [pages]);
  
  // Fetch metrics for selected time range (used for display)
  const { data: metricsMap, isLoading: metricsLoading } = useSeoListMetrics(routePaths, timeRange);
  
  // Fetch 7d metrics for alerts calculation
  const { data: metrics7dMap } = useSeoListMetrics(routePaths, '7d');
  
  // Fetch 28d metrics for alerts calculation
  const { data: metrics28dMap } = useSeoListMetrics(routePaths, '28d');
  
  // Fetch baselines for all pages
  const pageIds = useMemo(() => pages?.map(p => p.id) || [], [pages]);
  const { data: baselinesMap } = useSeoBaselinesForList(pageIds);
  
  // Memoized function to get alert metrics for a page
  const getAlertMetrics = useCallback((routePath: string) => {
    const m7d = metrics7dMap?.get(routePath);
    const m28d = metrics28dMap?.get(routePath);
    return {
      metrics7d: m7d ? {
        clicks: m7d.gsc?.clicks,
        ctr: m7d.gsc?.ctr,
        position: m7d.gsc?.position
      } : null,
      metrics28d: m28d ? {
        clicks: m28d.gsc?.clicks,
        ctr: m28d.gsc?.ctr,
        position: m28d.gsc?.position
      } : null
    };
  }, [metrics7dMap, metrics28dMap]);

  // Sort pages
  const sortedPages = useMemo(() => {
    if (!pages) return [];
    return [...pages].sort((a, b) => {
      const metricsA = metricsMap?.get(a.route_path);
      const metricsB = metricsMap?.get(b.route_path);
      let valA: number = 0;
      let valB: number = 0;

      switch (sortField) {
        case 'updated_at':
          valA = new Date(a.updated_at).getTime();
          valB = new Date(b.updated_at).getTime();
          break;
        case 'score':
          valA = a.score || 0;
          valB = b.score || 0;
          break;
        case 'gsc_clicks':
          valA = metricsA?.gsc?.clicks || 0;
          valB = metricsB?.gsc?.clicks || 0;
          break;
        case 'gsc_impressions':
          valA = metricsA?.gsc?.impressions || 0;
          valB = metricsB?.gsc?.impressions || 0;
          break;
        case 'gsc_ctr':
          valA = metricsA?.gsc?.ctr || 0;
          valB = metricsB?.gsc?.ctr || 0;
          break;
        case 'gsc_position':
          // Lower position is better, so reverse
          valA = metricsA?.gsc?.position || 999;
          valB = metricsB?.gsc?.position || 999;
          break;
        case 'ga4_users':
          valA = metricsA?.ga4?.users || 0;
          valB = metricsB?.ga4?.users || 0;
          break;
        case 'ga4_sessions':
          valA = metricsA?.ga4?.sessions || 0;
          valB = metricsB?.ga4?.sessions || 0;
          break;
        case 'ga4_views':
          valA = metricsA?.ga4?.views || 0;
          valB = metricsB?.ga4?.views || 0;
          break;
        case 'ga4_engagement':
          valA = metricsA?.ga4?.engagementRate || 0;
          valB = metricsB?.ga4?.engagementRate || 0;
          break;
      }

      const mult = sortDir === 'asc' ? 1 : -1;
      return (valA - valB) * mult;
    });
  }, [pages, sortField, sortDir, metricsMap]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const SortableHeader = ({ field, children, tooltip }: { field: SortField; children: React.ReactNode; tooltip: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={() => handleSort(field)}
            className="flex items-center gap-1 text-xs font-medium hover:text-foreground transition-colors"
          >
            {children}
            <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'opacity-40'}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const showAnalyticsColumns = connectionStatus?.connected;

  return (
    <div className="container max-w-full py-4 space-y-4 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            SEO Manager
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage SEO metadata for all pages
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/seo/assets')}>
            <Image className="h-4 w-4 mr-2" />
            Manage Assets
          </Button>
          <Button onClick={() => navigate('/admin/seo/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Page SEO
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by route, name, or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SeoStatus)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Time range toggle */}
            {showAnalyticsColumns && (
              <div className="flex border rounded-md overflow-hidden">
                <button
                  onClick={() => setTimeRange('7d')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    timeRange === '7d' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  7d
                </button>
                <button
                  onClick={() => setTimeRange('28d')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    timeRange === '28d' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  28d
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !pages?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Globe className="h-10 w-10 mb-2 opacity-50" />
              <p>No SEO pages found</p>
              <Button variant="link" onClick={() => navigate('/admin/seo/new')}>
                Add your first page
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">GBP</TableHead>
                  <TableHead className="min-w-[140px]">Page Name</TableHead>
                  <TableHead className="min-w-[120px]">Route</TableHead>
                  <TableHead className="w-28">
                    <SortableHeader field="score" tooltip="SEO score based on metadata completeness and quality">
                      Score
                    </SortableHeader>
                  </TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  
                  {/* GSC Columns */}
                  {showAnalyticsColumns ? (
                    <>
                      <TableHead className="w-20 text-center border-l border-border/50">
                        <div className="text-[10px] text-muted-foreground mb-0.5">GSC</div>
                        <SortableHeader field="gsc_clicks" tooltip="Total Google Search clicks to this page in the selected period.">
                          Clicks
                        </SortableHeader>
                      </TableHead>
                      <TableHead className="w-20 text-center">
                        <div className="text-[10px] text-muted-foreground mb-0.5">GSC</div>
                        <SortableHeader field="gsc_impressions" tooltip="Total Google Search impressions in the selected period.">
                          Impr.
                        </SortableHeader>
                      </TableHead>
                      <TableHead className="w-16 text-center">
                        <div className="text-[10px] text-muted-foreground mb-0.5">GSC</div>
                        <SortableHeader field="gsc_ctr" tooltip="Clicks ÷ impressions for the selected period.">
                          CTR
                        </SortableHeader>
                      </TableHead>
                      <TableHead className="w-16 text-center">
                        <div className="text-[10px] text-muted-foreground mb-0.5">GSC</div>
                        <SortableHeader field="gsc_position" tooltip="Average Google Search position (lower is better) for the selected period.">
                          Pos
                        </SortableHeader>
                      </TableHead>
                      
                      {/* GA4 Columns */}
                      <TableHead className="w-20 text-center border-l border-border/50">
                        <div className="text-[10px] text-muted-foreground mb-0.5">GA4</div>
                        <SortableHeader field="ga4_users" tooltip="Total users who viewed this page in the selected period.">
                          Users
                        </SortableHeader>
                      </TableHead>
                      <TableHead className="w-20 text-center">
                        <div className="text-[10px] text-muted-foreground mb-0.5">GA4</div>
                        <SortableHeader field="ga4_sessions" tooltip="Total sessions that included this page in the selected period.">
                          Sessions
                        </SortableHeader>
                      </TableHead>
                      <TableHead className="w-20 text-center">
                        <div className="text-[10px] text-muted-foreground mb-0.5">GA4</div>
                        <SortableHeader field="ga4_views" tooltip="Total page views in the selected period.">
                          Views
                        </SortableHeader>
                      </TableHead>
                      <TableHead className="w-16 text-center">
                        <div className="text-[10px] text-muted-foreground mb-0.5">GA4</div>
                        <SortableHeader field="ga4_engagement" tooltip="Engaged sessions ÷ total sessions for the selected period.">
                          Eng.
                        </SortableHeader>
                      </TableHead>
                    </>
                  ) : (
                    <TableHead className="min-w-[180px] border-l border-border/50">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Info className="h-3.5 w-3.5" />
                        <span className="text-xs">Analytics</span>
                      </div>
                    </TableHead>
                  )}
                  
                  {/* Alerts Column - only if connected */}
                  {showAnalyticsColumns && (
                    <TableHead className="w-20 border-l border-border/50">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs font-medium flex items-center gap-1">
                              Alerts
                              <Info className="h-3 w-3 opacity-50" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs">
                            Performance alerts based on 7d vs 28d metrics
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                  )}
                  
                  <TableHead className="w-24">Updated</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPages.map((page) => {
                  const gbpLink = gbpLinks?.get(page.id);
                  const linkStatus = gbpLink 
                    ? (gbpLink.syncStatus as 'linked' | 'warning' | 'out_of_sync') 
                    : 'not_linked';
                  const metrics = metricsMap?.get(page.route_path);
                  const alertMetrics = getAlertMetrics(page.route_path);
                  const hasMetricsData = metrics7dMap?.get(page.route_path) || metrics28dMap?.get(page.route_path);
                  const pageBaselines = baselinesMap?.get(page.id);
                  
                  return (
                    <TableRow key={page.id} className="cursor-pointer hover:bg-muted/50 group"
                      onClick={() => navigate(`/admin/seo/${page.id}`)}>
                      <TableCell>
                        <SeoLinkStatusChip 
                          status={linkStatus}
                          targetType="gbp"
                          targetId={gbpLink?.gbpLocationId}
                          targetTitle={gbpLink?.gbpTitle}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-sm">{page.page_name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {page.route_path}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={page.score} 
                            className="h-1.5 flex-1"
                            indicatorClassName={getScoreProgressColor(page.score)}
                          />
                          <span className={`text-xs font-medium ${getScoreColor(page.score)}`}>
                            {page.score}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(page.status)}</TableCell>
                      
                      {/* Analytics columns */}
                      {showAnalyticsColumns ? (
                        <>
                          {metricsLoading ? (
                            <>
                              <TableCell className="text-center border-l border-border/30"><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                              <TableCell className="text-center"><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                              <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                              <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                              <TableCell className="text-center border-l border-border/30"><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                              <TableCell className="text-center"><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                              <TableCell className="text-center"><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                              <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="text-center text-xs tabular-nums border-l border-border/30">
                                {metrics?.gsc ? formatNumber(metrics.gsc.clicks) : '—'}
                              </TableCell>
                              <TableCell className="text-center text-xs tabular-nums">
                                {metrics?.gsc ? formatNumber(metrics.gsc.impressions) : '—'}
                              </TableCell>
                              <TableCell className="text-center text-xs tabular-nums">
                                {metrics?.gsc ? formatPercent(metrics.gsc.ctr) : '—'}
                              </TableCell>
                              <TableCell className="text-center text-xs tabular-nums">
                                {metrics?.gsc ? formatPosition(metrics.gsc.position) : '—'}
                              </TableCell>
                              <TableCell className="text-center text-xs tabular-nums border-l border-border/30">
                                {metrics?.ga4 ? formatNumber(metrics.ga4.users) : '—'}
                              </TableCell>
                              <TableCell className="text-center text-xs tabular-nums">
                                {metrics?.ga4 ? formatNumber(metrics.ga4.sessions) : '—'}
                              </TableCell>
                              <TableCell className="text-center text-xs tabular-nums">
                                {metrics?.ga4 ? formatNumber(metrics.ga4.views) : '—'}
                              </TableCell>
                              <TableCell className="text-center text-xs tabular-nums">
                                {metrics?.ga4 ? formatPercent(metrics.ga4.engagementRate) : '—'}
                              </TableCell>
                            </>
                          )}
                        </>
                      ) : (
                        <TableCell className="border-l border-border/30">
                          <Link
                            to="/admin/analytics"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Connect GSC + GA4
                          </Link>
                        </TableCell>
                      )}
                      
                      {/* Alerts column */}
                      {showAnalyticsColumns && (
                        <TableCell className="border-l border-border/30" onClick={(e) => e.stopPropagation()}>
                          {metricsLoading ? (
                            <Skeleton className="h-5 w-14" />
                          ) : (
                            <SeoPerformanceAlertBadges 
                              metrics7d={alertMetrics.metrics7d}
                              metrics28d={alertMetrics.metrics28d}
                            />
                          )}
                        </TableCell>
                      )}
                      
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(page.updated_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-0.5">
                          {/* Explain Change button */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-7 w-7 ${showAnalyticsColumns && hasMetricsData ? 'opacity-0 group-hover:opacity-100' : ''} transition-opacity`}
                                  disabled={!showAnalyticsColumns || !hasMetricsData}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExplainPage({
                                      id: page.id,
                                      name: page.page_name,
                                      path: page.route_path,
                                      gbpLocationId: gbpLink?.gbpLocationId
                                    });
                                    setExplainDialogOpen(true);
                                  }}
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                {!showAnalyticsColumns 
                                  ? "Connect + sync GSC/GA4 to explain changes" 
                                  : !hasMetricsData 
                                    ? "Run sync to load metrics"
                                    : "Explain performance changes with AI"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          {/* Edit button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/seo/${page.id}`);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Explain Change Dialog */}
      {explainPage && (
        <SeoExplainChangeDialog
          open={explainDialogOpen}
          onOpenChange={(open) => {
            setExplainDialogOpen(open);
            if (!open) setExplainPage(null);
          }}
          seoPageId={explainPage.id}
          pageName={explainPage.name}
          routePath={explainPage.path}
          baseline={baselinesMap?.get(explainPage.id)}
          metrics7d={metrics7dMap?.get(explainPage.path) ? {
            gsc: metrics7dMap.get(explainPage.path)?.gsc || null,
            ga4: metrics7dMap.get(explainPage.path)?.ga4 || null
          } : undefined}
          metrics28d={metrics28dMap?.get(explainPage.path) ? {
            gsc: metrics28dMap.get(explainPage.path)?.gsc || null,
            ga4: metrics28dMap.get(explainPage.path)?.ga4 || null
          } : undefined}
          gbpLocationId={explainPage.gbpLocationId}
        />
      )}
    </div>
  );
}

// Wrap with admin guard
export default function AdminSeoList() {
  return (
    <RequireAdmin>
      <AdminSeoListContent />
    </RequireAdmin>
  );
}
