import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart3, Eye, MousePointer, Users, Globe, Smartphone, Monitor, 
  Link2, Send, Clock, Bell, Download, TrendingUp, Mail 
} from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";

interface SignatureAnalyticsProps {
  signatures: any[];
}

interface TrackingEvent {
  id: string;
  signature_id: string;
  event_type: string;
  link_id: string | null;
  target_url: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  email_client: string | null;
  created_at: string;
}

export function SignatureAnalytics({ signatures }: SignatureAnalyticsProps) {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignature, setSelectedSignature] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30d");
  const [activeSubTab, setActiveSubTab] = useState<string>("overview");
  
  // Notification settings state
  const [openNotifications, setOpenNotifications] = useState(true);
  const [clickNotifications, setClickNotifications] = useState(true);
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [digestFrequency, setDigestFrequency] = useState("daily");

  useEffect(() => {
    fetchEvents();
  }, [selectedSignature, dateRange]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      let startDate = new Date();
      if (dateRange === "7d") startDate.setDate(now.getDate() - 7);
      else if (dateRange === "30d") startDate.setDate(now.getDate() - 30);
      else if (dateRange === "90d") startDate.setDate(now.getDate() - 90);

      let query = supabase
        .from("signature_tracking_events")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);

      if (selectedSignature !== "all") {
        query = query.eq("signature_id", selectedSignature);
      }

      const { data } = await query;
      setEvents((data as TrackingEvent[]) || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const opens = events.filter(e => e.event_type === "open");
    const bannerClicks = events.filter(e => e.event_type === "banner_click");
    const socialClicks = events.filter(e => e.event_type === "social_click");
    const linkClicks = events.filter(e => e.event_type === "link_click");
    const allClicks = [...bannerClicks, ...socialClicks, ...linkClicks];
    
    const uniqueOpenIps = new Set(opens.map(e => e.ip_address)).size;
    const uniqueClickIps = new Set(allClicks.map(e => e.ip_address)).size;
    
    const deviceCounts = events.reduce((acc, e) => {
      const device = e.device_type || "unknown";
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const linkCounts = allClicks.reduce((acc, e) => {
      const link = e.link_id || e.target_url || "unknown";
      acc[link] = (acc[link] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topLinks = Object.entries(linkCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    
    return {
      totalOpens: opens.length,
      uniqueOpens: uniqueOpenIps,
      totalClicks: allClicks.length,
      uniqueClicks: uniqueClickIps,
      bannerClicks: bannerClicks.length,
      socialClicks: socialClicks.length,
      linkClicks: linkClicks.length,
      ctr: opens.length > 0 ? ((allClicks.length / opens.length) * 100).toFixed(1) : "0",
      deviceCounts,
      topLinks,
    };
  }, [events]);

  // Chart data - daily activity
  const chartData = useMemo(() => {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const interval = eachDayOfInterval({
      start: subDays(new Date(), days - 1),
      end: new Date(),
    });

    return interval.map(date => {
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayEvents = events.filter(e => {
        const eventDate = new Date(e.created_at);
        return eventDate >= dayStart && eventDate < dayEnd;
      });

      return {
        date: format(date, "MMM d"),
        opens: dayEvents.filter(e => e.event_type === "open").length,
        clicks: dayEvents.filter(e => ["banner_click", "social_click", "link_click"].includes(e.event_type)).length,
      };
    });
  }, [events, dateRange]);

  // Pie chart data for traffic sources
  const trafficData = useMemo(() => {
    const internal = events.filter(e => e.email_client?.includes("internal") || false).length;
    const external = events.length - internal;
    return [
      { name: "External", value: external || 1, color: "hsl(var(--primary))" },
      { name: "Internal", value: internal, color: "hsl(var(--muted))" },
    ];
  }, [events]);

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case "mobile": return <Smartphone className="h-4 w-4" />;
      case "tablet": return <Smartphone className="h-4 w-4" />;
      case "desktop": return <Monitor className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Email Tracking Analytics</h2>
          <p className="text-sm text-muted-foreground">Track opens, clicks, and engagement</p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedSignature} onValueChange={setSelectedSignature}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All signatures" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All signatures</SelectItem>
              {signatures.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Send className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{events.length}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Eye className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{metrics.totalOpens}</p>
                <p className="text-sm text-muted-foreground">Emails Opened</p>
                <p className="text-xs text-muted-foreground">{metrics.uniqueOpens} unique</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <MousePointer className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{metrics.totalClicks}</p>
                <p className="text-sm text-muted-foreground">Links Clicked</p>
                <p className="text-xs text-muted-foreground">{metrics.uniqueClicks} unique</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{metrics.ctr}%</p>
                <p className="text-sm text-muted-foreground">Click Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs for different views */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clicks">Clicks</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="text-center py-8">Loading analytics...</div>
          ) : (
            <>
              {/* Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email Activity</CardTitle>
                  <CardDescription>Opens and clicks over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                        />
                        <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="opens" 
                          stackId="1" 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary))" 
                          fillOpacity={0.3} 
                          name="Opens"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="clicks" 
                          stackId="2" 
                          stroke="hsl(142 76% 36%)" 
                          fill="hsl(142 76% 36%)" 
                          fillOpacity={0.3} 
                          name="Clicks"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">No activity data yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bottom grid - breakdown cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Click Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Click Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Banner Clicks</span>
                      <Badge variant="secondary">{metrics.bannerClicks}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Social Clicks</span>
                      <Badge variant="secondary">{metrics.socialClicks}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Link Clicks</span>
                      <Badge variant="secondary">{metrics.linkClicks}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Traffic Sources */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Email Traffic</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie
                          data={trafficData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={50}
                          dataKey="value"
                        >
                          {trafficData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-2 text-xs">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        External
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted" />
                        Internal
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Device Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Devices</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(metrics.deviceCounts).slice(0, 4).map(([device, count]) => {
                      const percentage = events.length > 0 ? ((count / events.length) * 100).toFixed(0) : 0;
                      return (
                        <div key={device} className="flex items-center gap-2">
                          {getDeviceIcon(device)}
                          <div className="flex-1">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{device}</span>
                              <span className="text-muted-foreground">{percentage}%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                              <div 
                                className="h-full bg-primary rounded-full" 
                                style={{ width: `${percentage}%` }} 
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(metrics.deviceCounts).length === 0 && (
                      <p className="text-sm text-muted-foreground">No device data yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Clicks Tab */}
        <TabsContent value="clicks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Click Activity</CardTitle>
                <CardDescription>Track which links recipients are clicking</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Device</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events
                    .filter(e => ["banner_click", "social_click", "link_click"].includes(e.event_type))
                    .slice(0, 20)
                    .map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="text-sm">
                          {format(new Date(event.created_at), "MMM d @ h:mm a")}
                        </TableCell>
                        <TableCell>
                          <span className="text-primary truncate max-w-xs block">
                            {event.target_url || formatLinkLabel(event.link_id || "—")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatEventType(event.event_type)}</Badge>
                        </TableCell>
                        <TableCell className="flex items-center gap-1.5">
                          {getDeviceIcon(event.device_type || "unknown")}
                          <span className="capitalize text-sm">{event.device_type || "unknown"}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  {events.filter(e => ["banner_click", "social_click", "link_click"].includes(e.event_type)).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No click activity yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">All Activity</CardTitle>
                <CardDescription>Complete activity log of all email events</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Signature</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.slice(0, 30).map((event) => {
                    const sig = signatures.find(s => s.id === event.signature_id);
                    return (
                      <TableRow key={event.id}>
                        <TableCell className="text-sm">
                          {format(new Date(event.created_at), "MMM d @ h:mm a")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={event.event_type === "open" ? "secondary" : "default"}>
                            {formatEventType(event.event_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{sig?.name || "Unknown"}</TableCell>
                        <TableCell className="flex items-center gap-1.5">
                          {getDeviceIcon(event.device_type || "unknown")}
                          <span className="capitalize text-sm">{event.device_type || "unknown"}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {event.target_url || event.email_client || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {events.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No activity yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Email Opens</CardTitle>
                <CardDescription>Track when recipients open your emails</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Signature</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Email Client</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events
                    .filter(e => e.event_type === "open")
                    .slice(0, 20)
                    .map((event) => {
                      const sig = signatures.find(s => s.id === event.signature_id);
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="text-sm">
                            {format(new Date(event.created_at), "MMM d @ h:mm a")}
                          </TableCell>
                          <TableCell>{sig?.name || "Unknown"}</TableCell>
                          <TableCell className="flex items-center gap-1.5">
                            {getDeviceIcon(event.device_type || "unknown")}
                            <span className="capitalize text-sm">{event.device_type || "unknown"}</span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {event.email_client || "Unknown"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {events.filter(e => e.event_type === "open").length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No opens recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Open Notifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Mail className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Open Notifications</CardTitle>
                    <CardDescription>Get notified when someone opens your email</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="open-notif">Enable notifications</Label>
                  <Switch 
                    id="open-notif" 
                    checked={openNotifications} 
                    onCheckedChange={setOpenNotifications} 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Click Notifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <MousePointer className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Click Notifications</CardTitle>
                    <CardDescription>Get notified when links are clicked</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="click-notif">Enable notifications</Label>
                  <Switch 
                    id="click-notif" 
                    checked={clickNotifications} 
                    onCheckedChange={setClickNotifications} 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Digest Settings */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Clock className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Email Digest</CardTitle>
                    <CardDescription>Get a summary of your email activity</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="digest-enabled">Enable digest emails</Label>
                  <Switch 
                    id="digest-enabled" 
                    checked={digestEnabled} 
                    onCheckedChange={setDigestEnabled} 
                  />
                </div>
                {digestEnabled && (
                  <div className="flex items-center gap-4">
                    <Label>Frequency</Label>
                    <div className="flex gap-2">
                      <Button 
                        variant={digestFrequency === "daily" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setDigestFrequency("daily")}
                      >
                        Daily
                      </Button>
                      <Button 
                        variant={digestFrequency === "weekly" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setDigestFrequency("weekly")}
                      >
                        Weekly
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatEventType(type: string): string {
  switch (type) {
    case "open": return "Opened";
    case "banner_click": return "Banner";
    case "social_click": return "Social";
    case "link_click": return "Link";
    default: return type;
  }
}

function formatLinkLabel(link: string): string {
  if (link.startsWith("http")) {
    try {
      const url = new URL(link);
      return url.hostname + url.pathname;
    } catch {
      return link;
    }
  }
  const socialMap: Record<string, string> = {
    facebook: "Facebook",
    twitter: "X (Twitter)",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    youtube: "YouTube",
    tiktok: "TikTok",
    pinterest: "Pinterest",
    banner: "Banner CTA",
    website: "Website",
  };
  return socialMap[link] || link;
}
