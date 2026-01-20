import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

export function CreatorEarningsTab() {
  const [selectedScenario, setSelectedScenario] = useState<string>("");

  const { data: scenarios } = useQuery({
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

  const { data: projections, isLoading } = useQuery({
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

  const { data: summary } = useQuery({
    queryKey: ["ad-financial-model-summaries", selectedScenario],
    queryFn: async () => {
      if (!selectedScenario) return null;
      const { data, error } = await supabase
        .from("ad_financial_model_summaries")
        .select("*")
        .eq("scenario_id", selectedScenario)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedScenario,
  });

  const chartData = projections?.map((p) => ({
    month: `M${p.month_index}`,
    creatorPayout: Math.round(p.creator_payout),
    platformRevenue: Math.round(p.platform_net_revenue),
  })) || [];

  const totalCreatorPayout = projections?.reduce((sum, p) => sum + Number(p.creator_payout), 0) || 0;
  const totalPlatformRevenue = projections?.reduce((sum, p) => sum + Number(p.platform_net_revenue), 0) || 0;
  const totalGrossRevenue = projections?.reduce((sum, p) => sum + Number(p.gross_revenue_total), 0) || 0;
  const effectiveShare = totalGrossRevenue > 0 ? (totalCreatorPayout / totalGrossRevenue) * 100 : 0;

  const avgMonetizedCreators = projections?.length
    ? projections.reduce((sum, p) => sum + p.monetized_creators, 0) / projections.length
    : 0;

  const avgCreatorEarnings = avgMonetizedCreators > 0 ? totalCreatorPayout / avgMonetizedCreators : 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Creator Earnings Analysis
          </CardTitle>
          <CardDescription>How much do creators earn vs platform revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
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
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : projections && projections.length > 0 ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Creator Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${Math.round(totalCreatorPayout).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Seeksy Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${Math.round(totalPlatformRevenue).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Effective Creator Share</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{effectiveShare.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Creator Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${Math.round(avgCreatorEarnings).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">per monetized creator</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Card>
            <CardHeader>
              <CardTitle>Creator Payouts vs Platform Revenue</CardTitle>
              <CardDescription>Monthly comparison over projection period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="creatorPayout" stroke="hsl(var(--chart-3))" name="Creator Payout" strokeWidth={2} />
                  <Line type="monotone" dataKey="platformRevenue" stroke="hsl(var(--chart-2))" name="Platform Revenue" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Distribution</CardTitle>
              <CardDescription>Creator vs Platform split by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="creatorPayout" fill="hsl(var(--chart-3))" name="Creator Payout" />
                  <Bar dataKey="platformRevenue" fill="hsl(var(--chart-2))" name="Platform Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Narrative */}
          {summary && (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground whitespace-pre-line">
                  {summary.summary_text}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            Select a scenario to view creator earnings analysis
          </CardContent>
        </Card>
      )}
    </div>
  );
}
