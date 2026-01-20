import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Ticket, Clock, CheckCircle, AlertTriangle, TrendingUp, Users } from "lucide-react";

export default function Analytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["helpdesk-analytics"],
    queryFn: async () => {
      const { data: tickets, error } = await supabase
        .from("tickets")
        .select("status, priority, created_at, resolved_at");
      
      if (error) throw error;

      const total = tickets?.length || 0;
      const open = tickets?.filter((t) => t.status === "open").length || 0;
      const inProgress = tickets?.filter((t) => t.status === "in_progress").length || 0;
      const resolved = tickets?.filter((t) => t.status === "resolved").length || 0;
      const urgent = tickets?.filter((t) => t.priority === "urgent").length || 0;

      // Calculate average resolution time for resolved tickets
      const resolvedTickets = tickets?.filter((t) => t.resolved_at && t.created_at) || [];
      let avgResolutionHours = 0;
      if (resolvedTickets.length > 0) {
        const totalHours = resolvedTickets.reduce((acc, t) => {
          const created = new Date(t.created_at!).getTime();
          const resolved = new Date(t.resolved_at!).getTime();
          return acc + (resolved - created) / (1000 * 60 * 60);
        }, 0);
        avgResolutionHours = totalHours / resolvedTickets.length;
      }

      return {
        total,
        open,
        inProgress,
        resolved,
        urgent,
        avgResolutionHours: avgResolutionHours.toFixed(1),
        resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(0) : 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const metrics = [
    { title: "Total Tickets", value: stats?.total || 0, icon: Ticket, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Open", value: stats?.open || 0, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-100" },
    { title: "In Progress", value: stats?.inProgress || 0, icon: Clock, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Resolved", value: stats?.resolved || 0, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-muted-foreground">Help desk performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-lg ${metric.bg} flex items-center justify-center`}>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Resolution Rate
            </CardTitle>
            <CardDescription>Percentage of tickets resolved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">{stats?.resolutionRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Avg Resolution Time
            </CardTitle>
            <CardDescription>Average time to resolve tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">{stats?.avgResolutionHours}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Urgent Tickets
            </CardTitle>
            <CardDescription>High priority issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-600">{stats?.urgent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for charts */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Volume Over Time</CardTitle>
          <CardDescription>Daily ticket creation trends</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          <p>Chart visualization coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}