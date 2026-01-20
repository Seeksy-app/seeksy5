import { Card } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";

interface PerformanceChartsProps {
  impressionsData: Array<{ date: string; impressions: number }>;
  spendData: Array<{ name: string; spent: number; budget: number }>;
}

export function PerformanceCharts({ impressionsData, spendData }: PerformanceChartsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Impressions Over Time */}
      <Card className="p-6 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#053877]">Impressions Over Time</h3>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </div>
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>+12%</span>
          </div>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={impressionsData}>
              <defs>
                <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2C6BED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2C6BED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [value.toLocaleString(), "Impressions"]}
              />
              <Area
                type="monotone"
                dataKey="impressions"
                stroke="#2C6BED"
                strokeWidth={2}
                fill="url(#impressionsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Spend vs Budget */}
      <Card className="p-6 bg-white/95 backdrop-blur">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[#053877]">Spend vs Budget</h3>
          <p className="text-xs text-muted-foreground">By campaign</p>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spendData} layout="vertical" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickFormatter={(value) => `$${value}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name === "spent" ? "Spent" : "Budget"]}
              />
              <Bar dataKey="budget" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
              <Bar dataKey="spent" fill="#2C6BED" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#2C6BED]" />
            <span className="text-muted-foreground">Spent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-200" />
            <span className="text-muted-foreground">Budget</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
