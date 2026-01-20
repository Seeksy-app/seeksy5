
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { motion } from 'framer-motion';
import {
  Globe,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Bot,
  Shield,
  Zap,
  DollarSign,
  Users,
} from 'lucide-react';

const competitors = [
  {
    name: 'Riverside.fm',
    logo: '🎙️',
    focus: 'Recording & Production',
    position: 'Premium Studio',
    threat: 'medium',
    strengths: ['High-quality recording', 'Professional UI', 'Strong brand'],
    weaknesses: ['No monetization tools', 'Limited CRM', 'Higher pricing'],
    pricing: '$15-$24/mo',
    target: 'Professional podcasters',
  },
  {
    name: 'Restream',
    logo: '📺',
    focus: 'Live Streaming',
    position: 'Multi-platform',
    threat: 'low',
    strengths: ['Multi-platform streaming', 'Good integrations', 'Reliable'],
    weaknesses: ['No podcast hosting', 'No AI features', 'Limited creator tools'],
    pricing: '$16-$41/mo',
    target: 'Live streamers',
  },
  {
    name: 'Buzzsprout',
    logo: '🐝',
    focus: 'Podcast Hosting',
    position: 'SMB Friendly',
    threat: 'medium',
    strengths: ['Easy to use', 'Good analytics', 'Affordable'],
    weaknesses: ['No studio', 'Basic monetization', 'No AI'],
    pricing: '$12-$24/mo',
    target: 'Beginner podcasters',
  },
  {
    name: 'Podbean',
    logo: '🫘',
    focus: 'Hosting + Monetization',
    position: 'All-in-one',
    threat: 'high',
    strengths: ['Built-in monetization', 'Large network', 'Good pricing'],
    weaknesses: ['Dated UI', 'No identity protection', 'Basic AI'],
    pricing: '$9-$99/mo',
    target: 'Monetization-focused creators',
  },
  {
    name: 'Anchor/Spotify',
    logo: '🎧',
    focus: 'Free Hosting',
    position: 'Entry-level',
    threat: 'high',
    strengths: ['Free tier', 'Spotify distribution', 'Large user base'],
    weaknesses: ['Limited features', 'Platform lock-in', 'No premium tools'],
    pricing: 'Free',
    target: 'Hobbyist podcasters',
  },
];

const competitiveAdvantages = [
  {
    area: 'Identity Protection',
    seeksy: true,
    others: false,
    icon: Shield,
    description: 'Blockchain-backed voice/face certification',
  },
  {
    area: 'AI-Native Workflows',
    seeksy: true,
    others: 'partial',
    icon: Zap,
    description: 'AI transcription, clips, editing built-in',
  },
  {
    area: 'Unified Platform',
    seeksy: true,
    others: false,
    icon: Globe,
    description: 'Studio + Hosting + CRM + Events + Monetization',
  },
  {
    area: 'Creator Monetization',
    seeksy: true,
    others: 'partial',
    icon: DollarSign,
    description: 'Ad marketplace, digital products, paid DMs',
  },
  {
    area: 'Multi-Role Support',
    seeksy: true,
    others: false,
    icon: Users,
    description: 'Podcaster, influencer, speaker workflows',
  },
];

export default function BoardCompetitiveLandscape() {
  const { isDemo } = useBoardDataMode();

  const getThreatColor = (threat: string) => {
    if (threat === 'high') return 'destructive';
    if (threat === 'medium') return 'secondary';
    return 'outline';
  };

  const getThreatIcon = (threat: string) => {
    if (threat === 'high') return TrendingUp;
    if (threat === 'medium') return Minus;
    return TrendingDown;
  };

  const handleAskAI = (competitor: string) => {
    const prompt = `Provide a detailed competitive analysis of ${competitor} vs Seeksy. Include:
1. Feature comparison
2. Pricing analysis
3. Market positioning
4. Recommended competitive response strategy`;

    window.open(`/board/ai-analyst?prompt=${encodeURIComponent(prompt)}`, '_blank');
  };

  return (
    <TooltipProvider>
        <div className="w-full space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Competitive Landscape</h1>
              <p className="text-sm text-slate-500 mt-1">
                Analysis of key competitors and Seeksy's positioning
              </p>
            </div>
            {isDemo && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                Demo data
              </Badge>
            )}
          </div>

          {/* Competitive Advantages Grid */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Seeksy's Competitive Advantages
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {competitiveAdvantages.map((advantage, idx) => {
                  const Icon = advantage.icon;
                  return (
                    <motion.div
                      key={advantage.area}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{advantage.area}</p>
                          <p className="text-sm text-slate-500">{advantage.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Seeksy</p>
                          <Badge className="bg-emerald-100 text-emerald-700">✓ Yes</Badge>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Others</p>
                          <Badge variant="secondary">
                            {advantage.others === true ? '✓' : advantage.others === 'partial' ? '~' : '✗'} {String(advantage.others)}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Competitor Cards */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Key Competitors</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {competitors.map((competitor, idx) => {
                const ThreatIcon = getThreatIcon(competitor.threat);
                return (
                  <motion.div
                    key={competitor.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-md transition-shadow border-slate-200">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{competitor.logo}</span>
                            <div>
                              <h3 className="font-semibold text-slate-900">{competitor.name}</h3>
                              <p className="text-xs text-slate-500">{competitor.focus}</p>
                            </div>
                          </div>
                          <Badge variant={getThreatColor(competitor.threat)} className="flex items-center gap-1">
                            <ThreatIcon className="w-3 h-3" />
                            {competitor.threat}
                          </Badge>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">Strengths</p>
                            <div className="flex flex-wrap gap-1">
                              {competitor.strengths.map((s) => (
                                <Badge key={s} variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">Weaknesses</p>
                            <div className="flex flex-wrap gap-1">
                              {competitor.weaknesses.map((w) => (
                                <Badge key={w} variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200">
                                  {w}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <div>
                            <p className="text-xs text-slate-500">Pricing</p>
                            <p className="text-sm font-medium text-slate-900">{competitor.pricing}</p>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1.5 text-blue-600"
                                onClick={() => handleAskAI(competitor.name)}
                              >
                                <Bot className="w-4 h-4" />
                                Analyze
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ask AI for competitive analysis</TooltipContent>
                          </Tooltip>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-slate-500 text-center pt-4">
            Competitive data compiled from public sources and market research · Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
    </TooltipProvider>
  );
}