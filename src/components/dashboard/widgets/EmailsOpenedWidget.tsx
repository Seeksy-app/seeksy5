import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MailOpen, Percent, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function EmailsOpenedWidget() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['email-opened-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get total opened emails
      const { count: totalOpened } = await supabase
        .from('email_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('event_type', 'opened');

      // Get total sent emails for open rate calculation
      const { count: totalSent } = await supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'sent');

      // Get opened emails in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: openedLast30Days } = await supabase
        .from('email_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('event_type', 'opened')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const openRate = totalSent && totalSent > 0 
        ? ((totalOpened || 0) / totalSent) * 100 
        : 0;

      return {
        totalOpened: totalOpened || 0,
        openedLast30Days: openedLast30Days || 0,
        openRate,
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

  const totalOpened = stats?.totalOpened || 0;
  const openedLast30Days = stats?.openedLast30Days || 0;
  const openRate = stats?.openRate || 0;

  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-border/50 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-semibold tracking-tight">Emails Opened</CardTitle>
        <MailOpen className="h-5 w-5 text-brand-blue drop-shadow-sm" />
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
          {totalOpened.toLocaleString()}
        </div>
        <div className="flex items-center text-sm text-muted-foreground font-medium mb-3">
          <Percent className="mr-1.5 h-4 w-4" />
          <span>{openRate.toFixed(1)}% open rate</span>
        </div>
        <Progress value={openRate} className="h-2.5" />
        <p className="text-xs text-muted-foreground mt-3">
          {openedLast30Days.toLocaleString()} opened in last 30 days
        </p>
      </CardContent>
    </Card>
  );
}
