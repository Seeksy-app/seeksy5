import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Eye, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";

interface Impression {
  id: string;
  ad_id: string;
  placement_id: string;
  created_at: string;
}

interface Placement {
  id: string;
  ad_id: string;
  cpm: number;
  ad?: { id: string; title: string };
}

interface Ad {
  id: string;
  title: string;
  type: string;
}

interface AdAnalyticsDashboardProps {
  impressions: Impression[];
  placements: Placement[];
  ads: Ad[];
}

export function AdAnalyticsDashboard({ impressions, placements, ads }: AdAnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const filteredImpressions = useMemo(() => {
    if (dateRange === 'all') return impressions;
    
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    return impressions.filter(imp => 
      isWithinInterval(new Date(imp.created_at), { start: startDate, end: endDate })
    );
  }, [impressions, dateRange]);

  // Group impressions by ad
  const impressionsByAd = useMemo(() => {
    const grouped: Record<string, { count: number; spend: number; adTitle: string }> = {};
    
    filteredImpressions.forEach(imp => {
      if (!grouped[imp.ad_id]) {
        const ad = ads.find(a => a.id === imp.ad_id);
        grouped[imp.ad_id] = { count: 0, spend: 0, adTitle: ad?.title || 'Unknown' };
      }
      grouped[imp.ad_id].count++;
      
      // Calculate spend based on placement CPM
      const placement = placements.find(p => p.id === imp.placement_id);
      if (placement) {
        grouped[imp.ad_id].spend += Number(placement.cpm) / 1000;
      }
    });
    
    return Object.entries(grouped).map(([adId, data]) => ({
      adId,
      ...data
    })).sort((a, b) => b.count - a.count);
  }, [filteredImpressions, ads, placements]);

  // Group by date for chart
  const impressionsByDate = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    filteredImpressions.forEach(imp => {
      const date = format(new Date(imp.created_at), 'yyyy-MM-dd');
      grouped[date] = (grouped[date] || 0) + 1;
    });
    
    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredImpressions]);

  const totalSpend = impressionsByAd.reduce((sum, item) => sum + item.spend, 0);

  const exportToCSV = () => {
    const headers = ['Ad', 'Impressions', 'Estimated Spend'];
    const rows = impressionsByAd.map(item => [
      item.adTitle,
      item.count.toString(),
      `$${item.spend.toFixed(2)}`
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seeksy-tv-ad-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Show empty state if no data at all
  if (impressions.length === 0 && placements.length === 0) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Data Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Analytics will appear here once ads start playing on Seeksy TV videos. 
              Create placements to target your ads to channels or specific videos.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Date Range:</span>
          <div className="flex gap-1">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange(range)}
              >
                {range === 'all' ? 'All Time' : range.replace('d', ' Days')}
              </Button>
            ))}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCSV} disabled={impressionsByAd.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Total Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredImpressions.length.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Estimated Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalSpend.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg CPM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${filteredImpressions.length > 0 ? ((totalSpend / filteredImpressions.length) * 1000).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impressions by Date */}
      {impressionsByDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Impressions Over Time</CardTitle>
            <CardDescription>Daily impression counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1">
              {impressionsByDate.slice(-30).map((item, i) => {
                const max = Math.max(...impressionsByDate.map(d => d.count));
                const height = max > 0 ? (item.count / max) * 100 : 0;
                return (
                  <div key={item.date} className="flex-1 flex flex-col items-center group">
                    <div 
                      className="w-full bg-primary/80 hover:bg-primary transition-colors rounded-t"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${format(new Date(item.date), 'MMM d')}: ${item.count} impressions`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{impressionsByDate.length > 0 && format(new Date(impressionsByDate[Math.max(0, impressionsByDate.length - 30)].date), 'MMM d')}</span>
              <span>{impressionsByDate.length > 0 && format(new Date(impressionsByDate[impressionsByDate.length - 1].date), 'MMM d')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breakdown by Ad */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Ad</CardTitle>
          <CardDescription>Impressions and spend breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {impressionsByAd.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No impressions recorded for this period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Est. Spend</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {impressionsByAd.map((item) => (
                  <TableRow key={item.adId}>
                    <TableCell className="font-medium">{item.adTitle}</TableCell>
                    <TableCell className="text-right">{item.count.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${item.spend.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {((item.count / filteredImpressions.length) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
