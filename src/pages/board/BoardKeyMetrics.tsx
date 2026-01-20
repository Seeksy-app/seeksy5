import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { DataModeBadge } from '@/components/board/DataModeToggle';
import { useRealPlatformMetrics, formatNumber, formatCurrency } from '@/hooks/useRealPlatformMetrics';
import { motion } from 'framer-motion';
import {
  Users,
  Activity,
  DollarSign,
  Percent,
  TrendingUp,
  CreditCard,
  UserPlus,
  Clock,
  Podcast,
  FileAudio,
  Calendar,
  Megaphone,
} from 'lucide-react';

// Demo metrics - must include all keys from metricConfig
const demoMetrics = {
  creators: { value: '2,450', change: '+12%', label: 'Total Creators' },
  podcasts: { value: '890', change: '+15%', label: 'Total Podcasts' },
  episodes: { value: '4,200', change: '+22%', label: 'Total Episodes' },
  newSignups: { value: '340', change: '+22%', label: 'New Signups (30d)' },
  campaigns: { value: '156', change: '+18%', label: 'Ad Campaigns' },
  events: { value: '42', change: '+8%', label: 'Total Events' },
  revenue: { value: '$45,000', change: '+25%', label: 'Revenue MTD' },
  growth: { value: '18%', change: '+3%', label: 'MoM Growth' },
};

const metricConfig = [
  { key: 'creators', icon: Users, color: 'from-blue-500 to-indigo-600' },
  { key: 'podcasts', icon: Podcast, color: 'from-emerald-500 to-teal-600' },
  { key: 'episodes', icon: FileAudio, color: 'from-amber-500 to-orange-600' },
  { key: 'newSignups', icon: UserPlus, color: 'from-purple-500 to-pink-600' },
  { key: 'campaigns', icon: Megaphone, color: 'from-rose-500 to-red-600' },
  { key: 'events', icon: Calendar, color: 'from-slate-500 to-slate-700' },
  { key: 'revenue', icon: DollarSign, color: 'from-cyan-500 to-blue-600' },
  { key: 'growth', icon: TrendingUp, color: 'from-violet-500 to-purple-600' },
];

export default function BoardKeyMetrics() {
  const { isDemo } = useBoardDataMode();
  const { data: realData, isLoading } = useRealPlatformMetrics();

  // Build metrics based on mode
  const metrics = isDemo ? demoMetrics : {
    creators: { value: realData ? formatNumber(realData.totalCreators) : '—', change: '—', label: 'Total Creators' },
    podcasts: { value: realData ? formatNumber(realData.totalPodcasts) : '—', change: '—', label: 'Total Podcasts' },
    episodes: { value: realData ? formatNumber(realData.totalEpisodes) : '—', change: '—', label: 'Total Episodes' },
    newSignups: { value: realData ? formatNumber(realData.newSignups30d) : '—', change: '—', label: 'New Signups (30d)' },
    campaigns: { value: realData ? formatNumber(realData.totalCampaigns) : '—', change: '—', label: 'Ad Campaigns' },
    events: { value: realData ? formatNumber(realData.totalEvents) : '—', change: '—', label: 'Total Events' },
    revenue: { value: realData ? formatCurrency(realData.revenueData.total) : '—', change: '—', label: 'Revenue MTD' },
    growth: { value: '—', change: '—', label: 'MoM Growth' },
  };

  return (
    <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Key Metrics</h1>
            <p className="text-sm text-slate-500 mt-1">
              Core business performance indicators
            </p>
          </div>
          <DataModeBadge />
        </div>

        {/* Pro Forma Connection Note */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>How these metrics connect to the Pro Forma:</strong> Creators, active campaigns, events, and MRR are the operational drivers 
            that feed into the 3-Year Pro Forma. This page shows the operating KPIs that roll up into our long-term financial forecast.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricConfig.map(({ key, icon: Icon, color }, idx) => {
            const metric = metrics[key as keyof typeof metrics];
            if (!metric) return null;
            const isPositive = metric.change?.startsWith('+') ?? false;
            const isNegative = metric.change?.startsWith('-') ?? false;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      {metric.change !== '—' && (
                        <Badge
                          className={
                            isPositive
                              ? 'bg-emerald-100 text-emerald-700'
                              : isNegative && key !== 'churn'
                              ? 'bg-rose-100 text-rose-700'
                              : key === 'churn' && isNegative
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }
                        >
                          {metric.change}
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                    <p className="text-sm text-slate-500 mt-1">{metric.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Funnel Metrics */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 py-4">
            <CardTitle className="text-lg">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              {[
                { stage: 'Visitors', value: isDemo ? '15,000' : (realData ? formatNumber(realData.totalCreators * 6) : '—'), rate: '100%' },
                { stage: 'Signups', value: isDemo ? '2,450' : (realData ? formatNumber(realData.totalCreators) : '—'), rate: isDemo ? '16.3%' : '—' },
                { stage: 'Active', value: isDemo ? '1,200' : (realData ? formatNumber(realData.monthlyActiveUsers) : '—'), rate: isDemo ? '49%' : '—' },
                { stage: 'Podcasters', value: isDemo ? '380' : (realData ? formatNumber(realData.totalPodcasts) : '—'), rate: isDemo ? '31.7%' : '—' },
              ].map((step, idx, arr) => (
                <div key={step.stage} className="flex-1 text-center relative">
                  <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl p-4 mb-2">
                    <p className="text-2xl font-bold text-slate-900">{step.value}</p>
                    <p className="text-sm text-slate-500">{step.stage}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {step.rate}
                  </Badge>
                  {idx < arr.length - 1 && (
                    <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 text-slate-300">
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-xs text-slate-500 text-center">
          {isDemo
            ? 'Showing demo data for illustration purposes'
            : 'Showing real platform data'}
        </p>
    </div>
  );
}