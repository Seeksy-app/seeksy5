import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MousePointer,
  BarChart3,
  Download,
  RefreshCw,
  Target,
  ExternalLink,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { demoCampaignsV2, demoAnalyticsV2 } from "@/data/advertiserDemoDataV2";

const COLORS = ["#2C6BED", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const AdvertiserReports = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("30d");

  const analytics = demoAnalyticsV2;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Running</Badge>;
      case "paused":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Paused</Badge>;
      case "completed":
        return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Performance & Reports</h1>
            <p className="text-white/70 mt-1">Track campaign performance, impressions, and ROI</p>
          </div>
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px] bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="ytd">Year to date</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="icon" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* KPI Summary Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-5 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Impressions (MTD)</p>
                <p className="text-2xl font-bold text-[#053877] mt-1">
                  {(analytics.summary.impressionsMTD / 1000000).toFixed(2)}M
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {analytics.summary.impressionsTrend > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
              <span className={`text-xs ${analytics.summary.impressionsTrend > 0 ? "text-green-600" : "text-red-600"}`}>
                {analytics.summary.impressionsTrend > 0 ? "+" : ""}{analytics.summary.impressionsTrend}% vs last month
              </span>
            </div>
          </Card>

          <Card className="p-5 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Spend (MTD)</p>
                <p className="text-2xl font-bold text-[#053877] mt-1">
                  ${analytics.summary.spendMTD.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {analytics.summary.spendTrend > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
              <span className={`text-xs ${analytics.summary.spendTrend > 0 ? "text-green-600" : "text-red-600"}`}>
                {analytics.summary.spendTrend > 0 ? "+" : ""}{analytics.summary.spendTrend}% vs last month
              </span>
            </div>
          </Card>

          <Card className="p-5 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Average CPM</p>
                <p className="text-2xl font-bold text-[#053877] mt-1">
                  ${analytics.summary.avgCPM.toFixed(2)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">Industry avg: $18.50</span>
            </div>
          </Card>

          <Card className="p-5 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Clicks</p>
                <p className="text-2xl font-bold text-[#053877] mt-1">
                  {analytics.summary.clicksMTD.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <MousePointer className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">CTR: {analytics.summary.avgCTR}%</span>
            </div>
          </Card>

          <Card className="p-5 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Campaigns</p>
                <p className="text-2xl font-bold text-[#053877] mt-1">
                  {analytics.summary.activeCampaigns}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">
                {analytics.summary.totalCampaigns} total campaigns
              </span>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Impressions Over Time */}
          <Card className="p-6 bg-white/95 backdrop-blur">
            <h3 className="text-lg font-semibold text-[#053877] mb-4">Impressions Over Time</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.impressionsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), "Impressions"]}
                    contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="impressions"
                    stroke="#2C6BED"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Spend vs Budget */}
          <Card className="p-6 bg-white/95 backdrop-blur">
            <h3 className="text-lg font-semibold text-[#053877] mb-4">Spend vs Budget by Campaign</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.spendVsBudget} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                  <YAxis dataKey="campaign" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                    contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Legend />
                  <Bar dataKey="spent" name="Spent" fill="#2C6BED" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="budget" name="Budget" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Second Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Performance by Channel */}
          <Card className="p-6 bg-white/95 backdrop-blur lg:col-span-2">
            <h3 className="text-lg font-semibold text-[#053877] mb-4">Performance by Channel</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.channelPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  <Legend />
                  <Bar dataKey="impressions" name="Impressions (K)" fill="#2C6BED" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ctr" name="CTR (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cpm" name="CPM ($)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Spend Distribution */}
          <Card className="p-6 bg-white/95 backdrop-blur">
            <h3 className="text-lg font-semibold text-[#053877] mb-4">Spend Distribution</h3>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.spendByChannel}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {analytics.spendByChannel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Spend"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Campaign Performance Table */}
        <Card className="p-6 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#053877]">Campaign Performance</h3>
            <Button variant="outline" size="sm" onClick={() => navigate("/advertiser/campaigns")}>
              View All Campaigns
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">CPM</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoCampaignsV2.map((campaign) => (
                <TableRow
                  key={campaign.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/advertiser/campaigns/${campaign.id}`)}
                >
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell className="text-right">{campaign.impressions.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{campaign.clicks.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{campaign.ctr}%</TableCell>
                  <TableCell className="text-right">${campaign.spent.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${campaign.cpm.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </motion.div>
  );
};

export default AdvertiserReports;
