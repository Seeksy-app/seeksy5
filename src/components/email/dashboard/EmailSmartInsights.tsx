import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Trophy, TrendingUp, Users } from "lucide-react";

interface EmailSmartInsightsProps {
  userId?: string;
}

export const EmailSmartInsights = ({ userId }: EmailSmartInsightsProps) => {
  const { data: insights } = useQuery({
    queryKey: ["email-insights", userId],
    queryFn: async () => {
      if (!userId) return null;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get top performing subject line
      const { data: campaigns } = await supabase
        .from("email_campaigns")
        .select("subject, total_sent, total_opened")
        .eq("user_id", userId)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("total_opened", { ascending: false })
        .limit(1);

      const topSubject = campaigns?.[0];
      const topSubjectOpenRate = topSubject && topSubject.total_sent > 0
        ? ((topSubject.total_opened / topSubject.total_sent) * 100).toFixed(1)
        : null;

      // Get most active segment
      const { data: segments } = await supabase
        .from("segments")
        .select("name")
        .eq("user_id", userId)
        .limit(1);

      const topSegment = segments?.[0];

      // Calculate best send window from opened events
      const { data: openEvents } = await supabase
        .from("email_events")
        .select("created_at")
        .eq("user_id", userId)
        .eq("event_type", "opened")
        .gte("created_at", thirtyDaysAgo.toISOString());

      let bestSendWindow = "9–11 AM";
      if (openEvents && openEvents.length > 5) {
        const hourCounts = new Map<number, number>();
        openEvents.forEach(event => {
          const hour = new Date(event.created_at).getHours();
          hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
        });
        const sortedHours = Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1]);
        if (sortedHours.length > 0) {
          const topHour = sortedHours[0][0];
          bestSendWindow = `${topHour}–${topHour + 2} ${topHour >= 12 ? 'PM' : 'AM'}`;
        }
      }

      return {
        topSubject: topSubject?.subject,
        topSubjectOpenRate,
        topSegment: topSegment?.name,
        topSegmentSize: null,
        bestSendWindow,
      };
    },
    enabled: !!userId,
  });

  const insightCards = [
    {
      icon: Clock,
      title: "Best Send Window",
      value: insights?.bestSendWindow || "9–11 AM",
      description: "Your audience is most active during this time",
    },
    {
      icon: Trophy,
      title: "Top Subject Line",
      value: insights?.topSubject || "No data yet",
      description: insights?.topSubjectOpenRate ? `${insights.topSubjectOpenRate}% open rate` : "Send campaigns to see insights",
    },
    {
      icon: Users,
      title: "Most Active Segment",
      value: insights?.topSegment || "No segments yet",
      description: "Create segments to see insights",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Insights</CardTitle>
        <CardDescription>AI-powered recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {insightCards.map((insight) => {
          const Icon = insight.icon;
          return (
            <div key={insight.title} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <div className="mt-1">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="text-xs text-muted-foreground truncate">{insight.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
