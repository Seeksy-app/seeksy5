import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Users, TrendingUp, Building2, Handshake, Calendar, Gift, Scissors, Globe, FileText, Sparkles, MapPin } from 'lucide-react';

const phases = [
  {
    title: 'Phase 1: Creator Acquisition & Awareness',
    timeline: 'Months 1–6',
    color: 'from-blue-500 to-blue-600',
    strategies: [
      {
        icon: Handshake,
        title: 'Creator Tooling Partnerships',
        description: 'Partner with microphones, interfaces, editing apps to reach creators at point of need.',
      },
      {
        icon: Rocket,
        title: 'Podcast Migration Program',
        description: '"Move your show to Seeksy" with auto-migration from Anchor, Buzzsprout, Libsyn.',
      },
      {
        icon: Calendar,
        title: 'Influencer Workshops',
        description: 'Weekly virtual sessions on content growth & monetization strategies.',
      },
      {
        icon: Sparkles,
        title: 'AI Demo Tours',
        description: 'Demo the AI editor + Studio to creator communities and podcaster networks.',
      },
    ],
  },
  {
    title: 'Phase 2: Influencer & Podcaster Expansion',
    timeline: 'Months 7–12',
    color: 'from-purple-500 to-purple-600',
    strategies: [
      {
        icon: Building2,
        title: 'Brand Collab Marketplace',
        description: 'Connect creators with sponsors through our built-in marketplace.',
      },
      {
        icon: Globe,
        title: 'Conference Activations',
        description: 'Podcast Movement, VidCon, NAB — hands-on demos and creator meetups.',
      },
      {
        icon: Gift,
        title: 'Creator Referral Engine',
        description: 'Incentivize creators to bring creators with revenue share and perks.',
      },
      {
        icon: Scissors,
        title: 'Studio + AI Clips Growth Funnel',
        description: 'Convert creators using the AI clipper into full subscribers.',
      },
    ],
  },
  {
    title: 'Phase 3: Scale & Optimize',
    timeline: 'Months 13–24',
    color: 'from-emerald-500 to-emerald-600',
    strategies: [
      {
        icon: Building2,
        title: 'Enterprise Partnerships',
        description: 'Talent agencies, studios, speaker bureaus — white-label and B2B deals.',
      },
      {
        icon: FileText,
        title: 'Content Licensing Engine',
        description: 'Build licensing opportunities for creators to monetize their archives.',
      },
      {
        icon: TrendingUp,
        title: 'Sponsored AI Tools',
        description: 'Brands underwrite creator tools in exchange for placement and data.',
      },
      {
        icon: MapPin,
        title: 'Regional Content Labs',
        description: 'High-density creator hubs in NY, LA, ATL, MIA with local partnerships.',
      },
    ],
  },
];

export function GTMStrategyTab() {
  return (
    <div className="space-y-8">
      {phases.map((phase) => (
        <div key={phase.title} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-12 rounded-full bg-gradient-to-b ${phase.color}`} />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{phase.title}</h2>
              <p className="text-sm text-slate-500">{phase.timeline}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4">
            {phase.strategies.map((strategy) => (
              <Card key={strategy.title} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${phase.color} bg-opacity-10`}>
                      <strategy.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{strategy.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{strategy.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
