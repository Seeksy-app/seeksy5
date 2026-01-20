import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio, Eye, Users, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function StreamAnalyticsWidget() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stream-analytics'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if stream is currently live
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_live')
        .eq('id', user.id)
        .single();

      // Get total stream views
      const { count: totalViews } = await supabase
        .from('stream_impressions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id);

      // Get total watch time
      const { data: watchTimeData } = await supabase
        .from('stream_impressions')
        .select('watch_duration_seconds')
        .eq('creator_id', user.id);

      const totalWatchSeconds = watchTimeData?.reduce((sum, record) => 
        sum + (record.watch_duration_seconds || 0), 0) || 0;
      
      const avgWatchTimeSeconds = totalViews && totalViews > 0 
        ? totalWatchSeconds / totalViews 
        : 0;

      // Get current live viewers (viewers in last 5 minutes)
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      const { count: liveViewers } = await supabase
        .from('stream_impressions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .gte('started_at', fiveMinutesAgo.toISOString());

      return {
        isLive: profile?.is_live || false,
        totalViews: totalViews || 0,
        liveViewers: liveViewers || 0,
        totalWatchTimeHours: Math.round(totalWatchSeconds / 3600),
        avgWatchTimeMinutes: Math.round(avgWatchTimeSeconds / 60),
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

  const isLive = stats?.isLive || false;
  const totalViews = stats?.totalViews || 0;
  const liveViewers = stats?.liveViewers || 0;
  const totalWatchTimeHours = stats?.totalWatchTimeHours || 0;
  const avgWatchTimeMinutes = stats?.avgWatchTimeMinutes || 0;

  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-border/50 bg-gradient-to-br from-card via-card to-brand-red/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold tracking-tight">My Page Streaming</CardTitle>
        <Badge variant={isLive ? "default" : "secondary"} className={isLive ? "bg-brand-red text-white" : ""}>
          {isLive ? "Live" : "Offline"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold tracking-tight mb-3 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
          {totalViews.toLocaleString()}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Watch Time</span>
            <span className="font-bold">{totalWatchTimeHours}h</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Avg Watch Time</span>
            <span className="font-bold">{avgWatchTimeMinutes} min</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-muted-foreground">
              <Users className="mr-1.5 h-4 w-4" />
              <span>Live Viewers</span>
            </div>
            <span className="font-bold">{liveViewers}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}