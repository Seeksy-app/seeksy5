import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  Mail, 
  MousePointerClick, 
  Eye, 
  TrendingUp,
  Users,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval, parseISO } from "date-fns";

interface CampaignStats {
  id: string;
  title: string;
  subject: string;
  sent_at: string;
  recipient_count: number;
  opened_count: number;
  clicked_count: number;
  status: string;
}

interface EmailEvent {
  id: string;
  event_type: string;
  created_at: string;
  device_type: string | null;
  clicked_url: string | null;
}

interface DailyMetric {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
}

const DEVICE_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))"];

export default function EmailAnalytics() {
  const [campaigns, setCampaigns] = useState<CampaignStats[]>([]);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setIsLoading(true);
    const daysAgo = parseInt(dateRange);
    const startDate = subDays(new Date(), daysAgo).toISOString();

    const [campaignsRes, eventsRes] = await Promise.all([
      supabase
        .from("newsletter_campaigns")
        .select("id, title, subject, sent_at, recipient_count, opened_count, clicked_count, status")
        .gte("created_at", startDate)
        .order("sent_at", { ascending: false }),
      supabase
        .from("email_events")
        .select("id, event_type, created_at, device_type, clicked_url")
        .gte("created_at", startDate)
        .order("created_at", { ascending: false })
        .limit(1000)
    ]);

    if (campaignsRes.data) setCampaigns(campaignsRes.data);
    if (eventsRes.data) setEvents(eventsRes.data);
    setIsLoading(false);
  };

  // Calculate aggregate metrics
  const metrics = useMemo(() => {
    const totalSent = campaigns.reduce((acc, c) => acc + (c.recipient_count || 0), 0);
    const totalOpened = campaigns.reduce((acc, c) => acc + (c.opened_count || 0), 0);
    const totalClicked = campaigns.reduce((acc, c) => acc + (c.clicked_count || 0), 0);
    
    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0";
    const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : "0";
    const ctr = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : "0";

    return { totalSent, totalOpened, totalClicked, openRate, clickRate, ctr };
  }, [campaigns]);

  // Daily chart data
  const dailyData = useMemo(() => {
    const daysAgo = parseInt(dateRange);
    const interval = eachDayOfInterval({
      start: subDays(new Date(), daysAgo),
      end: new Date()
    });

    return interval.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayEvents = events.filter(e => 
        format(parseISO(e.created_at), "yyyy-MM-dd") === dayStr
      );
      
      return {
        date: format(day, "MMM d"),
        sent: dayEvents.filter(e => e.event_type === "email.sent").length,
        opened: dayEvents.filter(e => e.event_type === "email.opened").length,
        clicked: dayEvents.filter(e => e.event_type === "email.clicked" || e.event_type === "email.link_clicked").length
      };
    });
  }, [events, dateRange]);

  // Device breakdown
  const deviceData = useMemo(() => {
    const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
    
    events.forEach(e => {
      const device = (e.device_type || "unknown").toLowerCase();
      if (device.includes("mobile") || device.includes("phone")) {
        deviceCounts.mobile++;
      } else if (device.includes("tablet") || device.includes("ipad")) {
        deviceCounts.tablet++;
      } else if (device.includes("desktop") || device.includes("windows") || device.includes("mac")) {
        deviceCounts.desktop++;
      } else {
        deviceCounts.unknown++;
      }
    });

    return [
      { name: "Desktop", value: deviceCounts.desktop, icon: Monitor },
      { name: "Mobile", value: deviceCounts.mobile, icon: Smartphone },
      { name: "Tablet", value: deviceCounts.tablet, icon: Tablet }
    ].filter(d => d.value > 0);
  }, [events]);

  // Top clicked links
  const topLinks = useMemo(() => {
    const linkCounts: Record<string, number> = {};
    events
      .filter(e => e.clicked_url)
      .forEach(e => {
        const url = e.clicked_url!;
        linkCounts[url] = (linkCounts[url] || 0) + 1;
      });

    return Object.entries(linkCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([url, count]) => ({ url, count }));
  }, [events]);

  // Top campaigns by performance
  const topCampaigns = useMemo(() => {
    return [...campaigns]
      .filter(c => c.recipient_count > 0)
      .sort((a, b) => {
        const aRate = (a.opened_count || 0) / (a.recipient_count || 1);
        const bRate = (b.opened_count || 0) / (b.recipient_count || 1);
        return bRate - aRate;
      })
      .slice(0, 5);
  }, [campaigns]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Newsletter Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Track opens, clicks, and engagement across your campaigns
            </p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent className="bg-popover border shadow-lg z-50">
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sent</p>
                  <p className="text-3xl font-bold">{metrics.totalSent.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {campaigns.length} campaigns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Rate</p>
                  <p className="text-3xl font-bold">{metrics.openRate}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {parseFloat(metrics.openRate) >= 20 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-orange-500" />
                )}
                <p className="text-xs text-muted-foreground">
                  {metrics.totalOpened.toLocaleString()} opens
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Click Rate</p>
                  <p className="text-3xl font-bold">{metrics.clickRate}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <MousePointerClick className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.totalClicked.toLocaleString()} clicks (of opens)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">CTR</p>
                  <p className="text-3xl font-bold">{metrics.ctr}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click-through rate (of sent)
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Activity Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Email Activity</CardTitle>
                  <CardDescription>Sends, opens, and clicks over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyData}>
                        <defs>
                          <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="openedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="clickedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--popover))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="sent" 
                          stroke="hsl(var(--muted-foreground))" 
                          fill="url(#sentGrad)" 
                          name="Sent"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="opened" 
                          stroke="hsl(142, 76%, 36%)" 
                          fill="url(#openedGrad)" 
                          name="Opened"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="clicked" 
                          stroke="hsl(217, 91%, 60%)" 
                          fill="url(#clickedGrad)" 
                          name="Clicked"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Device Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Device Breakdown</CardTitle>
                  <CardDescription>Where subscribers read your emails</CardDescription>
                </CardHeader>
                <CardContent>
                  {deviceData.length > 0 ? (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={deviceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {deviceData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      No device data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Links */}
            <Card>
              <CardHeader>
                <CardTitle>Top Clicked Links</CardTitle>
                <CardDescription>Most popular links across all campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                {topLinks.length > 0 ? (
                  <div className="space-y-3">
                    {topLinks.map((link, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{link.url}</p>
                        </div>
                        <Badge variant="secondary">{link.count} clicks</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No click data yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>All campaigns sorted by open rate</CardDescription>
              </CardHeader>
              <CardContent>
                {topCampaigns.length > 0 ? (
                  <div className="space-y-4">
                    {topCampaigns.map((campaign) => {
                      const openRate = campaign.recipient_count > 0 
                        ? ((campaign.opened_count || 0) / campaign.recipient_count * 100)
                        : 0;
                      const clickRate = (campaign.opened_count || 0) > 0
                        ? ((campaign.clicked_count || 0) / campaign.opened_count * 100)
                        : 0;

                      return (
                        <div key={campaign.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium truncate">{campaign.title || campaign.subject}</h4>
                              <p className="text-sm text-muted-foreground truncate">{campaign.subject}</p>
                            </div>
                            <Badge variant={campaign.status === "sent" ? "default" : "secondary"}>
                              {campaign.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                            <div>
                              <p className="text-muted-foreground">Sent</p>
                              <p className="font-medium">{campaign.recipient_count?.toLocaleString() || 0}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Opened</p>
                              <p className="font-medium">{campaign.opened_count?.toLocaleString() || 0}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Clicked</p>
                              <p className="font-medium">{campaign.clicked_count?.toLocaleString() || 0}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span>Open Rate</span>
                              <span className="font-medium">{openRate.toFixed(1)}%</span>
                            </div>
                            <Progress value={openRate} className="h-2" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No campaigns sent yet</p>
                    <p className="text-sm">Send your first newsletter to see analytics</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Tips</CardTitle>
                  <CardDescription>Improve your email performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    {parseFloat(metrics.openRate) >= 20 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">Open Rate: {metrics.openRate}%</p>
                      <p className="text-sm text-muted-foreground">
                        {parseFloat(metrics.openRate) >= 20 
                          ? "Great! Your subject lines are working well."
                          : "Try more compelling subject lines and send at optimal times."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    {parseFloat(metrics.clickRate) >= 2.5 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">Click Rate: {metrics.clickRate}%</p>
                      <p className="text-sm text-muted-foreground">
                        {parseFloat(metrics.clickRate) >= 2.5
                          ? "Excellent! Your content is engaging readers."
                          : "Add clearer CTAs and more valuable content."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Best Send Times</p>
                      <p className="text-sm text-muted-foreground">
                        Tuesdays and Thursdays at 10am typically perform best.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscriber Growth</CardTitle>
                  <CardDescription>Track your audience over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Subscriber growth chart coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}