import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  RotateCcw, Search, Trash2, History, AlertTriangle,
  CheckCircle, Clock, Database, Shield
} from "lucide-react";
import { format } from "date-fns";

export default function DataRecovery() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch deleted items
  const { data: deletedItems, isLoading: loadingDeleted } = useQuery({
    queryKey: ["deleted-items", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("deleted_items_recovery")
        .select("*")
        .eq("is_recovered", false)
        .order("deleted_at", { ascending: false })
        .limit(50);

      if (searchQuery) {
        query = query.ilike("deleted_data->name", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Fetch system health logs
  const { data: healthLogs, isLoading: loadingHealth } = useQuery({
    queryKey: ["system-health-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_health_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch contact history (sample)
  const { data: contactHistory } = useQuery({
    queryKey: ["contact-history-sample"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    }
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async (recoveryId: string) => {
      const { data, error } = await supabase.rpc("restore_deleted_item", {
        p_recovery_id: recoveryId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const result = data as Record<string, unknown> | null;
      if (result?.success) {
        toast.success("Item restored successfully");
        queryClient.invalidateQueries({ queryKey: ["deleted-items"] });
      } else {
        toast.error((result?.error as string) || "Failed to restore item");
      }
    },
    onError: () => {
      toast.error("Failed to restore item");
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500";
      case "error": return "bg-red-400";
      case "warning": return "bg-amber-500";
      default: return "bg-blue-500";
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "write_failure": return <AlertTriangle className="h-4 w-4" />;
      case "sync_error": return <RotateCcw className="h-4 w-4" />;
      case "recovery_attempt": return <CheckCircle className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Data Recovery Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Restore deleted data, view version history, and monitor system health
          </p>
        </div>
      </div>

      <Tabs defaultValue="deleted" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="deleted">
            <Trash2 className="h-4 w-4 mr-2" />
            Deleted Items
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Version History
          </TabsTrigger>
          <TabsTrigger value="health">
            <AlertTriangle className="h-4 w-4 mr-2" />
            System Health
          </TabsTrigger>
        </TabsList>

        {/* Deleted Items Tab */}
        <TabsContent value="deleted" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recoverable Deleted Items</CardTitle>
              <CardDescription>
                Items deleted within the last 90 days can be restored
              </CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search deleted items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadingDeleted ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : deletedItems?.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-muted-foreground">No deleted items to recover</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {deletedItems?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{item.original_table}</Badge>
                            <span className="font-medium">
                              {(item.deleted_data as Record<string, unknown>)?.name as string || 
                               (item.deleted_data as Record<string, unknown>)?.title as string || 
                               item.original_id}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Deleted {format(new Date(item.deleted_at), "PPp")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expires {format(new Date(item.recovery_expires_at), "PP")}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => restoreMutation.mutate(item.id)}
                          disabled={restoreMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Version History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Version History</CardTitle>
              <CardDescription>
                View and restore previous versions of contact data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contactHistory?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No version history available yet
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {contactHistory?.map((history) => (
                      <div
                        key={history.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={history.change_type === "deleted" ? "destructive" : "outline"}
                            >
                              {history.change_type}
                            </Badge>
                            <span className="font-medium">
                              Version {history.version_number}
                            </span>
                          </div>
                          {history.changed_fields && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Changed: {history.changed_fields.join(", ")}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(history.created_at), "PPp")}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <History className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="health" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Health Log</CardTitle>
              <CardDescription>
                Monitor data integrity issues and system errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHealth ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : healthLogs?.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="font-medium text-green-700">All Systems Healthy</p>
                  <p className="text-muted-foreground">No issues detected</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {healthLogs?.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-4 border rounded-lg"
                      >
                        <div className={`p-2 rounded-full ${getSeverityColor(log.severity)} text-white`}>
                          {getEventIcon(log.event_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{log.event_type}</Badge>
                            <Badge 
                              variant={log.resolved ? "outline" : "destructive"}
                              className="text-xs"
                            >
                              {log.resolved ? "Resolved" : log.severity}
                            </Badge>
                          </div>
                          {log.table_name && (
                            <p className="text-sm mt-1">Table: {log.table_name}</p>
                          )}
                          {log.error_message && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {log.error_message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {format(new Date(log.created_at), "PPp")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}