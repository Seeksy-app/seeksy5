import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Lightbulb, AlertTriangle, Info, Copy, Bot, Sparkles, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Types
type SwotCategory = "strength" | "weakness" | "opportunity" | "threat";

interface SwotItem {
  id: string;
  category: SwotCategory;
  title: string;
  description: string;
  whyItMatters: string[];
  boardConsiderations: string[];
}

// Complete SWOT data with all required content
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

// Category configuration
const categoryConfig: Record<SwotCategory, {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  emoji: string;
  bgColor: string;
  iconBgColor: string;
  iconColor: string;
  pillBg: string;
  pillHover: string;
  badgeColor: string;
  borderColor: string;
}> = {
  strength: {
    title: "Strengths",
    subtitle: "Internal Advantage",
    icon: ThumbsUp,
    emoji: "👍",
    bgColor: "bg-[#ECFDF5]",
    iconBgColor: "bg-emerald-100",
    iconColor: "text-emerald-600",
    pillBg: "bg-white/80",
    pillHover: "hover:bg-white hover:shadow-md hover:-translate-y-0.5",
    badgeColor: "bg-emerald-100 text-emerald-700",
    borderColor: "border-emerald-200/50"
  },
  weakness: {
    title: "Weaknesses",
    subtitle: "Internal Challenge",
    icon: ThumbsDown,
    emoji: "⚠️",
    bgColor: "bg-[#FEF2F2]",
    iconBgColor: "bg-rose-100",
    iconColor: "text-rose-600",
    pillBg: "bg-white/80",
    pillHover: "hover:bg-white hover:shadow-md hover:-translate-y-0.5",
    badgeColor: "bg-rose-100 text-rose-700",
    borderColor: "border-rose-200/50"
  },
  opportunity: {
    title: "Opportunities",
    subtitle: "External Tailwind",
    icon: Lightbulb,
    emoji: "💡",
    bgColor: "bg-[#FFFBEB]",
    iconBgColor: "bg-amber-100",
    iconColor: "text-amber-600",
    pillBg: "bg-white/80",
    pillHover: "hover:bg-white hover:shadow-md hover:-translate-y-0.5",
    badgeColor: "bg-amber-100 text-amber-700",
    borderColor: "border-amber-200/50"
  },
  threat: {
    title: "Threats",
    subtitle: "External Risk",
    icon: AlertTriangle,
    emoji: "🔺",
    bgColor: "bg-[#F1F5F9]",
    iconBgColor: "bg-slate-200",
    iconColor: "text-slate-600",
    pillBg: "bg-white/80",
    pillHover: "hover:bg-white hover:shadow-md hover:-translate-y-0.5",
    badgeColor: "bg-slate-200 text-slate-700",
    borderColor: "border-slate-200/50"
  }
};

// Group items by category
function groupByCategory(items: SwotItem[]): Record<SwotCategory, SwotItem[]> {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<SwotCategory, SwotItem[]>);
}

export function SWOTAnalysisTab() {
  const [selectedItem, setSelectedItem] = useState<SwotItem | null>(null);
  const { isDemo } = useBoardDataMode();
  
  const groupedItems = groupByCategory(SWOT_DATA);
  
  const handleAskAI = (item: SwotItem) => {
    const config = categoryConfig[item.category];
    
    const prompt = `Provide financial and strategic implications for the SWOT item: "${item.title}"

Context:
- Category: ${config.title} (${config.subtitle})
- Description: ${item.description}

Please analyze:
1. Quantitative impact on revenue, costs, or growth metrics
2. Strategic urgency and recommended timeline
3. Resource requirements and trade-offs
4. Specific board-level decisions required`;

    const encodedPrompt = encodeURIComponent(prompt);
    window.open(`/board/ai-analyst?prompt=${encodedPrompt}`, '_blank');
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

  const quadrantOrder: SwotCategory[] = ["strength", "weakness", "opportunity", "threat"];

  return (
    <TooltipProvider>
      <div className="max-w-6xl mx-auto py-6 space-y-6">
        {/* Coming Soon Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100"
        >
          <div className="p-2 rounded-lg bg-blue-100">
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-blue-900">Coming Soon: AI-Generated SWOT Updates</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ml-2 text-blue-600 hover:text-blue-700">
                  <Info className="w-3.5 h-3.5 inline" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">AI will soon track competitive landscape, market shifts, and internal KPIs to refresh SWOT items automatically.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {isDemo && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              Demo data for illustration
            </Badge>
          )}
        </motion.div>

        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900">SWOT Analysis</h2>
          <p className="text-sm text-slate-500 mt-1">
            Strategic assessment of Seeksy's position in the creator economy
          </p>
        </div>

        {/* 2x2 Quadrant Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {quadrantOrder.map((category, quadrantIndex) => {
            const config = categoryConfig[category];
            const items = groupedItems[category] || [];
            const IconComponent = config.icon;
            
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: quadrantIndex * 0.1 }}
                className={cn(
                  "rounded-2xl border p-5 shadow-sm",
                  config.bgColor,
                  config.borderColor
                )}
              >
                {/* Quadrant Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("p-2.5 rounded-xl", config.iconBgColor)}>
                    <IconComponent className={cn("w-5 h-5", config.iconColor)} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{config.title}</h3>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-1.5 rounded-lg hover:bg-white/50 transition-colors">
                        <Info className="w-4 h-4 text-slate-400" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        {category === 'strength' && "Internal advantages that give Seeksy competitive edge. Board should ensure these are protected and leveraged."}
                        {category === 'weakness' && "Internal challenges requiring strategic investment. Board should monitor mitigation progress."}
                        {category === 'opportunity' && "External tailwinds to capitalize on. Board should allocate resources to capture these."}
                        {category === 'threat' && "External risks requiring contingency planning. Board should ensure defensive strategies are in place."}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Badge variant="secondary" className="text-xs bg-white/80 text-slate-600">
                    {items.length}
                  </Badge>
                </div>

                {/* Item Pills */}
                <div className="space-y-2">
                  {items.map((item, itemIndex) => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: quadrantIndex * 0.1 + itemIndex * 0.05 }}
                      onClick={() => setSelectedItem(item)}
                      className={cn(
                        "w-full text-left rounded-xl shadow-sm px-4 py-3",
                        "flex items-center justify-between gap-3 cursor-pointer",
                        "transition-all duration-[120ms] ease-in-out",
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

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedItem && (
            <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
              <DialogContent className="max-w-lg sm:max-w-2xl rounded-2xl bg-white p-0 overflow-hidden">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.12, ease: 'easeInOut' }}
                >
                  {/* Modal Header */}
                  <DialogHeader className="p-6 pb-4 border-b bg-slate-50/50">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2.5 rounded-xl flex-shrink-0",
                        categoryConfig[selectedItem.category].iconBgColor
                      )}>
                        <span className="text-xl">{categoryConfig[selectedItem.category].emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge className={cn("mb-2 text-xs font-medium", categoryConfig[selectedItem.category].badgeColor)}>
                          {categoryConfig[selectedItem.category].title.slice(0, -1)} • {categoryConfig[selectedItem.category].subtitle}
                        </Badge>
                        <DialogTitle className="text-lg font-semibold text-slate-900 leading-tight pr-8">
                          {selectedItem.title}
                        </DialogTitle>
                      </div>
                    </div>
                  </DialogHeader>

                  {/* Modal Body */}
                  <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Section A: Description */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Description</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {selectedItem.description}
                      </p>
                    </div>

                    {/* Section B: Why This Matters */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Why This Matters</h4>
                      <ul className="space-y-2.5">
                        {selectedItem.whyItMatters.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Section C: Board-Level Considerations */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Board-Level Considerations</h4>
                      <ul className="space-y-2">
                        {selectedItem.boardConsiderations.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t bg-slate-50/50 flex flex-col sm:flex-row gap-2 sm:justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopySummary(selectedItem)}
                      className="gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy summary
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAskAI(selectedItem)}
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <Bot className="w-4 h-4" />
                      Ask Board AI Analyst
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
