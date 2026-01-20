import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MousePointerClick, Percent, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function EmailClicksWidget() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['email-clicks-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get total clicked emails
      const { count: totalClicks } = await supabase
        .from('email_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('event_type', 'email.clicked');

      // Get total sent emails for click rate calculation
      const { count: totalSent } = await supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'sent');

      // Get clicks in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: clicksLast30Days } = await supabase
        .from('email_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('event_type', 'email.clicked')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const clickRate = totalSent && totalSent > 0 
        ? ((totalClicks || 0) / totalSent) * 100 
        : 0;

      return {
        totalClicks: totalClicks || 0,
        clicksLast30Days: clicksLast30Days || 0,
        clickRate,
      };
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const totalClicks = stats?.totalClicks || 0;
  const clicksLast30Days = stats?.clicksLast30Days || 0;
  const clickRate = stats?.clickRate || 0;

  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-border/50 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-semibold tracking-tight">Email Link Clicks</CardTitle>
        <MousePointerClick className="h-5 w-5 text-brand-navy drop-shadow-sm" />
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
          {totalClicks.toLocaleString()}
        </div>
        <div className="flex items-center text-sm text-muted-foreground font-medium mb-3">
          <Percent className="mr-1.5 h-4 w-4" />
          <span>{clickRate.toFixed(1)}% click-through rate</span>
        </div>
        <Progress value={clickRate} className="h-2.5" />
        <p className="text-xs text-muted-foreground mt-3">
          {clicksLast30Days.toLocaleString()} clicks in last 30 days
        </p>
      </CardContent>
    </Card>
  );
}
