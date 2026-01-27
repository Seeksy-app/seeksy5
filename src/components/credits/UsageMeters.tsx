import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, HardDrive, Video, Radio, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface UsageMeterProps {
  label: string;
  used: number;
  limit: number;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  warningThreshold?: number;
}

function UsageMeter({ label, used, limit, unit, icon: Icon, warningThreshold = 80 }: UsageMeterProps) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isWarning = percentage >= warningThreshold;
  const isExceeded = percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${isWarning ? 'text-amber-500' : 'text-muted-foreground'}`} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {isWarning && !isExceeded && (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
          <span className={`text-sm ${isExceeded ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
            {used.toFixed(1)} / {limit} {unit}
          </span>
        </div>
      </div>
      <Progress 
        value={percentage} 
        className={`h-2 ${isExceeded ? '[&>div]:bg-destructive' : isWarning ? '[&>div]:bg-amber-500' : ''}`}
      />
      {isWarning && !isExceeded && (
        <p className="text-xs text-amber-600">
          Approaching limit — additional usage will use credits.
        </p>
      )}
      {isExceeded && (
        <p className="text-xs text-destructive">
          Limit exceeded — current usage is deducting credits.
        </p>
      )}
    </div>
  );
}

export function UsageMeters() {
  const { data: usageLimits, isLoading } = useQuery({
    queryKey: ['user-usage-limits'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const result = await (supabase as any)
        .from('user_usage_limits')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (result.error && result.error.code !== 'PGRST116') throw result.error;
      
      // Return defaults if no record exists
      return (result.data as any) || {
        storage_used_gb: 0,
        free_storage_gb: 25,
        recording_minutes_used: 0,
        free_recording_minutes_monthly: 600,
        streaming_minutes_used: 0,
        free_streaming_minutes_monthly: 300,
      };
    },
  });

  const { data: credits } = useQuery({
    queryKey: ['user-credits'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const result = await (supabase as any)
        .from('user_credits')
        .select('balance')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (result.error && result.error.code !== 'PGRST116') throw result.error;
      return result.data as any;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usage & Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const recordingHours = (usageLimits?.recording_minutes_used || 0) / 60;
  const recordingLimitHours = (usageLimits?.free_recording_minutes_monthly || 600) / 60;
  const streamingHours = (usageLimits?.streaming_minutes_used || 0) / 60;
  const streamingLimitHours = (usageLimits?.free_streaming_minutes_monthly || 300) / 60;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Usage & Limits</CardTitle>
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            {credits?.balance || 0} credits
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <UsageMeter
          label="Storage"
          used={usageLimits?.storage_used_gb || 0}
          limit={usageLimits?.free_storage_gb || 25}
          unit="GB"
          icon={HardDrive}
        />
        <UsageMeter
          label="Recording"
          used={recordingHours}
          limit={recordingLimitHours}
          unit="hrs"
          icon={Video}
        />
        <UsageMeter
          label="Streaming"
          used={streamingHours}
          limit={streamingLimitHours}
          unit="hrs"
          icon={Radio}
        />
      </CardContent>
    </Card>
  );
}