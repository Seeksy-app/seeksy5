import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPodcastRevenue } from "@/lib/api/financialApis";
import { 
  TrendingUp, 
  Users, 
  Globe,
  Play
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface StatsTabProps {
  podcastId: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const StatsTab = ({ podcastId }: StatsTabProps) => {
  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ["podcast-revenue-stats", podcastId],
    queryFn: () => getPodcastRevenue(podcastId),
  });

  const { data: episodes } = useQuery({
    queryKey: ["podcast-episodes-stats", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("podcast_id", podcastId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (revenueLoading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Generate dates for the last 30 days and create data points
  const generateListensData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        listens: Math.floor(Math.random() * 500) + 100,
      });
    }
    
    return data;
  };

  const listensOverTime = generateListensData();

  const platformData = [
    { name: 'Spotify', value: 45 },
    { name: 'Apple', value: 30 },
    { name: 'YouTube', value: 15 },
    { name: 'Seeksy', value: 10 },
  ];

  const episodePerformance = episodes?.slice(0, 10).map((ep, idx) => ({
    title: ep.title.slice(0, 30) + (ep.title.length > 30 ? '...' : ''),
    listens: Math.floor(Math.random() * 1000) + 100,
    completion: Math.floor(Math.random() * 40) + 60,
    subscribers: Math.floor(Math.random() * 50),
    revenue: Math.random() * 100,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listens</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenue?.total_impressions?.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72%</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+43 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">Global reach</p>
          </CardContent>
        </Card>
      </div>

      {/* Listens Over Time */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Listens Over Time</CardTitle>
          <CardDescription>Total podcast listens by episode release date</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={listensOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="listens" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3} 
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Platform Analytics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Where your listeners are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Countries</CardTitle>
            <CardDescription>Listener demographics by country</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { country: "United States", listens: 456, flag: "🇺🇸" },
                { country: "United Kingdom", listens: 234, flag: "🇬🇧" },
                { country: "Canada", listens: 189, flag: "🇨🇦" },
                { country: "Australia", listens: 123, flag: "🇦🇺" },
                { country: "Germany", listens: 98, flag: "🇩🇪" },
              ].map((item) => (
                <div key={item.country} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{item.flag}</span>
                    <span>{item.country}</span>
                  </div>
                  <span className="font-medium">{item.listens}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Episode Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Episode Performance</CardTitle>
          <CardDescription>Detailed analytics for each episode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Episode</th>
                  <th className="text-right py-2 px-2">Listens</th>
                  <th className="text-right py-2 px-2">Completion</th>
                  <th className="text-right py-2 px-2">New Subs</th>
                  <th className="text-right py-2 px-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {episodePerformance.map((ep, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-3 px-2">{ep.title}</td>
                    <td className="text-right py-3 px-2">{ep.listens.toLocaleString()}</td>
                    <td className="text-right py-3 px-2">{ep.completion}%</td>
                    <td className="text-right py-3 px-2">+{ep.subscribers}</td>
                    <td className="text-right py-3 px-2">${ep.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
