import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreditAnalytics, useCreditUsageByActivity } from "@/hooks/useCreditAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, DollarSign, Zap, RefreshCw, BarChart3 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#ef4444'];

export function CFOCreditMetrics() {
  const { data: analytics, isLoading } = useCreditAnalytics();
  const { data: usageByActivity } = useCreditUsageByActivity();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: "Monthly Credits Consumed",
      value: analytics?.monthlyCreditsConsumed.toLocaleString() || "0",
      icon: Zap,
      description: "Total credits used this month",
    },
    {
      title: "Revenue/User",
      value: `$${analytics?.revenuePerUser.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      description: "Average revenue per active user",
    },
    {
      title: "Cost/User",
      value: `$${analytics?.costPerUser.toFixed(2) || "0.00"}`,
      icon: TrendingUp,
      description: "Modeled cost per user",
    },
    {
      title: "Auto-Renew Rate",
      value: `${analytics?.autoRenewAdoptionRate.toFixed(1) || "0"}%`,
      icon: RefreshCw,
      description: "Users with auto-renew enabled",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Credit Usage by Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usageByActivity && usageByActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={usageByActivity}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No usage data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Users</span>
                <span className="font-bold">{analytics?.totalActiveUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Avg Credits/User</span>
                <span className="font-bold">{analytics?.avgCreditsPerUser.toFixed(0) || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Overage Credits</span>
                <span className="font-bold">{analytics?.overageCredits.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Revenue</span>
                <span className="font-bold text-primary">${analytics?.totalRevenue.toFixed(2) || "0.00"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}