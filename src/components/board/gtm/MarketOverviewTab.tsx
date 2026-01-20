import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Mic, Video, DollarSign } from 'lucide-react';

const topStats = [
  { label: 'Creator Economy Market Size', value: '$250B', icon: TrendingUp, color: 'text-emerald-600' },
  { label: 'Independent Creators (US)', value: '4.2M', icon: Users, color: 'text-blue-600' },
  { label: 'Podcasters', value: '1.3M', icon: Mic, color: 'text-purple-600' },
  { label: 'Monthly Social Video Views', value: '3.5B', icon: Video, color: 'text-orange-600' },
  { label: 'Creator Ad Rates (Avg CPM)', value: '$30–$60', icon: DollarSign, color: 'text-green-600' },
];

const marketSegments = [
  {
    title: 'Professional Creators (Full-Time)',
    marketSize: '450,000',
    avgSpend: '$3,000',
    potential: 'Very High',
    potentialColor: 'bg-emerald-100 text-emerald-800',
  },
  {
    title: 'Ambitious Part-Time Creators',
    marketSize: '3.5M',
    avgSpend: '$900',
    potential: 'High',
    potentialColor: 'bg-blue-100 text-blue-800',
  },
  {
    title: 'Podcasters',
    marketSize: '1.3M',
    avgSpend: '$500–$2,500',
    potential: 'Medium',
    potentialColor: 'bg-amber-100 text-amber-800',
  },
  {
    title: 'Industry Creators & Speakers',
    marketSize: '250,000',
    avgSpend: '$1,200',
    potential: 'High',
    potentialColor: 'bg-blue-100 text-blue-800',
  },
];

export function MarketOverviewTab() {
  return (
    <div className="space-y-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {topStats.map((stat) => (
          <Card key={stat.label} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                </div>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Target Market Segments */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Target Market Segments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {marketSegments.map((segment) => (
            <Card key={segment.title} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-slate-900">{segment.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Market Size</span>
                  <span className="font-semibold text-slate-900">{segment.marketSize}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Avg Annual Spend</span>
                  <span className="font-semibold text-slate-900">{segment.avgSpend}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Potential</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${segment.potentialColor}`}>
                    {segment.potential}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
