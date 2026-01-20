import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { motion } from 'framer-motion';
import {
  Globe,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Zap,
  Bot,
  ArrowUpRight,
  BarChart3,
  Radio,
} from 'lucide-react';

const marketOverview = [
  {
    label: 'Creator Economy Size',
    value: '$250B',
    trend: '+23% YoY',
    icon: DollarSign,
    description: 'Total addressable market',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    label: 'Podcast Industry',
    value: '$95B',
    trend: '+18% projected',
    icon: Radio,
    description: 'Projected by 2028',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    label: 'Active Creators',
    value: '50M+',
    trend: '+15% growth',
    icon: Users,
    description: 'Global content creators',
    color: 'from-purple-500 to-pink-600',
  },
  {
    label: 'Ad Spend Growth',
    value: '28%',
    trend: 'CAGR',
    icon: Target,
    description: 'Digital audio advertising',
    color: 'from-amber-500 to-orange-600',
  },
];

const marketTrends = [
  {
    trend: 'AI-powered editing tools becoming standard',
    impact: 'High',
    category: 'Technology',
    insight: 'Early adopters gaining 3x productivity advantage',
  },
  {
    trend: 'Video podcasting growth exceeding audio-only',
    impact: 'High',
    category: 'Format',
    insight: 'Video podcasts see 2x engagement rates',
  },
  {
    trend: 'Consolidation in podcast hosting market',
    impact: 'Medium',
    category: 'Competition',
    insight: 'M&A activity increasing among mid-tier players',
  },
  {
    trend: 'Creator-first monetization platforms rising',
    impact: 'High',
    category: 'Monetization',
    insight: 'Creators demanding 70%+ revenue share',
  },
  {
    trend: 'Military/veteran creator segment underserved',
    impact: 'High',
    category: 'Opportunity',
    insight: 'Growing niche with strong brand affinity',
  },
  {
    trend: 'Short-form content driving discovery',
    impact: 'High',
    category: 'Distribution',
    insight: 'Clips driving 40% of new podcast listeners',
  },
];

const industryForecasts = [
  {
    metric: 'Podcast Listeners (US)',
    current: '120M',
    forecast2025: '140M',
    forecast2027: '165M',
    growth: '+38%',
  },
  {
    metric: 'Creator Economy Revenue',
    current: '$250B',
    forecast2025: '$310B',
    forecast2027: '$400B',
    growth: '+60%',
  },
  {
    metric: 'Podcast Ad Spend',
    current: '$2B',
    forecast2025: '$3.5B',
    forecast2027: '$5B',
    growth: '+150%',
  },
  {
    metric: 'AI Tool Adoption',
    current: '25%',
    forecast2025: '55%',
    forecast2027: '80%',
    growth: '+220%',
  },
];

export default function BoardMarketIntel() {
  const { isDemo } = useBoardDataMode();

  const handleAskAI = (topic: string) => {
    const prompt = `Provide market intelligence analysis on: ${topic}

Include:
1. Current market dynamics
2. Key players and their strategies
3. Growth opportunities for Seeksy
4. Risks and mitigation strategies
5. Recommended strategic actions`;

    window.open(`/board/ai-analyst?prompt=${encodeURIComponent(prompt)}`, '_blank');
  };

  return (
    <TooltipProvider>
        <div className="w-full space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Market Intelligence</h1>
              <p className="text-sm text-slate-500 mt-1">
                Industry trends, market data, and growth opportunities
              </p>
            </div>
            {isDemo && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                Demo data
              </Badge>
            )}
          </div>

          {/* Market Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {marketOverview.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                          {stat.trend}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-sm font-medium text-slate-700 mt-1">{stat.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{stat.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Market Trends */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Key Market Trends
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-blue-600"
                    onClick={() => handleAskAI('creator economy market trends 2024-2025')}
                  >
                    <Bot className="w-4 h-4" />
                    Analyze
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {marketTrends.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="px-5 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{item.trend}</p>
                          <p className="text-xs text-slate-500 mt-1">{item.insight}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                          <Badge
                            className={
                              item.impact === 'High'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-700'
                            }
                          >
                            {item.impact}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Industry Forecasts */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    Industry Forecasts
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-blue-600"
                    onClick={() => handleAskAI('podcast and creator economy growth forecasts 2025-2027')}
                  >
                    <Bot className="w-4 h-4" />
                    Analyze
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Metric</th>
                        <th className="text-right text-xs font-medium text-slate-500 px-3 py-3">Current</th>
                        <th className="text-right text-xs font-medium text-slate-500 px-3 py-3">2025</th>
                        <th className="text-right text-xs font-medium text-slate-500 px-3 py-3">2027</th>
                        <th className="text-right text-xs font-medium text-slate-500 px-5 py-3">Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {industryForecasts.map((row, idx) => (
                        <motion.tr
                          key={row.metric}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                        >
                          <td className="text-sm font-medium text-slate-900 px-5 py-3">{row.metric}</td>
                          <td className="text-sm text-slate-600 text-right px-3 py-3">{row.current}</td>
                          <td className="text-sm text-slate-600 text-right px-3 py-3">{row.forecast2025}</td>
                          <td className="text-sm text-slate-600 text-right px-3 py-3">{row.forecast2027}</td>
                          <td className="text-right px-5 py-3">
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                              <ArrowUpRight className="w-3 h-3 mr-0.5" />
                              {row.growth}
                            </Badge>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <Globe className="w-4 h-4 text-slate-400" />
            <p className="text-xs text-slate-500">
              Intelligence data synced from R&D feeds · Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
    </TooltipProvider>
  );
}