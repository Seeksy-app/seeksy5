import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeySuccessMetrics } from "./KeySuccessMetrics";
import { PerformanceInsights } from "./PerformanceInsights";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, Users, TrendingUp, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";

const channelROIData = [
  { channel: "VA Seminars", roi: 931, budget: 75000 },
  { channel: "Base Events", roi: 693, budget: 120000 },
  { channel: "Digital", roi: 476, budget: 180000 },
  { channel: "Podcasts", roi: 385, budget: 95000 },
  { channel: "Influencer", roi: 245, budget: 65000 },
];

const revenueBreakdown = [
  { name: "Subscriptions", value: 2100000, color: "#0088FE" },
  { name: "Ad Revenue", value: 1800000, color: "#00C49F" },
  { name: "Awards Programs", value: 750000, color: "#FFBB28" },
  { name: "Sponsorships", value: 550000, color: "#FF8042" },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function CFOBoardSummary() {
  const totalRevenue = revenueBreakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Users</p>
                <p className="text-2xl font-bold text-slate-800">12,847</p>
                <div className="flex items-center text-green-600 text-xs mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+18.3% MoM</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">MRR</p>
                <p className="text-2xl font-bold text-slate-800">$175K</p>
                <div className="flex items-center text-green-600 text-xs mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+12.5% MoM</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Creators</p>
                <p className="text-2xl font-bold text-slate-800">3,421</p>
                <div className="flex items-center text-green-600 text-xs mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+24.1% MoM</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Gross Margin</p>
                <p className="text-2xl font-bold text-slate-800">72.4%</p>
                <div className="flex items-center text-green-600 text-xs mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+2.1pp</span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Success Metrics */}
      <KeySuccessMetrics />

      {/* Performance Insights */}
      <PerformanceInsights />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROI by Channel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-800">
              ROI Comparison by Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={channelROIData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="channel" width={100} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'ROI']}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="roi" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-800">
              Revenue Breakdown (Year 1 Target: $5.2M)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {revenueBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, 'Revenue']}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Budget Allocation Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-slate-800">
            Channel Budget Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Channel</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Budget</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-700">ROI</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Est. Revenue</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {channelROIData.map((channel, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 font-medium text-slate-800">{channel.channel}</td>
                    <td className="text-right py-2 px-3 text-slate-600">${(channel.budget / 1000).toFixed(0)}K</td>
                    <td className="text-right py-2 px-3">
                      <span className={`font-semibold ${channel.roi > 400 ? 'text-green-600' : channel.roi > 300 ? 'text-blue-600' : 'text-amber-600'}`}>
                        {channel.roi}%
                      </span>
                    </td>
                    <td className="text-right py-2 px-3 text-slate-600">
                      ${((channel.budget * channel.roi / 100) / 1000).toFixed(0)}K
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-xs">
                      {channel.roi > 500 ? 'Increase budget' : channel.roi > 300 ? 'Maintain spend' : 'Optimize or reduce'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
