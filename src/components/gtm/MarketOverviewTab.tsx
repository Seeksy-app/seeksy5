import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, Users, TrendingUp, Target, BarChart } from "lucide-react";

export const MarketOverviewTab = () => {
  const { data: metrics } = useQuery({
    queryKey: ["gtm-metrics"],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("gtm_market_metrics")
        .select("*")
        .eq("category", "market_overview")
        .order("display_order");
      return (result.data || []) as any[];
    },
  });

  const { data: segments } = useQuery({
    queryKey: ["gtm-segments"],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("gtm_market_segments")
        .select("*")
        .order("display_order");
      return (result.data || []) as any[];
    },
  });

  const { data: geoData } = useQuery({
    queryKey: ["gtm-geo"],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("gtm_geographic_data")
        .select("*")
        .order("display_order")
        .limit(10);
      return (result.data || []) as any[];
    },
  });

  const topMetrics = metrics?.slice(0, 4) || [];
  
  const chartData = geoData?.map((state: any) => ({
    name: state.state_code,
    creators: state.creator_count,
    value: (state.market_value || 0) / 1000000000,
  })) || [];

  const getIconForMetric = (name: string) => {
    if (name?.includes("Market")) return <DollarSign className="w-5 h-5" />;
    if (name?.includes("Growth")) return <TrendingUp className="w-5 h-5" />;
    if (name?.includes("Target")) return <Target className="w-5 h-5" />;
    return <Users className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {topMetrics.map((metric: any) => (
          <Card key={metric.id} className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <div className="text-muted-foreground">{getIconForMetric(metric.metric_name)}</div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{metric.metric_name}</p>
                <p className="text-3xl font-bold text-primary">{metric.metric_value}</p>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Top 10 States: Creator Population & Market Value
          </CardTitle>
          <CardDescription>Geographic distribution of active creators</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RechartsBarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
              <Legend />
              <Bar yAxisId="left" dataKey="creators" fill="hsl(var(--primary))" name="Creators" />
              <Bar yAxisId="right" dataKey="value" fill="hsl(var(--accent))" name="Market Value ($B)" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Target Market Segments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {segments?.map((segment: any) => (
              <div key={segment.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{segment.segment_name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Market Size: {((segment.market_size || 0) / 1000000).toFixed(1)}M creators</p>
                  <p className="text-xs text-muted-foreground mt-1">{segment.description}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm text-muted-foreground">Avg. Value</p>
                  <p className="text-2xl font-bold text-primary">${segment.avg_value}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${segment.potential_rating === "Very High Potential" ? "bg-green-500/10 text-green-600 dark:text-green-400" : segment.potential_rating === "High Potential" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"}`}>
                    {segment.potential_rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
