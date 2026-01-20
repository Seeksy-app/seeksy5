import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Radio, Tv, Mail, Monitor, Video, Megaphone } from 'lucide-react';

interface AdChannelData {
  channel: string;
  impressions: number;
  cpm: number;
  fillRate: number;
  grossRevenue: number;
  platformShare: number;
  creatorShare: number;
}

interface AdRevenueBreakdownProps {
  data: AdChannelData[];
  scenario: string;
  year: number;
  isLoading?: boolean;
}

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  'Audio Host-Read': Radio,
  'Audio Programmatic': Radio,
  'Video Pre/Mid-Roll': Video,
  'Newsletter/Email': Mail,
  'Display': Monitor,
  'Livestream/Seeksy TV': Tv,
  'Brand Deals': Megaphone,
};

const CHANNEL_COLORS: Record<string, string> = {
  'Audio Host-Read': '#3b82f6',
  'Audio Programmatic': '#60a5fa',
  'Video Pre/Mid-Roll': '#8b5cf6',
  'Newsletter/Email': '#f59e0b',
  'Display': '#6b7280',
  'Livestream/Seeksy TV': '#10b981',
  'Brand Deals': '#ec4899',
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const formatNumber = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toFixed(0);
};

export function AdRevenueBreakdown({ data, scenario, year, isLoading }: AdRevenueBreakdownProps) {
  const totalGrossRevenue = data.reduce((sum, d) => sum + d.grossRevenue, 0);
  const totalPlatformShare = data.reduce((sum, d) => sum + d.platformShare, 0);
  const totalCreatorShare = data.reduce((sum, d) => sum + d.creatorShare, 0);

  const chartData = data.map(d => ({
    name: d.channel.split(' ')[0],
    revenue: d.platformShare,
    color: CHANNEL_COLORS[d.channel] || '#6b7280',
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Advertising Revenue Breakdown
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{scenario}</Badge>
            <Badge variant="secondary">Year {year}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-xs text-blue-600 font-medium">Gross Ad Revenue</p>
            <p className="text-lg font-bold text-blue-700">{formatCurrency(totalGrossRevenue)}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-center">
            <p className="text-xs text-emerald-600 font-medium">Platform Share</p>
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalPlatformShare)}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-center">
            <p className="text-xs text-purple-600 font-medium">Creator Payouts</p>
            <p className="text-lg font-bold text-purple-700">{formatCurrency(totalCreatorShare)}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }} 
                angle={-45} 
                textAnchor="end"
                height={50}
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                tickFormatter={(v) => formatCurrency(v)}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Platform Revenue']}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Channel</TableHead>
                <TableHead className="text-xs text-right">Impressions</TableHead>
                <TableHead className="text-xs text-right">CPM</TableHead>
                <TableHead className="text-xs text-right">Fill %</TableHead>
                <TableHead className="text-xs text-right">Gross Rev</TableHead>
                <TableHead className="text-xs text-right">Platform</TableHead>
                <TableHead className="text-xs text-right">Creator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => {
                const Icon = CHANNEL_ICONS[row.channel] || Radio;
                return (
                  <TableRow key={idx} className="text-xs">
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3 w-3" style={{ color: CHANNEL_COLORS[row.channel] }} />
                        <span className="font-medium">{row.channel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(row.impressions)}</TableCell>
                    <TableCell className="text-right">${row.cpm.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{(row.fillRate * 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(row.grossRevenue)}</TableCell>
                    <TableCell className="text-right text-emerald-600">{formatCurrency(row.platformShare)}</TableCell>
                    <TableCell className="text-right text-purple-600">{formatCurrency(row.creatorShare)}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell className="py-2">Total</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right">{formatCurrency(totalGrossRevenue)}</TableCell>
                <TableCell className="text-right text-emerald-600">{formatCurrency(totalPlatformShare)}</TableCell>
                <TableCell className="text-right text-purple-600">{formatCurrency(totalCreatorShare)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground italic">
          * All figures are AI-powered projections based on R&D benchmarks, not actual platform data.
        </p>
      </CardContent>
    </Card>
  );
}
