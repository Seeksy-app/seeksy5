import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Eye, Calendar, TrendingUp, AlertTriangle, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Rock {
  id: string;
  title: string;
  owner: string;
  target_date: string;
  status: "on_track" | "at_risk" | "off_track" | "complete";
}

interface CoreMetric {
  id: string;
  name: string;
  current_value: number | null;
  target_value: number;
  owner: string;
  source_metric_key: string | null;
}

interface KeyIssue {
  id: string;
  title: string;
  description: string;
  owner: string;
  status: "open" | "in_progress" | "resolved";
}

interface VTOData {
  company_vision: string;
  three_year_picture: string;
  one_year_plan: string;
  quarterly_rocks: Rock[];
  core_metrics: CoreMetric[];
  key_issues: KeyIssue[];
  board_summary: string | null;
  last_synced_at: string | null;
}

export default function BoardVTO() {
  const [vto, setVto] = useState<VTOData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVTO();
  }, []);

  const fetchVTO = async () => {
    const { data } = await supabase
      .from("ceo_vto" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      const d = data as any;
      setVto({
        company_vision: d.company_vision || "",
        three_year_picture: d.three_year_picture || "",
        one_year_plan: d.one_year_plan || "",
        quarterly_rocks: (d.quarterly_rocks as Rock[]) || [],
        core_metrics: (d.core_metrics as CoreMetric[]) || [],
        key_issues: (d.key_issues as KeyIssue[]) || [],
        board_summary: d.board_summary,
        last_synced_at: d.last_synced_at,
      });
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "on_track":
      case "complete":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "at_risk":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "off_track":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      on_track: "bg-green-100 text-green-800 border-green-200",
      at_risk: "bg-yellow-100 text-yellow-800 border-yellow-200",
      off_track: "bg-red-100 text-red-800 border-red-200",
      complete: "bg-blue-100 text-blue-800 border-blue-200",
    };
    const labels: Record<string, string> = {
      on_track: "On Track",
      at_risk: "At Risk",
      off_track: "Off Track",
      complete: "Complete",
    };
    return (
      <Badge variant="outline" className={styles[status]}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!vto) {
    return (
      <div className="w-full space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="font-medium">No VTO Available</p>
            <p className="text-sm text-muted-foreground">The CEO has not yet published a VTO.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rocksOnTrack = vto.quarterly_rocks.filter(r => r.status === "on_track" || r.status === "complete").length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            CEO VTO
          </h1>
          <p className="text-muted-foreground mt-1">
            Vision / Traction Organizer — Strategic Overview
          </p>
        </div>
        {vto.last_synced_at && (
          <p className="text-xs text-muted-foreground">
            Last synced: {new Date(vto.last_synced_at).toLocaleString()}
          </p>
        )}
      </div>

      {/* Board Summary */}
      {vto.board_summary && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-lg">Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
              {vto.board_summary}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vision & 1-Year Plan */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Company Vision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{vto.company_vision || "Not defined"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>1-Year Plan</CardTitle>
            <CardDescription>Key objectives for this year</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{vto.one_year_plan || "Not defined"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Rocks Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Quarterly Rocks Progress
              </CardTitle>
              <CardDescription>
                {rocksOnTrack} of {vto.quarterly_rocks.length} rocks on track or complete
              </CardDescription>
            </div>
            <div className="text-2xl font-bold text-primary">
              {vto.quarterly_rocks.length > 0 
                ? Math.round((rocksOnTrack / vto.quarterly_rocks.length) * 100)
                : 0}%
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {vto.quarterly_rocks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No rocks defined</p>
          ) : (
            <div className="space-y-3">
              {vto.quarterly_rocks.map((rock) => (
                <div 
                  key={rock.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(rock.status)}
                    <div>
                      <p className="font-medium">{rock.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Owner: {rock.owner} • Due: {new Date(rock.target_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(rock.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Core Metrics vs Targets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Core Metrics vs Targets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vto.core_metrics.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No metrics configured</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vto.core_metrics.map((metric) => {
                const progress = metric.current_value !== null && metric.target_value > 0
                  ? Math.min(100, (metric.current_value / metric.target_value) * 100)
                  : 0;
                const isOnTarget = progress >= 80;
                
                return (
                  <div key={metric.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{metric.name}</p>
                      <Badge variant={isOnTarget ? "default" : "secondary"} className="text-xs">
                        {Math.round(progress)}%
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold">
                        {metric.current_value?.toLocaleString() || "—"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {metric.target_value.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">Owner: {metric.owner}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Issues */}
      {vto.key_issues.filter(i => i.status !== "resolved").length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Active Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vto.key_issues.filter(i => i.status !== "resolved").map((issue) => (
                <div key={issue.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{issue.title}</p>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      {issue.status === "in_progress" ? "In Progress" : "Open"}
                    </Badge>
                  </div>
                  {issue.description && (
                    <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">Owner: {issue.owner}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
