import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Users,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MonthlyData {
  month: string;
  spend: number;
  impressions: number;
  cpm: number;
}

interface AdvertiserData {
  name: string;
  spend: number;
  color: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export default function AdminAdAnalytics() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("90d");
  const [advertiserFilter, setAdvertiserFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");

  // KPI Stats
  const [totalAdSpend, setTotalAdSpend] = useState(0);
  const [avgCPM, setAvgCPM] = useState(0);
  const [totalImpressions, setTotalImpressions] = useState(0);
  const [creatorPayouts, setCreatorPayouts] = useState(0);

  // Chart Data
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [topAdvertisers, setTopAdvertisers] = useState<AdvertiserData[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, advertiserFilter, campaignFilter]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const daysMap: Record<string, number> = {
        "30d": 30,
        "90d": 90,
        "180d": 180,
        "365d": 365,
      };
      const days = daysMap[dateRange] || 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch campaigns with spend data
      let campaignsQuery = supabase
        .from("ad_campaigns")
        .select("*")
        .gte("created_at", startDate.toISOString());

      if (advertiserFilter !== "all") {
        campaignsQuery = campaignsQuery.eq("advertiser_id", advertiserFilter);
      }

      if (campaignFilter !== "all") {
        campaignsQuery = campaignsQuery.eq("id", campaignFilter);
      }

      const { data: campaigns, error: campaignsError } = await campaignsQuery;
      if (campaignsError) throw campaignsError;

      // Calculate KPIs
      const spend = campaigns?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0;
      const impressions = campaigns?.reduce((sum, c) => sum + (c.total_impressions || 0), 0) || 0;
      const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;

      setTotalAdSpend(spend);
      setTotalImpressions(impressions);
      setAvgCPM(cpm);
      setCreatorPayouts(spend * 0.7); // 70% to creators

      // Generate monthly data (mock for now - would need real aggregation)
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      const mockMonthlyData: MonthlyData[] = months.map((month, idx) => ({
        month,
        spend: Math.floor(spend / 6) * (0.8 + Math.random() * 0.4),
        impressions: Math.floor(impressions / 6) * (0.8 + Math.random() * 0.4),
        cpm: 20 + Math.random() * 15,
      }));
      setMonthlyData(mockMonthlyData);

      // Get top advertisers
      const advertiserSpendMap = new Map<string, number>();
      
      for (const campaign of campaigns || []) {
        if (!campaign.advertiser_id) continue;
        
        const currentSpend = advertiserSpendMap.get(campaign.advertiser_id) || 0;
        advertiserSpendMap.set(campaign.advertiser_id, currentSpend + (campaign.total_spent || 0));
      }

      // Fetch advertiser names
      const topAdvertisersData: AdvertiserData[] = [];
      let colorIdx = 0;
      
      for (const [advertiserId, spend] of advertiserSpendMap.entries()) {
        const { data: advertiser } = await supabase
          .from("advertisers")
          .select("company_name")
          .eq("id", advertiserId)
          .single();

        if (advertiser) {
          topAdvertisersData.push({
            name: advertiser.company_name,
            spend: spend,
            color: COLORS[colorIdx % COLORS.length],
          });
          colorIdx++;
        }
      }

      // Sort by spend and take top 5
      topAdvertisersData.sort((a, b) => b.spend - a.spend);
      setTopAdvertisers(topAdvertisersData.slice(0, 5));

    } catch (error) {
      console.error("Failed to load analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advertising Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Performance metrics and insights for advertising campaigns
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="w-[180px]">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                    <SelectItem value="180d">Last 6 Months</SelectItem>
                    <SelectItem value="365d">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[200px]">
                <Select value={advertiserFilter} onValueChange={setAdvertiserFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Advertisers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Advertisers</SelectItem>
                    <SelectItem value="nike">Nike</SelectItem>
                    <SelectItem value="ford">Ford</SelectItem>
                    <SelectItem value="starbucks">Starbucks</SelectItem>
                    <SelectItem value="verizon">Verizon</SelectItem>
                    <SelectItem value="acme">Acme Corp</SelectItem>
                    <SelectItem value="techstart">TechStart Inc</SelectItem>
                    <SelectItem value="global">Global Solutions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[200px]">
                <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Campaigns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Campaigns</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ad Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalAdSpend)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Gross advertising revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg CPM</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(avgCPM)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Cost per thousand impressions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(totalImpressions)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ad impressions delivered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Creator Payouts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(creatorPayouts)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                70% revenue share to creators
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Monthly Spend Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Ad Spend Trend</CardTitle>
              <CardDescription>Advertising spend over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="spend" fill="#8884d8" name="Spend" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Impressions Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Impressions Trend</CardTitle>
              <CardDescription>Ad impressions delivered over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="impressions" stroke="#82ca9d" name="Impressions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* CPM Trend */}
          <Card>
            <CardHeader>
              <CardTitle>CPM Trend</CardTitle>
              <CardDescription>Average CPM over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="cpm" stroke="#ff7300" name="CPM" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Advertisers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Advertisers by Spend</CardTitle>
              <CardDescription>Largest advertisers in selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {topAdvertisers.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No advertiser data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topAdvertisers}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="spend"
                    >
                      {topAdvertisers.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
