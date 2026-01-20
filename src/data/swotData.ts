// Centralized SWOT data source
export type SwotCategory = "strength" | "weakness" | "opportunity" | "threat";

export interface SwotItem {
  id: string;
  category: SwotCategory;
  title: string;
  description: string;
  whyItMatters: string[];
  boardConsiderations: string[];
}

export const SWOT_DATA: SwotItem[] = [
  // STRENGTHS
  {
    id: "strength-unified-os",
    category: "strength",
    title: "Unified creator OS (studio, hosting, CRM, events, AI)",
    description: "Seeksy is the only platform that combines podcast hosting, video studio, CRM, event management, and AI-powered editing into a single unified system. This eliminates the need for creators to juggle multiple subscriptions and reduces friction while increasing retention and lifetime value.",
    whyItMatters: [
      "Centralization reduces tool fatigue and increases retention",
      "Directly impacts revenue through higher ARPU as creators consolidate tools",
      "Creates strong competitive moat through data network effects"
    ],
    boardConsiderations: [
      "Monitor feature parity with best-of-breed competitors",
      "Track cross-feature adoption rates as leading indicator of retention"
    ]
  },
  {
    id: "strength-identity-rights",
    category: "strength",
    title: "Identity + rights protection",
    description: "Our blockchain-backed voice and face certification system provides creators with verifiable identity credentials. This protects against deepfakes, enables licensing opportunities, and builds trust with brands seeking authentic creator partnerships.",
    whyItMatters: [
      "No other platform protects creator IP natively",
      "Opens new revenue stream through identity licensing marketplace",
      "Creates switching cost moat—creators cannot migrate certified identity"
    ],
    boardConsiderations: [
      "Track certification adoption rate and brand partnership conversion",
      "Invest in B2B enterprise sales for brand verification deals"
    ]
  },
  {
    id: "strength-ai-native",
    category: "strength",
    title: "AI-native workflows",
    description: "Every feature in Seeksy is built with AI at its core—from automatic transcription and clip generation to smart scheduling and content recommendations. This gives creators 10x productivity gains compared to traditional tools.",
    whyItMatters: [
      "Competitive moat vs older, slower platforms",
      "AI productivity directly translates to creator output and engagement",
      "First-mover advantage as AI becomes table stakes in 2025-2026"
    ],
    boardConsiderations: [
      "Monitor AI compute costs as percentage of gross margin",
      "Risk: Competitors can catch up quickly with similar AI features"
    ]
  },
  {
    id: "strength-multi-role",
    category: "strength",
    title: "Multi-role support (creator, podcaster, speaker)",
    description: "Our platform adapts to different creator types with customizable dashboards and workflows. Whether someone is a full-time podcaster, part-time influencer, or industry speaker, Seeksy molds to their specific needs.",
    whyItMatters: [
      "Expands TAM without product fragmentation",
      "Enables land-and-expand sales motion as creators adopt multiple roles",
      "Reduces churn from role transitions"
    ],
    boardConsiderations: [
      "Track multi-role adoption as leading indicator of power user conversion",
      "Prioritize role-specific marketing campaigns for underserved segments"
    ]
  },
  // WEAKNESSES
  {
    id: "weakness-brand-awareness",
    category: "weakness",
    title: "Early-stage brand awareness",
    description: "As a newer entrant in the creator tools market, Seeksy lacks the brand recognition of established players like Anchor, Riverside, or Kajabi. This requires significant marketing investment and relies heavily on product-led growth.",
    whyItMatters: [
      "Increases CAC and slows referral loops",
      "Creates dependency on paid channels until organic awareness builds",
      "Limits enterprise deal velocity where brand trust matters"
    ],
    boardConsiderations: [
      "Monitor brand search volume and share of voice vs. competitors",
      "Risk: CAC could exceed LTV before achieving brand escape velocity"
    ]
  },
  {
    id: "weakness-ai-costs",
    category: "weakness",
    title: "AI compute cost dependency",
    description: "Our AI-powered features depend on compute-intensive models for transcription, editing, and generation. This creates margin pressure at scale and requires careful cost management, particularly for heavy users on fixed-price plans.",
    whyItMatters: [
      "Affects gross margin at scale",
      "Creates exposure to AI provider pricing changes",
      "Heavy users can become unprofitable without usage-based pricing"
    ],
    boardConsiderations: [
      "Track AI cost per user cohort and margin by plan tier",
      "Implement usage caps or credit-based AI access"
    ]
  },
  {
    id: "weakness-partner-ecosystem",
    category: "weakness",
    title: "Need for larger partner ecosystem",
    description: "To compete with established platforms, we need deeper integrations with microphone brands, camera companies, distribution platforms, and monetization partners. Building this ecosystem takes time and dedicated resources.",
    whyItMatters: [
      "Integrations are critical for GTM expansion",
      "Limits ability to capture full creator workflow without key integrations",
      "Creates friction points that drive churn"
    ],
    boardConsiderations: [
      "Prioritize integrations by customer request volume and churn attribution",
      "Risk: Competitors with stronger ecosystems capture mid-market"
    ]
  },
  // OPPORTUNITIES
  {
    id: "opportunity-creator-growth",
    category: "opportunity",
    title: "Growth of creators to 10M+ by 2030",
    description: "The creator economy is projected to grow from 4M to 10M+ full-time creators by 2030. As more people pursue content creation as a career or side hustle, the demand for professional-grade tools will accelerate.",
    whyItMatters: [
      "Seeksy becomes foundational infrastructure",
      "New creator cohorts have no incumbent loyalty",
      "Emerging segments (B2B thought leaders, educators) underserved"
    ],
    boardConsiderations: [
      "Track new creator acquisition rate vs. market growth rate",
      "Invest in freemium tier to capture creators early"
    ]
  },
  {
    id: "opportunity-podcast-monetization",
    category: "opportunity",
    title: "Second wave of podcast monetization",
    description: "Podcast advertising is maturing with programmatic ad insertion, dynamic sponsorships, and premium subscriber models. Seeksy is positioned to capture this wave with built-in monetization tools.",
    whyItMatters: [
      "Ad spend is shifting toward niche creators",
      "Monetization features have highest correlation with retention",
      "Premium CPM inventory attracts brand advertisers"
    ],
    boardConsiderations: [
      "Monitor podcast ad revenue per creator and platform take rate",
      "Accelerate ad marketplace launch to capture second-wave monetization"
    ]
  },
  {
    id: "opportunity-ai-editing",
    category: "opportunity",
    title: "AI replacing 70% of editing workflows",
    description: "Industry analysts predict AI will automate 70% of video and audio editing tasks by 2027. Early adoption of AI-native workflows positions Seeksy as the default choice for efficiency-focused creators.",
    whyItMatters: [
      "Seeksy can own the workflow end-to-end",
      "Enables 10x content output per creator",
      "Attracts high-value creators who prioritize efficiency"
    ],
    boardConsiderations: [
      "Track AI feature adoption and time-saved metrics",
      "Double down on AI R&D to maintain feature leadership"
    ]
  },
  {
    id: "opportunity-community-events",
    category: "opportunity",
    title: "Community-driven event growth post-TikTok",
    description: "As TikTok faces regulatory uncertainty, creators are diversifying to owned platforms, live events, and community-based monetization. Seeksy's events and CRM features align perfectly with this shift.",
    whyItMatters: [
      "Event monetization becomes a major revenue lever",
      "Community tools create network effects",
      "TikTok uncertainty creates urgency for creators"
    ],
    boardConsiderations: [
      "Monitor event feature adoption and revenue per event",
      "Create TikTok migration campaign targeting at-risk creators"
    ]
  },
  // THREATS
  {
    id: "threat-incumbents",
    category: "threat",
    title: "Incumbents adding lightweight AI features",
    description: "Spotify, YouTube, and Adobe are adding AI features to their existing platforms. While often basic compared to Seeksy, their distribution advantage means they can capture creators before they discover superior alternatives.",
    whyItMatters: [
      "Could slow differentiation in low-end markets",
      "Distribution trumps product in early market",
      "Platform lock-in deepens as AI features integrate"
    ],
    boardConsiderations: [
      "Track feature parity gap and time-to-close for critical features",
      "Risk: Window of differentiation closes within 18-24 months"
    ]
  },
  {
    id: "threat-cac",
    category: "threat",
    title: "Rising cost of acquisition w/out referrals",
    description: "Paid acquisition costs for creators continue to rise across all channels. Without a strong organic referral engine, customer acquisition cost could exceed lifetime value and threaten unit economics at scale.",
    whyItMatters: [
      "Paid growth becomes unsustainable",
      "CAC/LTV ratio determines growth ceiling",
      "Referral loops are 10x more efficient"
    ],
    boardConsiderations: [
      "Monitor CAC by channel and payback period monthly",
      "Risk: Growth stalls or requires unsustainable capital burn"
    ]
  },
  {
    id: "threat-platform-dependency",
    category: "threat",
    title: "Dependency on App Store / YouTube / Spotify",
    description: "Changes to distribution platform policies, algorithms, or monetization rules can impact our creators' success and, indirectly, Seeksy's value proposition. Diversification to owned channels is essential.",
    whyItMatters: [
      "Regulatory or policy changes can impact revenue",
      "Algorithm shifts affect creator visibility",
      "App store fees constrain mobile monetization"
    ],
    boardConsiderations: [
      "Track platform concentration risk and owned-channel adoption",
      "Accelerate email/SMS features to reduce distribution dependency"
    ]
  }
];

// Category configuration
export const categoryConfig: Record<SwotCategory, {
  title: string;
  subtitle: string;
  emoji: string;
  bgColor: string;
  iconBgColor: string;
  iconColor: string;
  pillBg: string;
  pillHover: string;
  badgeColor: string;
  borderColor: string;
  gradientFrom: string;
  gradientTo: string;
}> = {
  strength: {
    title: "Strengths",
    subtitle: "Internal Advantage",
    emoji: "🎯",
    bgColor: "bg-[#ECFDF5]",
    iconBgColor: "bg-emerald-100",
    iconColor: "text-emerald-600",
    pillBg: "bg-white/80",
    pillHover: "hover:bg-white hover:shadow-md hover:-translate-y-0.5",
    badgeColor: "bg-emerald-100 text-emerald-700",
    borderColor: "border-emerald-200/50",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-teal-600"
  },
  weakness: {
    title: "Weaknesses",
    subtitle: "Internal Challenge",
    emoji: "⚠️",
    bgColor: "bg-[#FEF2F2]",
    iconBgColor: "bg-rose-100",
    iconColor: "text-rose-600",
    pillBg: "bg-white/80",
    pillHover: "hover:bg-white hover:shadow-md hover:-translate-y-0.5",
    badgeColor: "bg-rose-100 text-rose-700",
    borderColor: "border-rose-200/50",
    gradientFrom: "from-rose-500",
    gradientTo: "to-red-600"
  },
  opportunity: {
    title: "Opportunities",
    subtitle: "External Tailwind",
    emoji: "🚀",
    bgColor: "bg-[#FFFBEB]",
    iconBgColor: "bg-amber-100",
    iconColor: "text-amber-600",
    pillBg: "bg-white/80",
    pillHover: "hover:bg-white hover:shadow-md hover:-translate-y-0.5",
    badgeColor: "bg-amber-100 text-amber-700",
    borderColor: "border-amber-200/50",
    gradientFrom: "from-amber-500",
    gradientTo: "to-orange-600"
  },
  threat: {
    title: "Threats",
    subtitle: "External Risk",
    emoji: "🔻",
    bgColor: "bg-[#F1F5F9]",
    iconBgColor: "bg-slate-200",
    iconColor: "text-slate-600",
    pillBg: "bg-white/80",
    pillHover: "hover:bg-white hover:shadow-md hover:-translate-y-0.5",
    badgeColor: "bg-slate-200 text-slate-700",
    borderColor: "border-slate-200/50",
    gradientFrom: "from-slate-500",
    gradientTo: "to-slate-700"
  }
};

// Group items by category
export function groupByCategory(items: SwotItem[]): Record<SwotCategory, SwotItem[]> {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<SwotCategory, SwotItem[]>);
}