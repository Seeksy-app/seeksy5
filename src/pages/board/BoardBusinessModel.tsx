import { useState } from 'react';
import { MarkdownRenderer } from '@/components/board/MarkdownRenderer';
import { useBoardContent } from '@/hooks/useBoardContent';
import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { DataModeLabel, DataModeBadge } from '@/components/board/DataModeToggle';
import { BoardFloatingAIButton } from '@/components/board/BoardFloatingAIButton';
import { BoardAISlidePanel } from '@/components/board/BoardAISlidePanel';
import { BoardPageHeader } from '@/components/board/BoardPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, DollarSign, TrendingUp, Layers, Podcast, Sparkles, Building, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const revenueStreams = [
  {
    title: 'Creator Subscriptions',
    icon: Users,
    description: 'Monthly and annual subscription tiers for creators',
    demoRevenue: '$18,500/mo',
    realRevenue: '—',
    details: [
      'Free tier with basic features',
      'Pro tier at $19/mo - AI clips, advanced analytics',
      'Business tier at $49/mo - team features, white-label',
      'Enterprise custom pricing'
    ]
  },
  {
    title: 'Podcast Hosting',
    icon: Podcast,
    description: 'RSS hosting with unlimited episodes and bandwidth',
    demoRevenue: '$8,200/mo',
    realRevenue: '—',
    details: [
      'Included in Pro and Business tiers',
      'Migration tools from Buzzsprout, Anchor, Libsyn',
      'Advanced analytics and distribution',
      'Dynamic ad insertion capability'
    ]
  },
  {
    title: 'Dynamic Ad Monetization',
    icon: DollarSign,
    description: 'Programmatic and direct-sold advertising revenue',
    demoRevenue: '$12,400/mo',
    realRevenue: '—',
    details: [
      'CPM-based audio ad placements ($15-$50 CPM)',
      'Video pre-roll and mid-roll ads',
      'Direct sponsor marketplace',
      '70/30 creator/platform revenue split'
    ]
  },
  {
    title: 'AI Tools Upsell',
    icon: Sparkles,
    description: 'Premium AI features and compute credits',
    demoRevenue: '$5,800/mo',
    realRevenue: '—',
    details: [
      'AI clip generation credits',
      'Voice certification and cloning',
      'Auto-transcription and show notes',
      'Content optimization tools'
    ]
  },
  {
    title: 'Enterprise Licensing',
    icon: Building,
    description: 'White-label and API licensing for agencies',
    demoRevenue: '$22,000/mo',
    realRevenue: '—',
    details: [
      'White-label studio solutions',
      'API access for integrations',
      'Custom branding and domains',
      'Dedicated support and SLA'
    ]
  },
];

const subscriptionTiers = [
  { 
    name: 'Free', 
    price: '50 credits', 
    priceSubtext: 'one-time',
    highlight: false,
    features: ['Basic studio access', 'Up to 3 episodes', '1 podcast show', 'Community support', 'Basic analytics'] 
  },
  { 
    name: 'Pro', 
    price: '500 credits/mo', 
    priceSubtext: '$19/month',
    highlight: true,
    features: ['Unlimited episodes', 'AI clips (50/mo)', 'Advanced analytics', 'RSS hosting included', 'Priority email support', 'Custom branding'] 
  },
  { 
    name: 'Business', 
    price: '1,500 credits/mo', 
    priceSubtext: '$49/month',
    highlight: false,
    features: ['Everything in Pro', 'Team members (up to 5)', 'White-label options', 'API access', 'Dedicated support', 'Custom integrations'] 
  },
  { 
    name: 'Enterprise', 
    price: 'Custom', 
    priceSubtext: 'Contact sales',
    highlight: false,
    features: ['Unlimited everything', 'Unlimited team members', 'Dedicated account manager', 'SLA guarantee', 'Custom contracts', 'On-premise options'] 
  },
];

export default function BoardBusinessModel() {
  const navigate = useNavigate();
  const { content, isLoading } = useBoardContent('business-model');
  const { isDemo } = useBoardDataMode();
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);

  return (
    <div className="w-full space-y-6">
        {/* Sticky Header */}
        <BoardPageHeader
          icon={<Building2 className="w-5 h-5 text-white" />}
          title="Business Model"
          subtitle="Revenue streams & monetization strategy"
        />

        <DataModeLabel />

        <div className="space-y-8 mt-6">
          {/* Revenue Streams */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              Platform Revenue Streams
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {revenueStreams.map((stream) => {
                const Icon = stream.icon;
                return (
                  <Card key={stream.title} className="bg-white border-slate-200 shadow-sm relative">
                    <DataModeBadge className="absolute top-3 right-3" />
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{stream.title}</CardTitle>
                          {isDemo ? (
                            <p className="text-lg font-bold text-emerald-600">{stream.demoRevenue}</p>
                          ) : (
                            <p className="text-sm text-slate-400 italic">No real data</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-3">{stream.description}</p>
                      <ul className="text-xs text-slate-500 space-y-1">
                        {stream.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Subscription Tiers */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-500" />
              Subscription Tiers & Pricing
            </h2>
            <div className="grid md:grid-cols-4 gap-4">
              {subscriptionTiers.map((tier) => (
                <Card 
                  key={tier.name} 
                  className={`bg-white shadow-sm relative ${
                    tier.highlight 
                      ? 'border-2 border-blue-500 ring-2 ring-blue-100' 
                      : 'border-slate-200'
                  }`}
                >
                  {tier.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardContent className="p-5 pt-6">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{tier.name}</h3>
                    <p className="text-2xl font-bold text-blue-600">{tier.price}</p>
                    <p className="text-xs text-slate-500 mb-4">{tier.priceSubtext}</p>
                    <ul className="text-sm text-slate-600 space-y-2.5">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5 font-bold">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Financial Outlook */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              3-Year Financial Outlook
            </h2>
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl relative">
                    <DataModeBadge className="absolute top-2 right-2" />
                    <p className="text-sm text-slate-500 mb-1">Year 1 Revenue</p>
                    {isDemo ? (
                      <>
                        <p className="text-3xl font-bold text-slate-900">$535K</p>
                        <p className="text-sm text-emerald-600 font-medium">+420% YoY</p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400 italic mt-2">No real data connected</p>
                    )}
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl relative">
                    <DataModeBadge className="absolute top-2 right-2" />
                    <p className="text-sm text-slate-500 mb-1">Year 2 Revenue</p>
                    {isDemo ? (
                      <>
                        <p className="text-3xl font-bold text-slate-900">$3.1M</p>
                        <p className="text-sm text-emerald-600 font-medium">+480% YoY</p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400 italic mt-2">No real data connected</p>
                    )}
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl relative">
                    <DataModeBadge className="absolute top-2 right-2" />
                    <p className="text-sm text-slate-500 mb-1">Year 3 Revenue</p>
                    {isDemo ? (
                      <>
                        <p className="text-3xl font-bold text-slate-900">$9.9M</p>
                        <p className="text-sm text-emerald-600 font-medium">+219% YoY</p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400 italic mt-2">No real data connected</p>
                    )}
                  </div>
                </div>
                <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-2">Key Assumptions</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li><b>Creator Growth:</b> 15% month-over-month creator acquisition</li>
                    <li><b>Conversion Rate:</b> 8% free-to-paid conversion</li>
                    <li><b>Ad Fill Rate:</b> 60% increasing to 85% by Year 3</li>
                    <li><b>ARPU:</b> $35/mo average revenue per paying user</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Competitive Moat */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Competitive Moat</h2>
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Technology Advantages</h4>
                    <ul className="text-sm text-slate-600 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span><b>Blockchain Identity:</b> Voice and face verification on Polygon mainnet</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span><b>AI-Native:</b> Built-in clip generation, transcription, and optimization</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span><b>Unified Platform:</b> Studio, hosting, CRM, and monetization in one place</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Market Position</h4>
                    <ul className="text-sm text-slate-600 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span><b>Migration Tools:</b> Easy switch from competitors with RSS import</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span><b>Creator-First:</b> 70% revenue share, higher than industry standard</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span><b>Multi-Role:</b> Support for creators, podcasters, speakers, and agencies</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {content?.updated_at && (
          <p className="text-sm text-slate-400 mt-8 text-right">
            Last updated: {new Date(content.updated_at).toLocaleDateString()}
          </p>
        )}

        <BoardFloatingAIButton onClick={() => setIsAIPanelOpen(true)} />
        <BoardAISlidePanel isOpen={isAIPanelOpen} onClose={() => setIsAIPanelOpen(false)} />
    </div>
  );
}
