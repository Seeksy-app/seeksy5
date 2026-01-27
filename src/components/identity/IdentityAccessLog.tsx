import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Shield, UserCheck, UserX, Settings, CheckCircle, XCircle } from "lucide-react";

interface IdentityAccessLogProps {
  assetIds: string[];
}

export function IdentityAccessLog({ assetIds }: IdentityAccessLogProps) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["identity-access-logs", assetIds],
    queryFn: async () => {
      if (!assetIds.length) return [];

      const result = await (supabase as any)
        .from("identity_access_logs")
        .select("*")
        .in("identity_asset_id", assetIds)
        .order("created_at", { ascending: false })
        .limit(50);

      if (result.error) throw result.error;
      return (result.data as any[]) || [];
    },
    enabled: assetIds.length > 0,
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "certified":
        return <Shield className="h-4 w-4 text-green-600" />;
      case "revoked":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "permission_changed":
        return <Settings className="h-4 w-4 text-blue-600" />;
      case "access_granted":
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case "access_denied":
        return <UserX className="h-4 w-4 text-red-600" />;
      case "access_requested":
        return <CheckCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (action) {
      case "certified":
      case "access_granted":
        return "default";
      case "revoked":
      case "access_denied":
        return "destructive";
      case "permission_changed":
      case "access_requested":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading access logs...</div>;
  }

  if (!logs.length) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No activity yet.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Identity events and access grants will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log: any) => (
        <div
          key={log.id}
          className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
        >
          <div className="mt-0.5">{getActionIcon(log.action || '')}</div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={getActionBadgeVariant(log.action || '')} className="text-xs">
                {getActionLabel(log.action || '')}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {log.created_at && format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
            {log.details && typeof log.details === "object" && (
              <div className="text-sm text-muted-foreground">
                {JSON.stringify(log.details, null, 2)
                  .replace(/[{}"]/g, "")
                  .split(",")
                  .map((line: string) => line.trim())
                  .filter((line: string) => line)
                  .map((line: string, i: number) => (
                    <div key={i}>{line}</div>
                  ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
