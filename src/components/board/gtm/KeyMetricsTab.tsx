import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const monthlyGrowth = [
  { month: 'Jan', creators: 1200, revenue: 45000 },
  { month: 'Feb', creators: 1450, revenue: 52000 },
  { month: 'Mar', creators: 1800, revenue: 68000 },
  { month: 'Apr', creators: 2100, revenue: 82000 },
  { month: 'May', creators: 2450, revenue: 95000 },
  { month: 'Jun', creators: 2800, revenue: 112000 },
];

const channelPerformance = [
  { channel: 'AI Studio', leads: 450, conversions: 180 },
  { channel: 'Podcast Migration', leads: 320, conversions: 145 },
  { channel: 'Creator Referrals', leads: 280, conversions: 165 },
  { channel: 'Paid Ads', leads: 520, conversions: 95 },
  { channel: 'Conferences', leads: 180, conversions: 85 },
];

const segmentDistribution = [
  { name: 'Professional Creators', value: 35, color: '#3b82f6' },
  { name: 'Part-Time Creators', value: 40, color: '#8b5cf6' },
  { name: 'Podcasters', value: 15, color: '#f59e0b' },
  { name: 'Speakers', value: 10, color: '#10b981' },
];

const kpis = [
  { label: 'Monthly Active Creators', value: '2,800', change: '+18%', positive: true },
  { label: 'Creator Lifetime Value', value: '$450', change: '+12%', positive: true },
  { label: 'Customer Acquisition Cost', value: '$25', change: '-8%', positive: true },
  { label: 'Monthly Recurring Revenue', value: '$112K', change: '+24%', positive: true },
  { label: 'Churn Rate', value: '3.2%', change: '-0.5%', positive: true },
  { label: 'Net Promoter Score', value: '72', change: '+5', positive: true },
];

export function KeyMetricsTab() {
  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
              <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
              <p className={`text-xs mt-2 font-medium ${kpi.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                {kpi.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Creator Growth */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Creator Growth & Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="creators" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-slate-600">Creators</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-slate-600">Revenue ($)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channel Performance */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Channel Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis dataKey="channel" type="category" tick={{ fill: '#64748b', fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="leads" fill="#94a3b8" name="Leads" />
                  <Bar dataKey="conversions" fill="#3b82f6" name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segment Distribution */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Creator Segment Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-12">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                  >
                    {segmentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {segmentDistribution.map((segment) => (
                <div key={segment.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span className="text-sm text-slate-600">{segment.name}</span>
                  <span className="text-sm font-semibold text-slate-900">{segment.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
