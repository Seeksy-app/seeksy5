import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, TrendingUp, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Progress } from "@/components/ui/progress";

export function EmailsSentWidget() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['email-sent-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get total sent emails from email_logs
      const { count: totalSent } = await supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'sent');

      // Get sent emails in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: sentLast30Days } = await supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'sent')
        .gte('sent_at', thirtyDaysAgo.toISOString());

      // Get last sent email
      const { data: lastSent } = await supabase
        .from('email_logs')
        .select('sent_at, recipient_email')
        .eq('user_id', user.id)
        .eq('status', 'sent')
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        totalSent: totalSent || 0,
        sentLast30Days: sentLast30Days || 0,
        lastSent,
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

  const totalSent = stats?.totalSent || 0;
  const sentLast30Days = stats?.sentLast30Days || 0;

  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-border/50 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-semibold tracking-tight">Emails Sent</CardTitle>
        <Mail className="h-5 w-5 text-brand-red drop-shadow-sm" />
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
          {totalSent.toLocaleString()}
        </div>
        <div className="flex items-center text-sm text-muted-foreground font-medium mb-3">
          <TrendingUp className="mr-1.5 h-4 w-4 text-green-500" />
          <span>{sentLast30Days.toLocaleString()} in last 30 days</span>
        </div>
        <Progress value={sentLast30Days > 0 ? Math.min((sentLast30Days / totalSent) * 100, 100) : 0} className="h-2.5" />
        {stats?.lastSent && (
          <p className="text-xs text-muted-foreground mt-3">
            Last sent {formatDistanceToNow(new Date(stats.lastSent.sent_at), { addSuffix: true })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
