import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, MapPin, Info } from "lucide-react";

export const KeyMetricsTab = () => {
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
    queryKey: ["gtm-geo-top"],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("gtm_geographic_data")
        .select("*")
        .order("creator_count", { ascending: false })
        .limit(5);
      return (result.data || []) as any[];
    },
  });

  // Prepare pie chart data
  const totalMarket = segments?.reduce((sum: number, seg: any) => sum + (seg.market_size || 0), 0) || 1;
  const pieData = segments?.map((seg: any) => ({
    name: (seg.segment_name || "").replace(" (YouTube/TikTok)", "").replace("Independent ", ""),
    value: seg.market_size || 0,
    percentage: (((seg.market_size || 0) / totalMarket) * 100).toFixed(1),
  })) || [];

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--accent))",
  ];

  // Prepare geographic bar data
  const geoBarData = geoData?.map((state: any) => ({
    state: state.state_name,
    creators: ((state.creator_count || 0) / 1000000).toFixed(1),
  })) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Market Share Opportunity by Segment
            </CardTitle>
            <CardDescription>Distribution of creators across target segments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percentage }) => `${name}: ${percentage}%`} outerRadius={100} fill="hsl(var(--primary))" dataKey="value">
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => `${(value / 1000000).toFixed(1)}M creators`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Geographic Concentration
            </CardTitle>
            <CardDescription>Top 5 states by creator population</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={geoBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="state" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => `${value}M creators`} />
                <Bar dataKey="creators" fill="hsl(var(--primary))" name="Creators (M)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Key Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">High-Opportunity Markets</h3>
            <p className="text-sm text-muted-foreground">California, Texas, Florida, and New York represent 45% of total addressable market.</p>
          </div>
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Emerging Creator Segment</h3>
            <p className="text-sm text-muted-foreground">AI-Native Creators show 1.8M market size with highest average value ($1,500).</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
