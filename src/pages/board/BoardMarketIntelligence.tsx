import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, TrendingUp, Users, DollarSign, Target, Zap } from 'lucide-react';
import { MarketIntelligenceWidget } from '@/components/market-intelligence/MarketIntelligenceWidget';

const marketOverview = [
  { 
    label: 'Creator Economy Size', 
    value: '$250B', 
    trend: '+23% YoY',
    icon: DollarSign,
    description: 'Total addressable market'
  },
  { 
    label: 'Podcast Industry', 
    value: '$95B', 
    trend: '+18% projected',
    icon: TrendingUp,
    description: 'Projected by 2028'
  },
  { 
    label: 'Active Creators', 
    value: '50M+', 
    trend: '+15% growth',
    icon: Users,
    description: 'Global content creators'
  },
  { 
    label: 'Ad Spend Growth', 
    value: '28%', 
    trend: 'CAGR',
    icon: Target,
    description: 'Digital audio advertising'
  },
];

const competitors = [
  { 
    name: 'Riverside.fm', 
    focus: 'Recording & Production',
    position: 'Premium Studio',
    threat: 'medium'
  },
  { 
    name: 'Restream', 
    focus: 'Live Streaming',
    position: 'Multi-platform',
    threat: 'low'
  },
  { 
    name: 'Buzzsprout', 
    focus: 'Podcast Hosting',
    position: 'SMB Friendly',
    threat: 'medium'
  },
  { 
    name: 'Podbean', 
    focus: 'Hosting + Monetization',
    position: 'All-in-one',
    threat: 'high'
  },
];

const marketTrends = [
  { trend: 'AI-powered editing tools becoming standard', impact: 'High' },
  { trend: 'Video podcasting growth exceeding audio-only', impact: 'High' },
  { trend: 'Consolidation in podcast hosting market', impact: 'Medium' },
  { trend: 'Creator-first monetization platforms rising', impact: 'High' },
  { trend: 'Military/veteran creator segment underserved', impact: 'High' },
];

export default function BoardMarketIntelligence() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Market Intelligence</h1>
        <p className="text-muted-foreground mt-1">
          Industry trends, competitive landscape, and market opportunities
        </p>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {marketOverview.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
                    <p className="text-xs text-emerald-600 mt-1">{item.trend}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competitive Landscape */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Competitive Landscape
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {competitors.map((competitor) => (
                <div 
                  key={competitor.name}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">{competitor.name}</p>
                    <p className="text-sm text-muted-foreground">{competitor.focus}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{competitor.position}</p>
                    <Badge 
                      variant={competitor.threat === 'high' ? 'destructive' : competitor.threat === 'medium' ? 'secondary' : 'outline'}
                      className="mt-1"
                    >
                      {competitor.threat} threat
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Key Market Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketTrends.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <p className="text-sm text-foreground flex-1 pr-4">{item.trend}</p>
                  <Badge 
                    variant={item.impact === 'High' ? 'default' : 'secondary'}
                    className="shrink-0"
                  >
                    {item.impact} Impact
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Market Intelligence from Web Sources */}
      <MarketIntelligenceWidget 
        audience="board"
        title="Live Market Intelligence"
        limit={10}
        showRefresh={true}
      />

      <p className="text-xs text-muted-foreground text-center">
        Intelligence data synced from R&D feeds • Last updated: {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
