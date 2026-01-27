import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, AlertTriangle, CheckCircle, Clock, ExternalLink, Key, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string | null;
  source_ip: string | null;
  endpoint: string | null;
  is_resolved: boolean;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

const severityColors: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/50",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/50",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  low: "bg-blue-500/20 text-blue-400 border-blue-500/50",
};

const severityIcons: Record<string, React.ReactNode> = {
  critical: <AlertTriangle className="h-4 w-4 text-red-400" />,
  high: <AlertTriangle className="h-4 w-4 text-orange-400" />,
  medium: <Shield className="h-4 w-4 text-yellow-400" />,
  low: <Shield className="h-4 w-4 text-blue-400" />,
};

export function SecurityAlertsPanel() {
  const queryClient = useQueryClient();
  const [isMigrating, setIsMigrating] = useState(false);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["security-alerts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("security_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []) as SecurityAlert[];
    },
  });

  const runTokenMigration = async () => {
    setIsMigrating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("You must be logged in to run the migration");
        return;
      }

      const response = await supabase.functions.invoke("migrate-oauth-tokens", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const result = response.data;
      toast.success(`Token migration complete: ${result.migrated} encrypted, ${result.skipped} already encrypted`);
      queryClient.invalidateQueries({ queryKey: ["security-alerts"] });
    } catch (error) {
      console.error("Migration error:", error);
      toast.error("Failed to run token migration");
    } finally {
      setIsMigrating(false);
    }
  };

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await (supabase as any)
        .from("security_alerts")
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString() 
        })
        .eq("id", alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security-alerts"] });
      toast.success("Alert marked as resolved");
    },
    onError: () => {
      toast.error("Failed to resolve alert");
    },
  });

  const unresolvedCount = alerts?.filter(a => !a.is_resolved).length || 0;
  const criticalCount = alerts?.filter(a => !a.is_resolved && a.severity === "critical").length || 0;

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 animate-spin" />
            Loading security alerts...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Security Alerts
          </CardTitle>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={runTokenMigration}
              disabled={isMigrating}
            >
              {isMigrating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              {isMigrating ? "Migrating..." : "Encrypt Tokens"}
            </Button>
            {criticalCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {criticalCount} Critical
              </Badge>
            )}
            {unresolvedCount > 0 && (
              <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                {unresolvedCount} Unresolved
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!alerts || alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-muted-foreground">No security alerts</p>
            <p className="text-sm text-muted-foreground/70">Your system is secure</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.is_resolved 
                      ? "bg-muted/30 border-border opacity-60" 
                      : severityColors[alert.severity] || severityColors.medium
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {!alert.is_resolved && (severityIcons[alert.severity] || severityIcons.medium)}
                      {alert.is_resolved && <CheckCircle className="h-4 w-4 text-green-500" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{alert.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {alert.alert_type}
                          </Badge>
                        </div>
                        {alert.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {alert.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{formatDistanceToNow(new Date(alert.created_at))} ago</span>
                          {alert.source_ip && <span>IP: {alert.source_ip}</span>}
                          {alert.endpoint && (
                            <span className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              {alert.endpoint}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!alert.is_resolved && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resolveAlert.mutate(alert.id)}
                        disabled={resolveAlert.isPending}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
