import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, PresentationIcon, Download, Share2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function InvestorViewTab() {
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

  const selectedScenarioData = scenarios?.find((s) => s.id === selectedScenario);

  const year1Projections = projections?.slice(0, 12) || [];
  const year1Revenue = year1Projections.reduce((sum, p) => sum + Number(p.platform_net_revenue), 0);
  const year1CreatorPayout = year1Projections.reduce((sum, p) => sum + Number(p.creator_payout), 0);
  const year1GrossRevenue = year1Projections.reduce((sum, p) => sum + Number(p.gross_revenue_total), 0);
  const grossMargin = year1GrossRevenue > 0 ? ((year1Revenue / year1GrossRevenue) * 100) : 0;

  const avgMonthlyGrowth = year1Projections.length > 1
    ? ((year1Projections[year1Projections.length - 1].platform_net_revenue / year1Projections[0].platform_net_revenue) - 1) * 100
    : 0;

  const chartData = year1Projections.map((p) => ({
    month: `M${p.month_index}`,
    revenue: Math.round(p.platform_net_revenue),
    creatorPayout: Math.round(p.creator_payout),
  }));

  const handleExportPDF = () => {
    // Placeholder for PDF export
    alert("PDF export would be implemented here using existing PDF generation system");
  };

  const narratives: Record<string, string> = {
    "Base": "Steady growth with realistic CPMs and moderate advertiser adoption. Assumes consistent creator engagement and industry-standard conversion rates. Platform scales efficiently with predictable revenue trajectory.",
    "Growth": "Conservative case assuming steady user growth with lower CPMs. Factors in market conditions and moderate advertiser budgets. Demonstrates resilience with steady growth trajectory.",
    "Aggressive": "Upside case assuming strong creator adoption and premium advertiser demand. Accelerated growth driven by network effects, brand partnerships, and market leadership. Represents best-case execution scenario.",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <PresentationIcon className="h-6 w-6 text-primary" />
                Investor View
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Presentation-ready financial projections
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportPDF} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button>
                <Share2 className="h-4 w-4 mr-2" />
                Share with Investors
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Scenario Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Scenario</label>
            <Select value={selectedScenario} onValueChange={setSelectedScenario}>
              <SelectTrigger>
                <SelectValue placeholder="Choose scenario" />
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
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Year 1 Projected Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${Math.round(year1Revenue).toLocaleString()}</p>
                <Badge className="mt-2" variant="secondary">{selectedScenarioData?.name}</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Year 1 Creator Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${Math.round(year1CreatorPayout).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {((year1CreatorPayout / year1GrossRevenue) * 100).toFixed(0)}% of gross
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Seeksy Gross Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{grossMargin.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground mt-1">on ad spend</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Monthly Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{avgMonthlyGrowth.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground mt-1">Year 1</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>12-Month Revenue Trajectory</CardTitle>
              <CardDescription>Platform revenue vs creator payouts</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} name="Platform Revenue" />
                  <Line type="monotone" dataKey="creatorPayout" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Creator Payout" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Key Bullets */}
          <Card>
            <CardHeader>
              <CardTitle>Key Highlights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-sm">
                  Year 1 projected total revenue: <strong>${Math.round(year1Revenue).toLocaleString()}</strong>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-sm">
                  Year 1 projected creator payouts: <strong>${Math.round(year1CreatorPayout).toLocaleString()}</strong>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-sm">
                  Seeksy keeps <strong>{grossMargin.toFixed(1)}%</strong> gross margin on ad spend
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-sm">
                  Average monthly revenue growth: <strong>{avgMonthlyGrowth.toFixed(1)}%</strong>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-sm">
                  Primary drivers: CPM rates, impressions per user, advertiser conversion, and renewal rate
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Narrative */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedScenarioData?.name} Narrative</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {narratives[selectedScenarioData?.name || ""] || selectedScenarioData?.description}
              </p>
            </CardContent>
          </Card>

          {/* Summary */}
          {summary && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground whitespace-pre-line font-mono bg-muted/30 p-4 rounded-lg">
                  {summary.summary_text}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            Select a scenario to view investor presentation
          </CardContent>
        </Card>
      )}
    </div>
  );
}
