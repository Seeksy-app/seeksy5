import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Ticket, DollarSign, CheckCircle, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface EventAnalyticsProps {
  eventId: string;
}

interface AnalyticsData {
  totalRegistrations: number;
  checkedIn: number;
  ticketsSold: number;
  revenue: number;
  registrationsByDay: Array<{ date: string; count: number }>;
  ticketsByTier: Array<{ name: string; count: number; revenue: number }>;
  checkInRate: number;
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export function EventAnalytics({ eventId }: EventAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [eventId]);

  const loadAnalytics = async () => {
    try {
      // Get registrations
      const regResult = await (supabase as any)
        .from("event_registrations")
        .select("*")
        .eq("event_id", eventId);

      if (regResult.error) throw regResult.error;
      const registrations = (regResult.data || []) as any[];

      // Get tickets with tiers
      const ticketResult = await (supabase as any)
        .from("event_tickets")
        .select("*, event_ticket_tiers(*)")
        .eq("event_id", eventId);

      if (ticketResult.error) throw ticketResult.error;
      const tickets = (ticketResult.data || []) as any[];

      // Get ticket tiers
      const tierResult = await (supabase as any)
        .from("event_ticket_tiers")
        .select("*")
        .eq("event_id", eventId);

      if (tierResult.error) throw tierResult.error;
      const tiers = (tierResult.data || []) as any[];

      // Calculate analytics
      const totalRegistrations = registrations.length;
      const checkedIn = registrations.filter((r: any) => r.checked_in).length;
      const checkInRate = totalRegistrations > 0 ? (checkedIn / totalRegistrations) * 100 : 0;

      // Calculate revenue
      let revenue = 0;
      const ticketsByTier: Record<string, { count: number; revenue: number; name: string }> = {};

      tiers.forEach((tier: any) => {
        ticketsByTier[tier.id] = {
          name: tier.name,
          count: tier.quantity_sold || 0,
          revenue: (tier.quantity_sold || 0) * (tier.price || 0),
        };
        revenue += (tier.quantity_sold || 0) * (tier.price || 0);
      });

      // Registrations by day
      const regByDay: Record<string, number> = {};
      registrations.forEach((reg: any) => {
        const date = new Date(reg.registered_at).toLocaleDateString();
        regByDay[date] = (regByDay[date] || 0) + 1;
      });

      const registrationsByDay = Object.entries(regByDay)
        .map(([date, count]) => ({ date, count }))
        .slice(-14); // Last 14 days

      setData({
        totalRegistrations,
        checkedIn,
        ticketsSold: tickets.length,
        revenue,
        registrationsByDay,
        ticketsByTier: Object.values(ticketsByTier),
        checkInRate,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Unable to load analytics
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.totalRegistrations}</p>
                <p className="text-sm text-muted-foreground">Registrations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.checkedIn}</p>
                <p className="text-sm text-muted-foreground">Checked In</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Ticket className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.ticketsSold}</p>
                <p className="text-sm text-muted-foreground">Tickets Sold</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <DollarSign className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${data.revenue.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Registrations Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Registrations Over Time
            </CardTitle>
            <CardDescription>Daily registration count</CardDescription>
          </CardHeader>
          <CardContent>
            {data.registrationsByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.registrationsByDay}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No registration data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tickets by Tier */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Tickets by Tier
            </CardTitle>
            <CardDescription>Distribution of ticket types</CardDescription>
          </CardHeader>
          <CardContent>
            {data.ticketsByTier.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={data.ticketsByTier}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                    >
                      {data.ticketsByTier.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {data.ticketsByTier.map((tier, index) => (
                    <div key={tier.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{tier.name}</span>
                      <span className="text-sm text-muted-foreground">({tier.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                No ticket data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Check-in Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Check-in Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{data.checkedIn} of {data.totalRegistrations} checked in</span>
              <span className="font-medium">{data.checkInRate.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${data.checkInRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
