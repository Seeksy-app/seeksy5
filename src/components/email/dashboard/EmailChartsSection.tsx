import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, subDays } from "date-fns";

interface EmailChartsSectionProps {
  userId?: string;
}

export const EmailChartsSection = ({ userId }: EmailChartsSectionProps) => {
  // Fetch daily stats for last 30 days
  const { data: dailyStats } = useQuery({
    queryKey: ["email-daily-stats", userId],
    queryFn: async () => {
      if (!userId) return [];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: events } = await supabase
        .from("email_events")
        .select("event_type, created_at")
        .eq("user_id", userId)
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (!events) return [];

      // Group by day
      const dailyMap = new Map();
      
      for (let i = 0; i < 30; i++) {
        const date = subDays(new Date(), i);
        const dateKey = format(date, "yyyy-MM-dd");
        dailyMap.set(dateKey, { date: dateKey, sent: 0, opened: 0, clicked: 0 });
      }

      events.forEach(event => {
        const dateKey = format(new Date(event.created_at), "yyyy-MM-dd");
        if (dailyMap.has(dateKey)) {
          const day = dailyMap.get(dateKey);
          if (event.event_type === "sent") day.sent++;
          if (event.event_type === "opened") day.opened++;
          if (event.event_type === "clicked") day.clicked++;
        }
      });

      return Array.from(dailyMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(d => ({
          ...d,
          date: format(new Date(d.date), "MMM d"),
        }));
    },
    enabled: !!userId,
  });

  // Fetch top campaigns
  const { data: topCampaigns } = useQuery({
    queryKey: ["email-top-campaigns", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data } = await supabase
        .from("email_campaigns")
        .select("subject, total_sent, total_clicked")
        .eq("user_id", userId)
        .order("total_clicked", { ascending: false })
        .limit(5);

      return data?.map(c => ({
        name: c.subject.length > 30 ? c.subject.substring(0, 30) + "..." : c.subject,
        clicks: c.total_clicked || 0,
        ctr: c.total_sent > 0 ? ((c.total_clicked / c.total_sent) * 100).toFixed(1) : "0",
      })) || [];
    },
    enabled: !!userId,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Email Activity</CardTitle>
          <CardDescription>Sends, opens, and clicks over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyStats && dailyStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="sent" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                <Area type="monotone" dataKey="opened" stackId="1" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.3} />
                <Area type="monotone" dataKey="clicked" stackId="1" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No data yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Top Campaigns</CardTitle>
          <CardDescription>By click-through rate (CTR)</CardDescription>
        </CardHeader>
        <CardContent>
          {topCampaigns && topCampaigns.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topCampaigns} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="clicks" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No campaigns yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
