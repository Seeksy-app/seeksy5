import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, BarChart3, GitCompare } from "lucide-react";
import { FinancialData } from "@/hooks/useProFormaData";

interface Props {
  data: FinancialData;
}

const formatValue = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} style={{ color: entry.color }} className="text-sm">
          {entry.name}: {formatValue(entry.value)}
        </p>
      ))}
    </div>
  );
};

const ProFormaCharts = ({ data }: Props) => {
  const chartData = data.years.map((year, idx) => ({
    year,
    revenue: data.revenue[idx],
    expenses: data.expenses[idx],
    ebitda: data.ebitda[idx],
  }));

  return (
    <div className="space-y-6">
      {/* Revenue Growth Line Chart */}
      <Card className="rounded-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-[#053877]">
            <TrendingUp className="h-5 w-5" />
            Revenue Growth Trajectory
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tickFormatter={formatValue}
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Total Revenue"
                  stroke="#053877"
                  strokeWidth={3}
                  dot={{ fill: '#053877', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, fill: '#053877' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* EBITDA Bar Chart */}
      <Card className="rounded-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-emerald-600">
            <BarChart3 className="h-5 w-5" />
            EBITDA Performance by Year
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tickFormatter={formatValue}
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="ebitda"
                  name="EBITDA"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue vs Expenses Comparison */}
      <Card className="rounded-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-[#053877]">
            <GitCompare className="h-5 w-5" />
            Revenue vs. Expenses Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tickFormatter={formatValue}
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#053877"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#f43f5e"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProFormaCharts;
