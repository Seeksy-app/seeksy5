import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, BarChart3, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { DataModeLabel, DataModeBadge } from '@/components/board/DataModeToggle';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';

const demoRevenueMetrics = [
  { label: 'Total Revenue (MTD)', value: '$156,420', change: '+12.3%', icon: DollarSign },
  { label: 'Ad Revenue', value: '$89,200', change: '+18.5%', icon: BarChart3 },
  { label: 'Subscription Revenue', value: '$67,220', change: '+8.2%', icon: Users },
  { label: 'Revenue Growth Rate', value: '24.7%', change: '+3.2%', icon: TrendingUp },
];

const demoRevenueByChannel = [
  { channel: 'Podcast Ads', revenue: '$45,200', percentage: 29 },
  { channel: 'Video Pre-roll', revenue: '$32,400', percentage: 21 },
  { channel: 'Sponsorships', revenue: '$28,600', percentage: 18 },
  { channel: 'Pro Subscriptions', revenue: '$25,800', percentage: 17 },
  { channel: 'Creator Tools', revenue: '$14,420', percentage: 9 },
  { channel: 'Events & Ticketing', revenue: '$10,000', percentage: 6 },
];

export default function BoardRevenueInsights() {
  const navigate = useNavigate();
  const { isDemo } = useBoardDataMode();
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const revenueMetrics = isDemo ? demoRevenueMetrics : demoRevenueMetrics.map(m => ({ ...m, value: null, change: null }));
  const revenueByChannel = isDemo ? demoRevenueByChannel : [];

  return (
    <div className="space-y-8 w-full">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
            <DollarSign className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Revenue Insights</h1>
            <p className="text-slate-500">Financial performance metrics</p>
          </div>
        </div>

      <DataModeLabel />

      {/* KPI Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 justify-start">
        {revenueMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="bg-white border-slate-200 shadow-sm relative">
              <DataModeBadge className="absolute top-2 right-2" />
              <CardContent className="p-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">{metric.label}</p>
                      {metric.value ? (
                        <>
                          <p className="text-2xl font-bold text-slate-900 mt-1">{metric.value}</p>
                          <p className="text-xs text-emerald-600 mt-1">{metric.change} vs last month</p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-400 mt-2 italic">No real data connected</p>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue by Channel */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">Revenue by Channel</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          ) : revenueByChannel.length > 0 ? (
            <div className="space-y-4">
              {revenueByChannel.map((item) => (
                <div key={item.channel} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900">{item.channel}</span>
                      <span className="text-sm text-slate-500">{item.revenue}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="ml-4 text-sm font-medium text-slate-500 w-12 text-right">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">No real data connected</p>
                <p className="text-xs text-amber-600">Switch to Demo mode to view sample data</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400 text-center">
        {isDemo ? 'Viewing demo data' : 'Real data mode'} • Last updated: {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
