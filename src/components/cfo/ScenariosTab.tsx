import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, Download } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function ScenariosTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedScenario, setSelectedScenario] = useState<string>("");
  const [months, setMonths] = useState<number>(12);

  const { data: scenarios, isLoading: loadingScenarios } = useQuery({
    queryKey: ["ad-financial-scenarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_financial_scenarios")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: projections, isLoading: loadingProjections } = useQuery({
    queryKey: ["ad-financial-projections", selectedScenario],
    queryFn: async () => {
      if (!selectedScenario) return [];
      const { data, error } = await supabase
        .from("ad_financial_projections")
        .select("*")
        .eq("scenario_id", selectedScenario)
        .order("month_index", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedScenario,
  });

  const { data: summaries } = useQuery({
    queryKey: ["ad-financial-model-summaries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_financial_model_summaries")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const runProjectionMutation = useMutation({
    mutationFn: async ({ scenario_id, months }: { scenario_id: string; months: number }) => {
      const { data, error } = await supabase.functions.invoke("ad-financial-projection", {
        body: { scenario_id, months },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-financial-projections"] });
      queryClient.invalidateQueries({ queryKey: ["ad-financial-model-summaries"] });
      toast({ title: "Projection completed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to run projection", description: error.message, variant: "destructive" });
    },
  });

  const handleRunProjection = (scenarioId: string) => {
    runProjectionMutation.mutate({ scenario_id: scenarioId, months });
  };

  const handleExportCSV = () => {
    if (!projections || projections.length === 0) return;
    
    const csvContent = [
      ["Month", "Period Start", "Period End", "Creators", "Episodes", "Impressions", "Gross Revenue", "Creator Payout", "Platform Revenue"],
      ...projections.map((p) => [
        p.month_index,
        p.period_start,
        p.period_end,
        p.creators,
        p.episodes,
        p.total_impressions,
        p.gross_revenue_total,
        p.creator_payout,
        p.platform_net_revenue,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ad-financial-projection-${selectedScenario}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const filteredProjections = projections?.slice(0, months) || [];

  const chartData = filteredProjections.map((p) => ({
    month: `M${p.month_index}`,
    platformRevenue: Math.round(p.platform_net_revenue),
    creatorPayout: Math.round(p.creator_payout),
    grossRevenue: Math.round(p.gross_revenue_total),
  }));

  const impressionsChartData = filteredProjections.map((p) => ({
    month: `M${p.month_index}`,
    preroll: Math.round(p.impressions_preroll),
    midroll: Math.round(p.impressions_midroll),
    postroll: Math.round(p.impressions_postroll),
  }));

  // Calculate year 1 summaries for comparison
  const getYear1Summary = (scenarioId: string) => {
    const scenarioProjections = projections?.filter((p) => p.scenario_id === scenarioId).slice(0, 12) || [];
    const totalRevenue = scenarioProjections.reduce((sum, p) => sum + Number(p.platform_net_revenue), 0);
    const totalPayout = scenarioProjections.reduce((sum, p) => sum + Number(p.creator_payout), 0);
    const totalImpressions = scenarioProjections.reduce((sum, p) => sum + Number(p.total_impressions), 0);
    return { totalRevenue, totalPayout, totalImpressions };
  };

  if (loadingScenarios) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Controls</CardTitle>
          <CardDescription>Select scenario and projection horizon</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Scenario</label>
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scenario" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Months</label>
              <Select value={months.toString()} onValueChange={(v) => setMonths(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 Months</SelectItem>
                  <SelectItem value="24">24 Months</SelectItem>
                  <SelectItem value="36">36 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => selectedScenario && handleRunProjection(selectedScenario)}
              disabled={!selectedScenario || runProjectionMutation.isPending}
            >
              {runProjectionMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Projection
            </Button>

            <Button onClick={handleExportCSV} variant="outline" disabled={!filteredProjections.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios?.map((scenario) => {
          const summary = summaries?.find((s) => s.scenario_id === scenario.id);
          return (
            <Card key={scenario.id} className={selectedScenario === scenario.id ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle>{scenario.name}</CardTitle>
                <CardDescription>{scenario.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {summary && (
                  <div className="text-sm text-muted-foreground whitespace-pre-line">
                    {summary.summary_text}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      {loadingProjections ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredProjections.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Platform vs Creator payouts over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="grossRevenue" stroke="hsl(var(--primary))" name="Gross Revenue" />
                  <Line type="monotone" dataKey="platformRevenue" stroke="hsl(var(--chart-2))" name="Platform Revenue" />
                  <Line type="monotone" dataKey="creatorPayout" stroke="hsl(var(--chart-3))" name="Creator Payout" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Impressions by Slot Type</CardTitle>
              <CardDescription>Stacked impressions breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={impressionsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="preroll" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" name="Preroll" />
                  <Area type="monotone" dataKey="midroll" stackId="1" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" name="Midroll" />
                  <Area type="monotone" dataKey="postroll" stackId="1" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" name="Postroll" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Platform Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  ${Math.round(filteredProjections.reduce((sum, p) => sum + Number(p.platform_net_revenue), 0)).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Creator Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  ${Math.round(filteredProjections.reduce((sum, p) => sum + Number(p.creator_payout), 0)).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {Math.round(filteredProjections.reduce((sum, p) => sum + Number(p.total_impressions), 0)).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            Select a scenario and click "Run Projection" to see results
          </CardContent>
        </Card>
      )}
    </div>
  );
}
