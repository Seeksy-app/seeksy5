import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Loader2, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Lightbulb, 
  AlertTriangle,
  CheckCircle2,
  Target,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BaselinesMap } from "@/hooks/useSeoBaselines";
import { GscMetrics, Ga4Metrics } from "@/hooks/useSeoAnalyticsMetrics";
import { detectPerformanceAlerts } from "./SeoPerformanceAlerts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seoPageId: string;
  pageName: string;
  routePath: string;
  baseline?: BaselinesMap;
  metrics7d?: { gsc: GscMetrics | null; ga4: Ga4Metrics | null };
  metrics28d?: { gsc: GscMetrics | null; ga4: Ga4Metrics | null };
  gbpLocationId?: string;
}

interface TopChange {
  metric: string;
  direction: "up" | "down" | "flat";
  delta: string;
  evidence: string;
}

interface Hypothesis {
  title: string;
  confidence: "low" | "medium" | "high";
  evidence: string[];
  what_to_check: string;
}

interface RecommendedAction {
  priority: number;
  action: string;
  why: string;
  effort: "low" | "medium" | "high";
  expected_impact: "low" | "medium" | "high";
}

interface ExplanationResult {
  page: {
    route_path: string;
    title?: string;
    meta_description?: string;
    h1?: string;
    last_updated_at?: string;
  };
  time_window: string;
  executive_summary: string;
  top_changes: TopChange[];
  primary_pattern: string[];
  hypotheses: Hypothesis[];
  recommended_actions: RecommendedAction[];
  diagnostic_next_step: string;
  confidence_overall: "low" | "medium" | "high";
  data_quality: {
    gsc_available: boolean;
    ga4_available: boolean;
    notes: string[];
    // Scoring breakdown from deterministic confidence scoring
    confidenceScore?: number;
    completeness?: number;
    coveragePenalty?: number;
    lowVolumePenalty?: number;
  };
}

const CONFIDENCE_COLORS = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  high: "bg-green-500/10 text-green-600 dark:text-green-400"
};

const EFFORT_COLORS = {
  low: "text-green-600 dark:text-green-400",
  medium: "text-yellow-600 dark:text-yellow-400",
  high: "text-red-600 dark:text-red-400"
};

const PATTERN_LABELS: Record<string, string> = {
  demand_change_impressions: "Demand Change",
  ranking_change_position: "Ranking Shift",
  snippet_change_ctr: "Snippet/CTR Issue",
  onsite_engagement_change: "Engagement Change",
  tracking_or_coverage_issue: "Tracking Issue",
  mixed: "Mixed Factors"
};

export function SeoExplainChangeDialog({
  open,
  onOpenChange,
  seoPageId,
  pageName,
  routePath,
  baseline,
  metrics7d,
  metrics28d,
  gbpLocationId
}: Props) {
  const { toast } = useToast();
  const [result, setResult] = useState<ExplanationResult | null>(null);

  // Detect alerts for context - use GSC metrics which have the required fields
  const alerts = detectPerformanceAlerts(
    metrics7d?.gsc ? {
      clicks: metrics7d.gsc.clicks,
      ctr: metrics7d.gsc.ctr,
      position: metrics7d.gsc.position
    } : null,
    metrics28d?.gsc ? {
      clicks: metrics28d.gsc.clicks,
      ctr: metrics28d.gsc.ctr,
      position: metrics28d.gsc.position
    } : null
  );

  const explainMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      // Build context matching the new schema
      const context = {
        page: {
          route_path: routePath,
          title: pageName
        },
        metrics_7d: metrics7d ? {
          gsc: metrics7d.gsc ? {
            clicks: metrics7d.gsc.clicks,
            impressions: metrics7d.gsc.impressions,
            ctr: metrics7d.gsc.ctr,
            position: metrics7d.gsc.position
          } : null,
          ga4: metrics7d.ga4 ? {
            users: metrics7d.ga4.users,
            sessions: metrics7d.ga4.sessions,
            views: metrics7d.ga4.views,
            engagementRate: metrics7d.ga4.engagementRate
          } : null
        } : null,
        metrics_28d: metrics28d ? {
          gsc: metrics28d.gsc ? {
            clicks: metrics28d.gsc.clicks,
            impressions: metrics28d.gsc.impressions,
            ctr: metrics28d.gsc.ctr,
            position: metrics28d.gsc.position
          } : null,
          ga4: metrics28d.ga4 ? {
            users: metrics28d.ga4.users,
            sessions: metrics28d.ga4.sessions,
            views: metrics28d.ga4.views,
            engagementRate: metrics28d.ga4.engagementRate
          } : null
        } : null,
        baseline: baseline ? {
          exists: !!(baseline.gsc || baseline.ga4),
          captured_at: baseline.gsc?.captured_at || baseline.ga4?.captured_at || null,
          gsc: baseline.gsc ? {
            clicks: baseline.gsc.baseline_clicks,
            impressions: baseline.gsc.baseline_impressions,
            ctr: baseline.gsc.baseline_ctr,
            position: baseline.gsc.baseline_position
          } : null,
          ga4: baseline.ga4 ? {
            users: baseline.ga4.baseline_users,
            sessions: baseline.ga4.baseline_sessions
          } : null
        } : { exists: false },
        alerts: {
          ctr_drop: alerts.ctrDrop,
          position_drop: alerts.positionDrop,
          traffic_spike: alerts.trafficSpike
        },
        gbp_context: gbpLocationId ? { linked: true } : { linked: false }
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seo-ai-explain-change`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            seo_page_id: seoPageId,
            context
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get explanation');
      }

      return response.json() as Promise<ExplanationResult>;
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to explain",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleExplain = () => {
    setResult(null);
    explainMutation.mutate();
  };

  const DirectionIcon = ({ direction }: { direction: string }) => {
    if (direction === "up") return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
    if (direction === "down") return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Explain Performance Change
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Page Info */}
          <div className="text-sm text-muted-foreground border-b pb-3">
            <strong>{pageName}</strong>
            <span className="ml-2 font-mono text-xs opacity-70">{routePath}</span>
          </div>

          {/* Initial State */}
          {!result && !explainMutation.isPending && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                AI will analyze 7d vs 28d metrics to explain performance changes and recommend actions.
              </p>
              <Button onClick={handleExplain}>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze Changes
              </Button>
            </div>
          )}

          {/* Loading */}
          {explainMutation.isPending && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Analyzing metrics...</span>
            </div>
          )}

          {/* Results */}
          {result && (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-5">
                {/* Executive Summary */}
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm font-medium">{result.executive_summary}</p>
                  </div>
                </div>

                {/* Data Quality & Confidence */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className={`cursor-help ${CONFIDENCE_COLORS[result.confidence_overall]}`}>
                        {result.confidence_overall} confidence
                        {result.data_quality.confidenceScore != null && (
                          <span className="ml-1 opacity-70">({result.data_quality.confidenceScore})</span>
                        )}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs text-xs">
                      <div className="space-y-1">
                        {result.data_quality.completeness != null && (
                          <div>Completeness: {result.data_quality.completeness}/100</div>
                        )}
                        {result.data_quality.coveragePenalty != null && result.data_quality.coveragePenalty > 0 && (
                          <div>Coverage penalty: -{result.data_quality.coveragePenalty}</div>
                        )}
                        {result.data_quality.lowVolumePenalty != null && result.data_quality.lowVolumePenalty > 0 && (
                          <div>Low volume penalty: -{result.data_quality.lowVolumePenalty}</div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  {result.data_quality.gsc_available && (
                    <Badge variant="outline" className="text-xs">GSC ✓</Badge>
                  )}
                  {result.data_quality.ga4_available && (
                    <Badge variant="outline" className="text-xs">GA4 ✓</Badge>
                  )}
                  {result.primary_pattern.map(p => (
                    <Badge key={p} variant="secondary" className="text-xs">
                      {PATTERN_LABELS[p] || p}
                    </Badge>
                  ))}
                </div>

                {/* Top Changes */}
                {result.top_changes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Key Changes
                    </h4>
                    <div className="grid gap-2">
                      {result.top_changes.map((change, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-muted/30 rounded text-sm">
                          <DirectionIcon direction={change.direction} />
                          <span className="font-mono text-xs w-28">{change.metric.replace(/_/g, ' ')}</span>
                          <span className="font-medium w-20">{change.delta}</span>
                          <span className="text-muted-foreground text-xs flex-1">{change.evidence}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hypotheses */}
                {result.hypotheses.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Likely Causes
                    </h4>
                    <div className="space-y-3">
                      {result.hypotheses.map((h, i) => (
                        <div key={i} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                            <span className="font-medium text-sm">{h.title}</span>
                            <Badge variant="outline" className={`text-xs ml-auto ${CONFIDENCE_COLORS[h.confidence]}`}>
                              {h.confidence}
                            </Badge>
                          </div>
                          <ul className="text-xs text-muted-foreground space-y-0.5 ml-5 mb-2">
                            {h.evidence.map((e, j) => (
                              <li key={j}>• {e}</li>
                            ))}
                          </ul>
                          <div className="flex items-center gap-1 text-xs text-primary">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Check: {h.what_to_check}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Actions */}
                {result.recommended_actions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Recommended Actions
                    </h4>
                    <div className="space-y-2">
                      {result.recommended_actions.map((action, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                            {action.priority}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
                              <span className="font-medium text-sm">{action.action}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{action.why}</p>
                            <div className="flex items-center gap-3 text-xs">
                              <span>Effort: <span className={EFFORT_COLORS[action.effort]}>{action.effort}</span></span>
                              <span>Impact: <span className={EFFORT_COLORS[action.expected_impact === 'high' ? 'low' : action.expected_impact === 'low' ? 'high' : 'medium']}>{action.expected_impact}</span></span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Step */}
                {result.diagnostic_next_step && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span className="font-medium">Next Step:</span>
                      <span className="text-muted-foreground">{result.diagnostic_next_step}</span>
                    </div>
                  </div>
                )}

                {/* Data Quality Notes */}
                {result.data_quality.notes.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Data notes: </span>
                    {result.data_quality.notes.join(" • ")}
                  </div>
                )}

                {/* Re-analyze button */}
                <div className="pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={handleExplain}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Re-analyze
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
