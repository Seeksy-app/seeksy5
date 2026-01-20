import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeySuccessMetrics } from "./KeySuccessMetrics";
import { PerformanceInsights } from "./PerformanceInsights";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Target, TrendingUp, Users, DollarSign, MapPin, Calendar } from "lucide-react";

const marketSegments = [
  { name: "Active DOD Civilians", value: 35, color: "#3b82f6" },
  { name: "Military Separating", value: 28, color: "#f97316" },
  { name: "Recent Retirees", value: 20, color: "#22c55e" },
  { name: "FERS Eligible", value: 17, color: "#eab308" },
];

const geographicData = [
  { state: "Virginia (DMV)", value: 156, label: "156K DOD" },
  { state: "California", value: 142, label: "142K DOD" },
  { state: "Maryland", value: 134, label: "134K DOD" },
  { state: "Texas", value: 118, label: "118K DOD" },
  { state: "North Carolina", value: 92, label: "92K DOD" },
];

const monthlyProjection = [
  { month: "Q1", clients: 400, revenue: 800000 },
  { month: "Q2", clients: 850, revenue: 1700000 },
  { month: "Q3", clients: 1500, revenue: 3000000 },
  { month: "Q4", clients: 2500, revenue: 5200000 },
];

const gtmMetrics = [
  { value: "2,500", label: "Year 1 Client Target", color: "text-blue-600" },
  { value: "$5.2M", label: "Year 1 Revenue Goal", color: "text-red-500" },
  { value: "18%", label: "Target Conversion Rate", color: "text-green-600" },
];

export function GTMBoardReport() {
  return (
    <div className="space-y-6">
      {/* Key Success Metrics */}
      <KeySuccessMetrics metrics={gtmMetrics} />

      {/* Market Opportunity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Share by Segment */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-800">
              Market Share Opportunity by Segment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={marketSegments}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={true}
                >
                  {marketSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Geographic Concentration */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <MapPin className="h-5 w-5 text-slate-600" />
              Geographic Concentration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {geographicData.map((region, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700 font-medium">{region.state}</span>
                  <span className="text-slate-600 font-semibold">{region.label}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${(region.value / 160) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <PerformanceInsights />

      {/* Quarterly Projection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Calendar className="h-5 w-5 text-slate-600" />
            Year 1 Quarterly Projection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyProjection}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'clients' ? value.toLocaleString() : `$${(value/1000000).toFixed(2)}M`,
                  name === 'clients' ? 'Clients' : 'Revenue'
                ]}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="clients" stroke="#3b82f6" strokeWidth={2} name="Clients" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Key Insights & Recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <TrendingUp className="h-5 w-5 text-slate-600" />
            Key Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">High-Priority Markets</h4>
              <p className="text-sm text-blue-700">
                Focus on DMV area (VA, MD, DC) with highest DOD concentration. 156K+ potential clients within reach.
              </p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Top Performing Channel</h4>
              <p className="text-sm text-green-700">
                VA Seminars showing 931% ROI with 18.1% conversion. Recommend doubling investment in Q2.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <h4 className="font-semibold text-amber-800 mb-2">Action Required</h4>
              <p className="text-sm text-amber-700">
                Digital marketing at 8% conversion needs nurturing optimization. Consider remarketing campaigns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
