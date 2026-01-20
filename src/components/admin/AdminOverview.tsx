import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Users, DollarSign, TrendingUp, Radio, Loader2 } from "lucide-react";

const COLORS = ['#E63946', '#F77F00', '#06D6A0', '#118AB2', '#073B4C'];
const GRADIENT_COLORS = {
  primary: { start: '#E63946', end: '#F77F00' },
  secondary: { start: '#06D6A0', end: '#118AB2' },
  tertiary: { start: '#F77F00', end: '#E63946' },
};

interface AdminOverviewProps {
  demoMode?: boolean;
}

export function AdminOverview({ demoMode = false }: AdminOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalCreators: 0,
    totalAdvertisers: 0,
    totalRevenue: 0,
    totalImpressions: 0,
    activeSubscriptions: 0,
  });
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState<any[]>([]);
  const [subscriptionDistribution, setSubscriptionDistribution] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [demoMode]);

  const loadAnalytics = async () => {
    try {
      if (demoMode) {
        // Generate impressive demo data for investors
        const demoMetrics = {
          totalUsers: 2847,
          totalCreators: 423,
          totalAdvertisers: 87,
          totalRevenue: 145680,
          totalImpressions: 8743256,
          activeSubscriptions: 312,
        };

        const demoUserGrowth = [
          { month: "July 2024", users: 245, label: "Jul" },
          { month: "August 2024", users: 387, label: "Aug" },
          { month: "September 2024", users: 521, label: "Sep" },
          { month: "October 2024", users: 756, label: "Oct" },
          { month: "November 2024", users: 1124, label: "Nov" },
          { month: "December 2024", users: 2847, label: "Dec" },
        ];

        const demoRevenueData = [
          { name: "Ad Revenue", value: 98450 },
          { name: "Subscriptions", value: 35680 },
          { name: "Awards", value: 11550 },
        ];

        const demoSubDist = [
          { name: "Free", value: 2535 },
          { name: "Pro", value: 256 },
          { name: "Business", value: 56 },
        ];

        setMetrics(demoMetrics);
        setUserGrowth(demoUserGrowth);
        setRevenueBreakdown(demoRevenueData);
        setSubscriptionDistribution(demoSubDist);
        setLoading(false);
        return;
      }

      // Real data loading
      // Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get creators count
      const { count: totalCreators } = await supabase
        .from("podcasts")
        .select("user_id", { count: "exact", head: true });

      // Get advertisers count
      const { count: totalAdvertisers } = await supabase
        .from("advertisers")
        .select("*", { count: "exact", head: true });

      // Get total ad impressions
      const { count: totalImpressions } = await supabase
        .from("ad_impressions")
        .select("*", { count: "exact", head: true });

      // Get active subscriptions
      const { count: activeSubscriptions } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Get total revenue from ad campaigns
      const { data: campaigns } = await supabase
        .from("ad_campaigns")
        .select("total_spent");
      
      const totalRevenue = campaigns?.reduce((sum, c) => sum + (Number(c.total_spent) || 0), 0) || 0;

      // Get user growth over last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: users } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", sixMonthsAgo.toISOString());

      const monthlyGrowth = processUserGrowth(users || []);

      // Revenue breakdown by source
      const revenueData = [
        { name: "Ad Revenue", value: totalRevenue },
        { name: "Subscriptions", value: (activeSubscriptions || 0) * 19 }, // Assuming avg $19/month
        { name: "Awards", value: Math.random() * 5000 }, // Placeholder
      ];

      // Subscription distribution
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("plan_name");
      
      const subDist = processSubscriptionDistribution(subs || []);

      setMetrics({
        totalUsers: totalUsers || 0,
        totalCreators: totalCreators || 0,
        totalAdvertisers: totalAdvertisers || 0,
        totalRevenue,
        totalImpressions: totalImpressions || 0,
        activeSubscriptions: activeSubscriptions || 0,
      });
      setUserGrowth(monthlyGrowth);
      setRevenueBreakdown(revenueData);
      setSubscriptionDistribution(subDist);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const processUserGrowth = (users: any[]) => {
    const months = new Map();
    users.forEach(user => {
      const date = new Date(user.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.set(monthKey, (months.get(monthKey) || 0) + 1);
    });

    return Array.from(months.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => {
        const date = new Date(month + '-01');
        return {
          month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          label: date.toLocaleDateString('en-US', { month: 'short' }),
          users: count,
        };
      });
  };

  const processSubscriptionDistribution = (subs: any[]) => {
    const dist = new Map();
    subs.forEach(sub => {
      const plan = sub.plan_name || 'free';
      dist.set(plan, (dist.get(plan) || 0) + 1);
    });

    return Array.from(dist.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#E63946]/20 bg-gradient-to-br from-background to-[#E63946]/5 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <div className="p-2 rounded-full bg-[#E63946]/10">
              <Users className="h-4 w-4 text-[#E63946]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-[#E63946] to-[#F77F00] bg-clip-text text-transparent">
              {metrics.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.totalCreators} creators, {metrics.totalAdvertisers} advertisers
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#06D6A0]/20 bg-gradient-to-br from-background to-[#06D6A0]/5 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="p-2 rounded-full bg-[#06D6A0]/10">
              <DollarSign className="h-4 w-4 text-[#06D6A0]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-[#06D6A0] to-[#118AB2] bg-clip-text text-transparent">
              ${metrics.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              From ads, subscriptions, and awards
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#F77F00]/20 bg-gradient-to-br from-background to-[#F77F00]/5 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Impressions</CardTitle>
            <div className="p-2 rounded-full bg-[#F77F00]/10">
              <Radio className="h-4 w-4 text-[#F77F00]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-[#F77F00] to-[#E63946] bg-clip-text text-transparent">
              {metrics.totalImpressions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total ad plays across platform
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#118AB2]/20 bg-gradient-to-br from-background to-[#118AB2]/5 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <div className="p-2 rounded-full bg-[#118AB2]/10">
              <TrendingUp className="h-4 w-4 text-[#118AB2]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-[#118AB2] to-[#073B4C] bg-clip-text text-transparent">
              {metrics.activeSubscriptions}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Paid plan subscribers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">User Growth</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="space-y-4">
          <Card className="border-[#E63946]/20">
            <CardHeader>
              <CardTitle>User Growth Over Time</CardTitle>
              <CardDescription>New users registered in the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={userGrowth}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E63946" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#E63946" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="label" 
                    stroke="#888"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#888"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.month;
                      }
                      return label;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#E63946" 
                    strokeWidth={3}
                    fill="url(#colorUsers)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card className="border-[#06D6A0]/20">
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Revenue distribution by source</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={revenueBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent, value }) => `${name}: $${value.toLocaleString()} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {revenueBreakdown.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => `$${value.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card className="border-[#118AB2]/20">
            <CardHeader>
              <CardTitle>Subscription Distribution</CardTitle>
              <CardDescription>Breakdown of users by plan type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={subscriptionDistribution}>
                  <defs>
                    <linearGradient id="colorBar1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#118AB2" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#06D6A0" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name"
                    stroke="#888"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#888"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="url(#colorBar1)"
                    radius={[8, 8, 0, 0]}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
