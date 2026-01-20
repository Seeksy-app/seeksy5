import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, BarChart3, GitCompare, DollarSign, Shield } from "lucide-react";

// Static read-only data
const financialData = {
  years: ["2026", "2027", "2028"],
  revenue: [503000, 920000, 1555000],
  expenses: [258800, 399000, 575500],
  ebitda: [244200, 521000, 979500],
};

const assumptions = {
  sponsor_conversion_rate: "85%",
  category_sponsors: "6 → 8 → 12",
  engagement_sponsors: "3 → 4 → 5",
  vertical_expansion: "2 → 4 → 6 verticals",
  livestream_impressions: "4M → 8M → 12M",
  livestream_cpm: "$12.50",
  branded_content_growth: "65%",
  commission_rate: "10%",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatValue = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  return `$${(value / 1000).toFixed(0)}K`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} style={{ color: entry.color }} className="text-sm">
          {entry.name}: {formatValue(entry.value)}
        </p>
      ))}
    </div>
  );
};

const ProFormaSharePage = () => {
  const chartData = financialData.years.map((year, idx) => ({
    year,
    revenue: financialData.revenue[idx],
    expenses: financialData.expenses[idx],
    ebitda: financialData.ebitda[idx],
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#053877] text-white py-8">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[#053877] font-bold text-xl">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Seeksy Events & Awards</h1>
              <p className="text-white/80">3-Year Financial Pro Forma</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <Shield className="h-4 w-4" />
            <span>Confidential - For Authorized Recipients Only</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-[#053877] rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                2028 Projected Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#053877]">$1.56M</p>
              <p className="text-sm text-green-600 mt-1">+209% growth from 2026</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                2028 Projected EBITDA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600">$980K</p>
              <p className="text-sm text-emerald-600 mt-1">63.0% margin</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                3-Year CAGR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">75.8%</p>
              <p className="text-sm text-gray-500 mt-1">Compound Annual Growth Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Tables */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Revenue Table */}
          <Card className="rounded-lg overflow-hidden">
            <CardHeader className="bg-[#053877] text-white py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Revenue Projections
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialData.years.map((year, idx) => (
                    <TableRow key={year}>
                      <TableCell className="font-medium">{year}</TableCell>
                      <TableCell className="text-right font-semibold text-[#053877]">
                        {formatCurrency(financialData.revenue[idx])}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* EBITDA Table */}
          <Card className="rounded-lg overflow-hidden">
            <CardHeader className="bg-emerald-600 text-white py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4" />
                EBITDA Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">EBITDA</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialData.years.map((year, idx) => (
                    <TableRow key={year}>
                      <TableCell className="font-medium">{year}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        {formatCurrency(financialData.ebitda[idx])}
                      </TableCell>
                      <TableCell className="text-right text-gray-500">
                        {((financialData.ebitda[idx] / financialData.revenue[idx]) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Card className="rounded-lg">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="flex items-center gap-2 text-[#053877]">
              <TrendingUp className="h-5 w-5" />
              Revenue Growth Trajectory
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" tick={{ fill: '#6b7280' }} />
                  <YAxis tickFormatter={formatValue} tick={{ fill: '#6b7280' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Total Revenue"
                    stroke="#053877"
                    strokeWidth={3}
                    dot={{ fill: '#053877', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="flex items-center gap-2 text-[#053877]">
              <GitCompare className="h-5 w-5" />
              Revenue vs. Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" tick={{ fill: '#6b7280' }} />
                  <YAxis tickFormatter={formatValue} tick={{ fill: '#6b7280' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#053877" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Key Assumptions */}
        <Card className="rounded-lg">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-[#053877]">Key Assumptions</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(assumptions).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 capitalize">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="font-semibold text-[#053877]">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm pt-8 border-t">
          <p>Generated by Seeksy Financial Platform</p>
          <p className="mt-1">This document is confidential and intended for authorized recipients only.</p>
        </div>
      </div>
    </div>
  );
};

export default ProFormaSharePage;
