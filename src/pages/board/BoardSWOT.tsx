import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Grid3X3,
  List,
  PieChart,
  LayoutGrid,
  Info,
  Copy,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';

type ViewMode = 'quadrant' | 'stack' | 'radial' | 'tabs';
type SwotCategory = 'strength' | 'weakness' | 'opportunity' | 'threat';

interface SwotItem {
  id: string;
  title: string;
  category: SwotCategory;
  description: string;
  whyItMatters: string[];
  boardConsiderations: string[];
}

// Complete SWOT data - same as GTM SWOTAnalysisTab
const SWOT_DATA: SwotItem[] = [
  // STRENGTHS
  {
    id: "strength-unified-os",
    category: "strength",
    title: "Unified creator OS (studio, hosting, CRM, events, AI)",
    description: "Seeksy is the only platform that combines podcast hosting, video studio, CRM, event management, and AI-powered editing into a single unified system. This eliminates the need for creators to juggle multiple subscriptions and reduces friction while increasing retention and lifetime value.",
    whyItMatters: [
      "Directly impacts revenue through higher ARPU as creators consolidate tools into one subscription",
      "Reduces customer acquisition cost by eliminating comparison shopping with point solutions",
      "Creates strong competitive moat through data network effects across integrated features"
    ],
    boardConsiderations: [
      "Monitor feature parity with best-of-breed competitors in each category",
      "Track cross-feature adoption rates as leading indicator of retention"
    ]
  },
  {
    id: "strength-identity-rights",
    category: "strength",
    title: "Identity + rights protection",
    description: "Our blockchain-backed voice and face certification system provides creators with verifiable identity credentials. This protects against deepfakes, enables licensing opportunities, and builds trust with brands seeking authentic creator partnerships.",
    whyItMatters: [
      "Opens new revenue stream through identity licensing marketplace for brand partnerships",
      "Positions Seeksy as trust infrastructure for creator economy as AI deepfakes proliferate",
      "Creates switching cost moat—creators cannot easily migrate certified identity to competitors"
    ],
    boardConsiderations: [
      "Track certification adoption rate and brand partnership conversion",
      "Decision lever: Invest in B2B enterprise sales for brand verification deals"
    ]
  },
  {
    id: "strength-ai-native",
    category: "strength",
    title: "AI-native workflows",
    description: "Every feature in Seeksy is built with AI at its core—from automatic transcription and clip generation to smart scheduling and content recommendations. This gives creators 10x productivity gains compared to traditional tools.",
    whyItMatters: [
      "AI productivity directly translates to creator output and platform engagement metrics",
      "Enables premium pricing tier for power users who value time savings",
      "First-mover advantage as AI becomes table stakes in 2025-2026"
    ],
    boardConsiderations: [
      "Monitor AI compute costs as percentage of gross margin",
      "Risk if ignored: Competitors can catch up quickly with similar AI features"
    ]
  },
  {
    id: "strength-multi-role",
    category: "strength",
    title: "Multi-role support (creator, podcaster, speaker, community leader)",
    description: "Our platform adapts to different creator types with customizable dashboards and workflows. Whether someone is a full-time podcaster, part-time influencer, or industry speaker, Seeksy molds to their specific needs and grows with their career.",
    whyItMatters: [
      "Expands total addressable market beyond single-niche creator tools",
      "Enables land-and-expand sales motion as creators adopt multiple roles",
      "Reduces churn from role transitions that would otherwise trigger tool switching"
    ],
    boardConsiderations: [
      "Track multi-role adoption as leading indicator of power user conversion",
      "Decision lever: Prioritize role-specific marketing campaigns for underserved segments"
    ]
  },
  // WEAKNESSES
  {
    id: "weakness-brand-awareness",
    category: "weakness",
    title: "Early-stage brand awareness",
    description: "As a newer entrant in the creator tools market, Seeksy lacks the brand recognition of established players like Anchor, Riverside, or Kajabi. This requires significant marketing investment and relies heavily on product-led growth and word-of-mouth referrals.",
    whyItMatters: [
      "Directly impacts customer acquisition cost and sales cycle length",
      "Creates dependency on paid channels until organic awareness builds",
      "Limits enterprise deal velocity where brand trust matters for procurement"
    ],
    boardConsiderations: [
      "Monitor brand search volume and share of voice vs. competitors",
      "Risk if ignored: CAC could exceed LTV before achieving brand escape velocity"
    ]
  },
  {
    id: "weakness-ai-costs",
    category: "weakness",
    title: "AI compute cost dependency",
    description: "Our AI-powered features depend on compute-intensive models for transcription, editing, and generation. This creates margin pressure at scale and requires careful cost management, particularly for heavy users on fixed-price plans.",
    whyItMatters: [
      "Directly impacts gross margin and path to profitability",
      "Creates exposure to AI provider pricing changes (OpenAI, Google, etc.)",
      "Heavy users can become unprofitable without usage-based pricing guardrails"
    ],
    boardConsiderations: [
      "Track AI cost per user cohort and margin by plan tier",
      "Decision lever: Implement usage caps or credit-based AI access"
    ]
  },
  {
    id: "weakness-partner-ecosystem",
    category: "weakness",
    title: "Need for larger partner ecosystem",
    description: "To compete with established platforms, we need deeper integrations with microphone brands, camera companies, distribution platforms, and monetization partners. Building this ecosystem takes time and dedicated partnership resources.",
    whyItMatters: [
      "Limits ability to capture full creator workflow without key integrations",
      "Reduces enterprise appeal where procurement requires partner certifications",
      "Creates friction points that drive churn to better-integrated competitors"
    ],
    boardConsiderations: [
      "Prioritize integrations by customer request volume and churn attribution",
      "Risk if ignored: Competitors with stronger ecosystems capture mid-market"
    ]
  },
  // OPPORTUNITIES
  {
    id: "opportunity-creator-growth",
    category: "opportunity",
    title: "Growth of creators to 10M+ by 2030",
    description: "The creator economy is projected to grow from 4M to 10M+ full-time creators by 2030. As more people pursue content creation as a career or side hustle, the demand for professional-grade tools will accelerate significantly.",
    whyItMatters: [
      "TAM expansion creates rising tide for all creator tools—first movers capture disproportionate share",
      "New creator cohorts have no incumbent loyalty and evaluate tools fresh",
      "Emerging creator segments (B2B thought leaders, educators) underserved by current tools"
    ],
    boardConsiderations: [
      "Track new creator acquisition rate vs. market growth rate",
      "Decision lever: Invest in freemium tier to capture creators before they establish tool preferences"
    ]
  },
  {
    id: "opportunity-podcast-monetization",
    category: "opportunity",
    title: "Podcasting entering second wave of monetization",
    description: "Podcast advertising is maturing with programmatic ad insertion, dynamic sponsorships, and premium subscriber models. Seeksy is positioned to capture this wave with built-in monetization tools and creator-friendly revenue splits.",
    whyItMatters: [
      "Ad marketplace enables take-rate revenue model in addition to subscriptions",
      "Monetization features have highest correlation with creator retention",
      "Premium CPM inventory attracts brand advertisers seeking verified creators"
    ],
    boardConsiderations: [
      "Monitor podcast ad revenue per creator and platform take rate",
      "Decision lever: Accelerate ad marketplace launch to capture second-wave monetization"
    ]
  },
  {
    id: "opportunity-ai-editing",
    category: "opportunity",
    title: "AI replacing 70% of editing workflows",
    description: "Industry analysts predict AI will automate 70% of video and audio editing tasks by 2027. Early adoption of AI-native workflows positions Seeksy as the default choice for efficiency-focused creators seeking competitive advantage.",
    whyItMatters: [
      "Creates winner-take-most dynamics for platforms that solve editing pain point first",
      "Enables 10x content output per creator, increasing engagement and platform value",
      "Attracts high-value creators who prioritize efficiency over price"
    ],
    boardConsiderations: [
      "Track AI feature adoption and time-saved metrics for marketing proof points",
      "Decision lever: Double down on AI R&D to maintain feature leadership"
    ]
  },
  {
    id: "opportunity-community-events",
    category: "opportunity",
    title: "Event + community growth post-TikTok pivot",
    description: "As TikTok faces regulatory uncertainty, creators are diversifying to owned platforms, live events, and community-based monetization. Seeksy's events and CRM features align perfectly with this structural shift in creator strategy.",
    whyItMatters: [
      "Event features have higher ARPU than content-only use cases",
      "Community tools create network effects that increase switching costs",
      "TikTok uncertainty creates urgency for creators to diversify now"
    ],
    boardConsiderations: [
      "Monitor event feature adoption and revenue per event",
      "Decision lever: Create TikTok migration campaign targeting at-risk creators"
    ]
  },
  // THREATS
  {
    id: "threat-incumbents",
    category: "threat",
    title: "Large incumbents adding lightweight AI features",
    description: "Spotify, YouTube, and Adobe are adding AI features to their existing platforms. While often basic compared to Seeksy, their distribution advantage means they can capture creators before they discover our superior capabilities.",
    whyItMatters: [
      "Distribution trumps product in early market—incumbents reach creators first",
      "Good enough AI features reduce urgency to switch to specialized tools",
      "Platform lock-in deepens as AI features integrate with existing workflows"
    ],
    boardConsiderations: [
      "Track feature parity gap and time-to-close for critical AI features",
      "Risk if ignored: Window of differentiation closes within 18-24 months"
    ]
  },
  {
    id: "threat-cac",
    category: "threat",
    title: "Rising cost of acquisition without creator referrals",
    description: "Paid acquisition costs for creators continue to rise across all channels. Without a strong organic referral engine, customer acquisition cost could exceed lifetime value and threaten unit economics at scale.",
    whyItMatters: [
      "CAC/LTV ratio directly determines growth ceiling and funding requirements",
      "Paid channel saturation accelerating as more creator tools enter market",
      "Referral loops are 10x more efficient but require product virality investment"
    ],
    boardConsiderations: [
      "Monitor CAC by channel and payback period trends monthly",
      "Risk if ignored: Growth stalls or requires unsustainable capital burn"
    ]
  },
  {
    id: "threat-platform-dependency",
    category: "threat",
    title: "Platform dependency on App Store/YouTube/Spotify changes",
    description: "Changes to distribution platform policies, algorithms, or monetization rules can impact our creators' success and, indirectly, Seeksy's value proposition. Diversification to owned channels is essential for resilience.",
    whyItMatters: [
      "Platform policy changes can overnight destroy creator businesses and our revenue",
      "Algorithm shifts affect creator visibility and content strategy efficacy",
      "App store fees and policies constrain mobile monetization options"
    ],
    boardConsiderations: [
      "Track platform concentration risk and owned-channel adoption rates",
      "Decision lever: Accelerate email/SMS features to reduce distribution dependency"
    ]
  }
];

const categoryConfig: Record<SwotCategory, {
  title: string;
  subtitle: string;
  emoji: string;
  icon: React.ElementType;
  bgColor: string;
  borderColor: string;
  iconBgColor: string;
  iconColor: string;
  pillBg: string;
  pillHover: string;
  badgeColor: string;
}> = {
  strength: {
    title: 'Strengths',
    subtitle: 'Internal • Positive',
    emoji: '💪',
    icon: ThumbsUp,
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconBgColor: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    pillBg: 'bg-white border border-emerald-200',
    pillHover: 'hover:border-emerald-400 hover:shadow-md',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  weakness: {
    title: 'Weaknesses',
    subtitle: 'Internal • Negative',
    emoji: '⚠️',
    icon: ThumbsDown,
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    iconBgColor: 'bg-rose-100',
    iconColor: 'text-rose-600',
    pillBg: 'bg-white border border-rose-200',
    pillHover: 'hover:border-rose-400 hover:shadow-md',
    badgeColor: 'bg-rose-100 text-rose-700',
  },
  opportunity: {
    title: 'Opportunities',
    subtitle: 'External • Positive',
    emoji: '🎯',
    icon: Lightbulb,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconBgColor: 'bg-amber-100',
    iconColor: 'text-amber-600',
    pillBg: 'bg-white border border-amber-200',
    pillHover: 'hover:border-amber-400 hover:shadow-md',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  threat: {
    title: 'Threats',
    subtitle: 'External • Negative',
    emoji: '🛡️',
    icon: AlertTriangle,
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    iconBgColor: 'bg-slate-100',
    iconColor: 'text-slate-600',
    pillBg: 'bg-white border border-slate-200',
    pillHover: 'hover:border-slate-400 hover:shadow-md',
    badgeColor: 'bg-slate-200 text-slate-700',
  },
};

function groupByCategory(items: SwotItem[]): Record<SwotCategory, SwotItem[]> {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<SwotCategory, SwotItem[]>);
}

export default function BoardSWOT() {
  const [viewMode, setViewMode] = useState<ViewMode>('quadrant');
  const [selectedItem, setSelectedItem] = useState<SwotItem | null>(null);
  const [activeTab, setActiveTab] = useState<SwotCategory>('strength');

  const groupedItems = groupByCategory(SWOT_DATA);
  const quadrantOrder: SwotCategory[] = ['strength', 'weakness', 'opportunity', 'threat'];

  const handleAskAI = (item: SwotItem) => {
    const config = categoryConfig[item.category];
    const prompt = `Analyze the strategic implications of: "${item.title}"

Category: ${config.title}
Description: ${item.description}

Provide:
1. Financial impact on revenue, costs, or growth
2. Strategic urgency and timeline
3. Resource requirements
4. Board-level decisions required`;

    window.dispatchEvent(new CustomEvent('openSparkChat', { detail: { prompt } }));
    setSelectedItem(null);
  };

  const handleCopySummary = (item: SwotItem) => {
    const config = categoryConfig[item.category];
    const text = `${config.title.slice(0, -1)}: ${item.title}

${item.description}

Why This Matters:
${item.whyItMatters.map(m => `• ${m}`).join('\n')}

Board Considerations:
${item.boardConsiderations.map(c => `• ${c}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    toast.success("Summary copied to clipboard");
  };

  // Quadrant View Component
  const QuadrantView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {quadrantOrder.map((category, idx) => {
        const config = categoryConfig[category];
        const items = groupedItems[category] || [];

        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            className={cn(
              "rounded-2xl border p-5 shadow-sm",
              config.bgColor,
              config.borderColor
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-xl", config.iconBgColor)}>
                  <span className="text-lg">{config.emoji}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{config.title}</h3>
                  <p className="text-xs text-slate-500">{config.subtitle}</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs bg-white/80 text-slate-600">
                {items.length}
              </Badge>
            </div>

            <div className="space-y-2">
              {items.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.1 + i * 0.05 }}
                  onClick={() => setSelectedItem(item)}
                  className={cn(
                    "w-full text-left rounded-xl shadow-sm px-4 py-3",
                    "flex items-center justify-between gap-3 cursor-pointer",
                    "transition-all duration-150 ease-out",
                    config.pillBg,
                    config.pillHover
                  )}
                >
                  <span className="text-sm font-medium text-slate-800 line-clamp-2">
                    {item.title}
                  </span>
                  <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  // Stack View Component
  const StackView = () => (
    <div className="space-y-4">
      {quadrantOrder.map((category) => {
        const config = categoryConfig[category];
        const items = groupedItems[category] || [];
        const Icon = config.icon;

        return (
          <Card key={category} className={cn("border", config.borderColor)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("p-2 rounded-lg", config.iconBgColor)}>
                  <Icon className={cn("w-5 h-5", config.iconColor)} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{config.title}</h3>
                  <p className="text-xs text-slate-500">{config.subtitle}</p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  {items.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="w-full text-left p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm text-slate-800">{item.title}</span>
                    <Info className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // Radial View Component
  const RadialView = () => {
    const totalItems = SWOT_DATA.length;
    const getCategoryPercentage = (category: SwotCategory) => {
      const count = groupedItems[category]?.length || 0;
      return Math.round((count / totalItems) * 100);
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Distribution Overview</h3>
          <div className="space-y-4">
            {quadrantOrder.map((category) => {
              const config = categoryConfig[category];
              const percentage = getCategoryPercentage(category);
              const count = groupedItems[category]?.length || 0;

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{config.emoji}</span>
                      <span className="text-sm font-medium text-slate-700">{config.title}</span>
                    </div>
                    <span className="text-sm text-slate-500">{count} items ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className={cn(
                        "h-full rounded-full",
                        category === 'strength' && "bg-emerald-500",
                        category === 'weakness' && "bg-rose-500",
                        category === 'opportunity' && "bg-amber-500",
                        category === 'threat' && "bg-slate-500"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Strategic Balance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-3xl font-bold text-emerald-600">
                {(groupedItems.strength?.length || 0) + (groupedItems.opportunity?.length || 0)}
              </div>
              <div className="text-sm text-slate-600 mt-1">Positive Factors</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-rose-50 border border-rose-200">
              <div className="text-3xl font-bold text-rose-600">
                {(groupedItems.weakness?.length || 0) + (groupedItems.threat?.length || 0)}
              </div>
              <div className="text-sm text-slate-600 mt-1">Risk Factors</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">
                {(groupedItems.strength?.length || 0) + (groupedItems.weakness?.length || 0)}
              </div>
              <div className="text-sm text-slate-600 mt-1">Internal Factors</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-purple-50 border border-purple-200">
              <div className="text-3xl font-bold text-purple-600">
                {(groupedItems.opportunity?.length || 0) + (groupedItems.threat?.length || 0)}
              </div>
              <div className="text-sm text-slate-600 mt-1">External Factors</div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Tabs View Component
  const TabsView = () => (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SwotCategory)}>
      <TabsList className="grid grid-cols-4 w-full mb-6">
        {quadrantOrder.map((category) => {
          const config = categoryConfig[category];
          return (
            <TabsTrigger
              key={category}
              value={category}
              className="flex items-center gap-2"
            >
              <span>{config.emoji}</span>
              <span className="hidden sm:inline">{config.title}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
      {quadrantOrder.map((category) => {
        const config = categoryConfig[category];
        const items = groupedItems[category] || [];

        return (
          <TabsContent key={category} value={category}>
            <Card className={cn("border", config.borderColor)}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className={cn("p-3 rounded-xl", config.iconBgColor)}>
                    <span className="text-2xl">{config.emoji}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{config.title}</h2>
                    <p className="text-sm text-slate-500">{config.subtitle}</p>
                  </div>
                </div>
                <div className="grid gap-3">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all",
                        config.bgColor,
                        config.borderColor,
                        "hover:shadow-md"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-medium text-slate-900">{item.title}</h4>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{item.description}</p>
                        </div>
                        <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        );
      })}
    </Tabs>
  );

  return (
    <TooltipProvider>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">SWOT Analysis</h1>
            <p className="text-sm text-slate-500 mt-1">
              Strategic assessment of Seeksy's position in the creator economy
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 rounded-xl p-1.5 gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={viewMode === 'quadrant' ? 'default' : 'ghost'}
                    className="h-10 w-10 p-0"
                    onClick={() => setViewMode('quadrant')}
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Quadrant View</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={viewMode === 'stack' ? 'default' : 'ghost'}
                    className="h-10 w-10 p-0"
                    onClick={() => setViewMode('stack')}
                  >
                    <List className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Stack View</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={viewMode === 'radial' ? 'default' : 'ghost'}
                    className="h-10 w-10 p-0"
                    onClick={() => setViewMode('radial')}
                  >
                    <PieChart className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Summary View</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={viewMode === 'tabs' ? 'default' : 'ghost'}
                    className="h-10 w-10 p-0"
                    onClick={() => setViewMode('tabs')}
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tabs View</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* View Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {viewMode === 'quadrant' && <QuadrantView />}
            {viewMode === 'stack' && <StackView />}
            {viewMode === 'radial' && <RadialView />}
            {viewMode === 'tabs' && <TabsView />}
          </motion.div>
        </AnimatePresence>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedItem && (
            <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
              <DialogContent className="max-w-lg sm:max-w-2xl rounded-2xl bg-white p-0 overflow-hidden">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-6"
                >
                  <DialogHeader className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn("p-2 rounded-lg", categoryConfig[selectedItem.category].iconBgColor)}>
                        <span className="text-lg">{categoryConfig[selectedItem.category].emoji}</span>
                      </div>
                      <Badge className={categoryConfig[selectedItem.category].badgeColor}>
                        {categoryConfig[selectedItem.category].title.slice(0, -1)}
                      </Badge>
                    </div>
                    <DialogTitle className="text-xl font-bold text-slate-900">
                      {selectedItem.title}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <p className="text-slate-600">{selectedItem.description}</p>

                    <div className="bg-slate-50 rounded-xl p-4">
                      <h4 className="font-semibold text-slate-900 mb-2">Why This Matters</h4>
                      <ul className="space-y-1">
                        {selectedItem.whyItMatters.map((item, i) => (
                          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                            <span className="text-slate-400">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="font-semibold text-slate-900 mb-2">Board Considerations</h4>
                      <ul className="space-y-1">
                        {selectedItem.boardConsiderations.map((item, i) => (
                          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                            <span className="text-blue-400">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => handleAskAI(selectedItem)}
                    >
                      <Bot className="w-4 h-4" />
                      Ask Board AI Analyst
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => handleCopySummary(selectedItem)}
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </Button>
                  </div>
                </motion.div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
