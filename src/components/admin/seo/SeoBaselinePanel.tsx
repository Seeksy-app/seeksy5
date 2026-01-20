import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Activity, RotateCcw, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useSeoBaseline, useResetBaseline, BaselinesMap } from "@/hooks/useSeoBaselines";
import { GscMetrics, Ga4Metrics } from "@/hooks/useSeoAnalyticsMetrics";

interface Props {
  seoPageId: string;
  currentGsc?: GscMetrics | null;
  currentGa4?: Ga4Metrics | null;
}

function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString();
}

function formatPercent(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

function formatPosition(n: number | null | undefined): string {
  if (n == null || n === 0) return '—';
  return n.toFixed(1);
}

export function SeoBaselinePanel({ seoPageId, currentGsc, currentGa4 }: Props) {
  const { data: baselines, isLoading } = useSeoBaseline(seoPageId);
  const resetMutation = useResetBaseline();

  const handleResetGsc = () => {
    if (!currentGsc) return;
    resetMutation.mutate({
      seoPageId,
      source: 'gsc',
      currentMetrics: {
        clicks: currentGsc.clicks,
        impressions: currentGsc.impressions,
        ctr: currentGsc.ctr,
        position: currentGsc.position
      }
    });
  };

  const handleResetGa4 = () => {
    if (!currentGa4) return;
    resetMutation.mutate({
      seoPageId,
      source: 'ga4',
      currentMetrics: {
        users: currentGa4.users,
        sessions: currentGa4.sessions
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasBaselines = baselines?.gsc || baselines?.ga4;

  if (!hasBaselines) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Baseline Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Baselines are captured automatically on first sync. Once set, they're used to calculate performance changes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Baseline Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* GSC Baseline */}
        {baselines?.gsc && (
          <div className="border rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px]">GSC</Badge>
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(baselines.gsc.captured_at), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Clicks</div>
                <div className="font-medium">{formatNumber(baselines.gsc.baseline_clicks)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Impr.</div>
                <div className="font-medium">{formatNumber(baselines.gsc.baseline_impressions)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">CTR</div>
                <div className="font-medium">{formatPercent(baselines.gsc.baseline_ctr)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Pos</div>
                <div className="font-medium">{formatPosition(baselines.gsc.baseline_position)}</div>
              </div>
            </div>
            {currentGsc && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" disabled={resetMutation.isPending}>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset to current
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset GSC Baseline?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will update the GSC baseline to current metrics. Historical delta comparisons will use this new baseline.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetGsc}>Reset</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}

        {/* GA4 Baseline */}
        {baselines?.ga4 && (
          <div className="border rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px]">GA4</Badge>
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(baselines.ga4.captured_at), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Users</div>
                <div className="font-medium">{formatNumber(baselines.ga4.baseline_users)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Sessions</div>
                <div className="font-medium">{formatNumber(baselines.ga4.baseline_sessions)}</div>
              </div>
            </div>
            {currentGa4 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" disabled={resetMutation.isPending}>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset to current
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset GA4 Baseline?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will update the GA4 baseline to current metrics. Historical delta comparisons will use this new baseline.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetGa4}>Reset</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
