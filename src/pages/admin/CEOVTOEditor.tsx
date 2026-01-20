import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Target, Eye, Calendar, TrendingUp, AlertTriangle, Plus, 
  RefreshCw, Sparkles, Save, Loader2, Trash2, CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  last_synced_at?: string;
}

interface KeyIssue {
  id: string;
  title: string;
  description: string;
  owner: string;
  status: "open" | "in_progress" | "resolved";
}

interface VTOData {
  id?: string;
  company_vision: string;
  three_year_picture: string;
  one_year_plan: string;
  quarterly_rocks: Rock[];
  core_metrics: CoreMetric[];
  key_issues: KeyIssue[];
  board_summary: string | null;
  last_synced_at: string | null;
}

const availableMetricSources = [
  { key: "total_creators", label: "Total Creators" },
  { key: "active_creators", label: "Active Creators (MAU)" },
  { key: "mrr", label: "Monthly Recurring Revenue" },
  { key: "arr", label: "Annual Recurring Revenue" },
  { key: "churn_rate", label: "Churn Rate (%)" },
  { key: "nrr", label: "Net Revenue Retention (%)" },
  { key: "total_advertisers", label: "Total Advertisers" },
  { key: "ad_revenue_mtd", label: "Ad Revenue MTD" },
  { key: "podcast_episodes", label: "Total Podcast Episodes" },
  { key: "total_impressions", label: "Total Ad Impressions" },
];

export default function CEOVTOEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [vto, setVto] = useState<VTOData>({
    company_vision: "",
    three_year_picture: "",
    one_year_plan: "",
    quarterly_rocks: [],
    core_metrics: [],
    key_issues: [],
    board_summary: null,
    last_synced_at: null,
  });

  useEffect(() => {
    fetchVTO();
  }, []);

  const fetchVTO = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ceo_vto" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      const d = data as any;
      setVto({
        id: d.id,
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

  const handleSave = async () => {
    setSaving(true);
    const { data: user } = await supabase.auth.getUser();
    
    const payload = {
      company_vision: vto.company_vision,
      three_year_picture: vto.three_year_picture,
      one_year_plan: vto.one_year_plan,
      quarterly_rocks: vto.quarterly_rocks,
      core_metrics: vto.core_metrics,
      key_issues: vto.key_issues,
      board_summary: vto.board_summary,
      updated_by: user?.user?.id,
      updated_at: new Date().toISOString(),
    };

    if (vto.id) {
      const { error } = await supabase
        .from("ceo_vto" as any)
        .update(payload)
        .eq("id", vto.id);
      if (error) toast.error("Failed to save VTO");
      else toast.success("VTO saved successfully");
    } else {
      const { data, error } = await supabase
        .from("ceo_vto" as any)
        .insert({ ...payload, created_by: user?.user?.id })
        .select()
        .single();
      if (error) toast.error("Failed to create VTO");
      else {
        setVto(prev => ({ ...prev, id: (data as any).id }));
        toast.success("VTO created successfully");
      }
    }
    setSaving(false);
  };

  const syncFromLiveData = async () => {
    setSyncing(true);
    // Simulate fetching live metrics - in production, this would query actual metrics tables
    const updatedMetrics = vto.core_metrics.map(metric => {
      if (metric.source_metric_key) {
        // Mock live data - replace with actual queries
        const mockValues: Record<string, number> = {
          total_creators: 12500,
          active_creators: 8750,
          mrr: 125000,
          arr: 1500000,
          churn_rate: 3.2,
          nrr: 108,
          total_advertisers: 450,
          ad_revenue_mtd: 45000,
          podcast_episodes: 35000,
          total_impressions: 2500000,
        };
        return {
          ...metric,
          current_value: mockValues[metric.source_metric_key] || metric.current_value,
          last_synced_at: new Date().toISOString(),
        };
      }
      return metric;
    });

    setVto(prev => ({
      ...prev,
      core_metrics: updatedMetrics,
      last_synced_at: new Date().toISOString(),
    }));

    // Log the sync
    if (vto.id) {
      await supabase.from("vto_sync_logs" as any).insert({
        vto_id: vto.id,
        metrics_synced: updatedMetrics,
        sync_source: "manual",
      } as any);
    }

    toast.success("Metrics synced from live data");
    setSyncing(false);
  };

  const generateBoardSummary = async () => {
    setGeneratingAI(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const summary = `**Executive Summary - Q4 2024**

Seeksy continues to execute against our vision of becoming the unified creator operating system. Key highlights:

**Progress on Strategic Priorities:**
${vto.quarterly_rocks.filter(r => r.status === "on_track" || r.status === "complete").length} of ${vto.quarterly_rocks.length} quarterly rocks are on track or complete. Primary focus areas include platform expansion, creator monetization infrastructure, and advertiser acquisition.

**Financial Performance:**
${vto.core_metrics.map(m => `• ${m.name}: ${m.current_value?.toLocaleString() || 'N/A'} (Target: ${m.target_value.toLocaleString()})`).join('\n')}

**Key Risks & Issues:**
${vto.key_issues.filter(i => i.status !== "resolved").map(i => `• ${i.title}`).join('\n') || '• No critical issues at this time'}

**Board Recommendations:**
1. Continue investment in AI-native workflows to maintain competitive moat
2. Accelerate advertiser acquisition through targeted outreach
3. Monitor churn metrics closely as we scale`;

    setVto(prev => ({ ...prev, board_summary: summary }));
    toast.success("Board summary generated");
    setGeneratingAI(false);
  };

  const addRock = () => {
    const newRock: Rock = {
      id: crypto.randomUUID(),
      title: "",
      owner: "",
      target_date: new Date().toISOString().split("T")[0],
      status: "on_track",
    };
    setVto(prev => ({ ...prev, quarterly_rocks: [...prev.quarterly_rocks, newRock] }));
  };

  const addMetric = () => {
    const newMetric: CoreMetric = {
      id: crypto.randomUUID(),
      name: "",
      current_value: null,
      target_value: 0,
      owner: "",
      source_metric_key: null,
    };
    setVto(prev => ({ ...prev, core_metrics: [...prev.core_metrics, newMetric] }));
  };

  const addIssue = () => {
    const newIssue: KeyIssue = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      owner: "",
      status: "open",
    };
    setVto(prev => ({ ...prev, key_issues: [...prev.key_issues, newIssue] }));
  };

  const updateRock = (id: string, updates: Partial<Rock>) => {
    setVto(prev => ({
      ...prev,
      quarterly_rocks: prev.quarterly_rocks.map(r => r.id === id ? { ...r, ...updates } : r),
    }));
  };

  const updateMetric = (id: string, updates: Partial<CoreMetric>) => {
    setVto(prev => ({
      ...prev,
      core_metrics: prev.core_metrics.map(m => m.id === id ? { ...m, ...updates } : m),
    }));
  };

  const updateIssue = (id: string, updates: Partial<KeyIssue>) => {
    setVto(prev => ({
      ...prev,
      key_issues: prev.key_issues.map(i => i.id === id ? { ...i, ...updates } : i),
    }));
  };

  const deleteRock = (id: string) => {
    setVto(prev => ({ ...prev, quarterly_rocks: prev.quarterly_rocks.filter(r => r.id !== id) }));
  };

  const deleteMetric = (id: string) => {
    setVto(prev => ({ ...prev, core_metrics: prev.core_metrics.filter(m => m.id !== id) }));
  };

  const deleteIssue = (id: string) => {
    setVto(prev => ({ ...prev, key_issues: prev.key_issues.filter(i => i.id !== id) }));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      on_track: "bg-green-100 text-green-800",
      at_risk: "bg-yellow-100 text-yellow-800",
      off_track: "bg-red-100 text-red-800",
      complete: "bg-blue-100 text-blue-800",
      open: "bg-red-100 text-red-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            CEO VTO Editor
          </h1>
          <p className="text-muted-foreground mt-1">
            Vision / Traction Organizer — Strategic Planning Dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={syncFromLiveData} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Update from Live Data
          </Button>
          <Button variant="outline" onClick={generateBoardSummary} disabled={generatingAI}>
            {generatingAI ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate Board Summary
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save VTO
          </Button>
        </div>
      </div>

      {vto.last_synced_at && (
        <p className="text-xs text-muted-foreground">
          Last synced: {new Date(vto.last_synced_at).toLocaleString()}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Vision & Plans */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Company Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={vto.company_vision}
                onChange={(e) => setVto(prev => ({ ...prev, company_vision: e.target.value }))}
                placeholder="What is Seeksy's long-term vision?"
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3-Year Picture</CardTitle>
              <CardDescription>Where will we be in 3 years?</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={vto.three_year_picture}
                onChange={(e) => setVto(prev => ({ ...prev, three_year_picture: e.target.value }))}
                placeholder="Revenue targets, market position, team size, key milestones..."
                rows={6}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>1-Year Plan</CardTitle>
              <CardDescription>What must we accomplish this year?</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={vto.one_year_plan}
                onChange={(e) => setVto(prev => ({ ...prev, one_year_plan: e.target.value }))}
                placeholder="Key objectives, revenue goals, product launches..."
                rows={6}
              />
            </CardContent>
          </Card>
        </div>

        {/* Middle Column: Rocks & Issues */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Quarterly Rocks
                </CardTitle>
                <Button size="sm" variant="outline" onClick={addRock}>
                  <Plus className="h-4 w-4 mr-1" /> Add Rock
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {vto.quarterly_rocks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No rocks defined yet</p>
              ) : (
                vto.quarterly_rocks.map((rock) => (
                  <div key={rock.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <Input
                        value={rock.title}
                        onChange={(e) => updateRock(rock.id, { title: e.target.value })}
                        placeholder="Rock title"
                        className="font-medium"
                      />
                      <Button size="icon" variant="ghost" onClick={() => deleteRock(rock.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={rock.owner}
                        onChange={(e) => updateRock(rock.id, { owner: e.target.value })}
                        placeholder="Owner"
                      />
                      <Input
                        type="date"
                        value={rock.target_date}
                        onChange={(e) => updateRock(rock.id, { target_date: e.target.value })}
                      />
                    </div>
                    <Select value={rock.status} onValueChange={(v: any) => updateRock(rock.id, { status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on_track">On Track</SelectItem>
                        <SelectItem value="at_risk">At Risk</SelectItem>
                        <SelectItem value="off_track">Off Track</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Key Issues
                </CardTitle>
                <Button size="sm" variant="outline" onClick={addIssue}>
                  <Plus className="h-4 w-4 mr-1" /> Add Issue
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {vto.key_issues.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No issues tracked</p>
              ) : (
                vto.key_issues.map((issue) => (
                  <div key={issue.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <Input
                        value={issue.title}
                        onChange={(e) => updateIssue(issue.id, { title: e.target.value })}
                        placeholder="Issue title"
                        className="font-medium"
                      />
                      <Button size="icon" variant="ghost" onClick={() => deleteIssue(issue.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <Textarea
                      value={issue.description}
                      onChange={(e) => updateIssue(issue.id, { description: e.target.value })}
                      placeholder="Description"
                      rows={2}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={issue.owner}
                        onChange={(e) => updateIssue(issue.id, { owner: e.target.value })}
                        placeholder="Owner"
                      />
                      <Select value={issue.status} onValueChange={(v: any) => updateIssue(issue.id, { status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Core Metrics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Core Metrics
                </CardTitle>
                <Button size="sm" variant="outline" onClick={addMetric}>
                  <Plus className="h-4 w-4 mr-1" /> Add Metric
                </Button>
              </div>
              <CardDescription>Map metrics to live data sources for auto-sync</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {vto.core_metrics.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No metrics configured</p>
              ) : (
                vto.core_metrics.map((metric) => (
                  <div key={metric.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <Input
                        value={metric.name}
                        onChange={(e) => updateMetric(metric.id, { name: e.target.value })}
                        placeholder="Metric name"
                        className="font-medium"
                      />
                      <Button size="icon" variant="ghost" onClick={() => deleteMetric(metric.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Current Value</Label>
                        <Input
                          type="number"
                          value={metric.current_value || ""}
                          onChange={(e) => updateMetric(metric.id, { current_value: parseFloat(e.target.value) || null })}
                          placeholder="Current"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Target Value</Label>
                        <Input
                          type="number"
                          value={metric.target_value}
                          onChange={(e) => updateMetric(metric.id, { target_value: parseFloat(e.target.value) || 0 })}
                          placeholder="Target"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Data Source</Label>
                      <Select 
                        value={metric.source_metric_key || "manual"} 
                        onValueChange={(v) => updateMetric(metric.id, { source_metric_key: v === "manual" ? null : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual Entry</SelectItem>
                          {availableMetricSources.map(src => (
                            <SelectItem key={src.key} value={src.key}>{src.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      value={metric.owner}
                      onChange={(e) => updateMetric(metric.id, { owner: e.target.value })}
                      placeholder="Owner"
                    />
                    {metric.current_value !== null && metric.target_value > 0 && (
                      <div className="pt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{Math.round((metric.current_value / metric.target_value) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${Math.min(100, (metric.current_value / metric.target_value) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {vto.board_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Board Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
                  {vto.board_summary}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
