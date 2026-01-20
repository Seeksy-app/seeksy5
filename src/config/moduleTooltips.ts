// Complete tooltip data for all modules - used as fallback and initial data

export interface ModuleTooltipConfig {
  shortDescription: string;
  bestFor: string[];
  unlocks: string[];
  creditEstimate: number;
}

export const moduleTooltips: Record<string, ModuleTooltipConfig> = {
  // CREATOR TOOLS
  "social-connect": {
    shortDescription: "Sync and manage your social media accounts across platforms.",
    bestFor: ["Creators growing multi-channel presence"],
    unlocks: ["Cross-platform posting", "Audience syncing", "Performance aggregation"],
    creditEstimate: 5,
  },
  "audience-insights": {
    shortDescription: "Analytics for engagement, growth, and audience retention.",
    bestFor: ["Data-driven creators", "Podcasters"],
    unlocks: ["Engagement trends", "Follower demographics", "Growth forecasts"],
    creditEstimate: 10,
  },
  "social-analytics": {
    shortDescription: "Analytics for engagement, growth, and audience retention.",
    bestFor: ["Data-driven creators", "Podcasters"],
    unlocks: ["Engagement trends", "Follower demographics", "Growth forecasts"],
    creditEstimate: 10,
  },
  "brand-campaigns": {
    shortDescription: "Manage sponsorships, contracts, and deliverables.",
    bestFor: ["Influencers", "Podcasters"],
    unlocks: ["Proposal builder", "Campaign tracking", "Deliverables management"],
    creditEstimate: 15,
  },
  "revenue-tracking": {
    shortDescription: "Unified dashboard for all income streams.",
    bestFor: ["Creators monetizing across platforms"],
    unlocks: ["Multi-channel tracking", "Payment forecasting", "Payout history"],
    creditEstimate: 5,
  },
  "growth-tools": {
    shortDescription: "AI tools to accelerate channel growth.",
    bestFor: ["Creators optimizing content performance"],
    unlocks: ["AI growth strategies", "Optimization tasks"],
    creditEstimate: 20,
  },
  "content-library": {
    shortDescription: "Centralized media storage and organization.",
    bestFor: ["High-volume content creators"],
    unlocks: ["Smart tagging", "Version control", "Asset reuse"],
    creditEstimate: 10,
  },

  // MEDIA & CONTENT
  "studio": {
    shortDescription: "AI-powered recording studio for video & audio.",
    bestFor: ["Podcasters", "Speakers"],
    unlocks: ["HD recording", "Live streaming", "AI noise cleanup"],
    creditEstimate: 50,
  },
  "podcasts": {
    shortDescription: "Host, distribute, and manage your podcast.",
    bestFor: ["Podcasters"],
    unlocks: ["RSS feed", "AI editing", "Scheduling"],
    creditEstimate: 20,
  },
  "media-library": {
    shortDescription: "Organized storage for all uploaded assets.",
    bestFor: ["Frequent video/audio creators"],
    unlocks: ["Smart search", "Auto-tagging", "Asset management"],
    creditEstimate: 10,
  },
  "clips-editing": {
    shortDescription: "Auto-generate clips and short-form video.",
    bestFor: ["Social-first creators"],
    unlocks: ["Auto-clipping", "Captions", "Platform formats"],
    creditEstimate: 30,
  },
  "my-page-streaming": {
    shortDescription: "Stream directly on your creator page.",
    bestFor: ["Live streamers", "Community builders"],
    unlocks: ["Embedded streams", "Chat integration", "Audience engagement"],
    creditEstimate: 40,
  },

  // GROWTH & DISTRIBUTION (Marketing & CRM)
  "contacts": {
    shortDescription: "Manage contacts, leads, and subscribers.",
    bestFor: ["Creators with growing audiences"],
    unlocks: ["Contact management", "Lead tracking", "Subscriber lists"],
    creditEstimate: 5,
  },
  "segments": {
    shortDescription: "Create targeted audience segments.",
    bestFor: ["Marketing-focused creators"],
    unlocks: ["Smart segments", "Custom filters", "Audience targeting"],
    creditEstimate: 5,
  },
  "campaigns": {
    shortDescription: "AI-assisted content scheduling and posting.",
    bestFor: ["Busy creators"],
    unlocks: ["Scheduled posts", "Trend-based optimization", "Multi-platform syncing"],
    creditEstimate: 25,
  },
  "email-templates": {
    shortDescription: "Build email lists and send campaigns.",
    bestFor: ["Podcasters", "Coaches"],
    unlocks: ["Drip sequences", "Broadcasts", "List syncing"],
    creditEstimate: 10,
  },
  "automations": {
    shortDescription: "Automated workflows and sequences.",
    bestFor: ["Efficiency-focused creators"],
    unlocks: ["Workflow automation", "Triggered actions", "Time savings"],
    creditEstimate: 15,
  },
  "sms": {
    shortDescription: "Text messaging and campaigns.",
    bestFor: ["Creators with engaged audiences"],
    unlocks: ["SMS broadcasts", "Two-way messaging", "Campaign tracking"],
    creditEstimate: 20,
  },
  "forms": {
    shortDescription: "Build forms and collect submissions.",
    bestFor: ["Event hosts", "Coaches"],
    unlocks: ["Custom forms", "Data collection", "Integrations"],
    creditEstimate: 5,
  },
  "qr-codes": {
    shortDescription: "Generate and track QR codes.",
    bestFor: ["Event hosts", "Marketers"],
    unlocks: ["QR generation", "Scan tracking", "Analytics"],
    creditEstimate: 5,
  },

  // BUSINESS TOOLS
  "proposals": {
    shortDescription: "Build professional proposals for brands.",
    bestFor: ["Influencers", "Consultants"],
    unlocks: ["Templates", "Signatures", "Workflow tracking"],
    creditEstimate: 10,
  },
  "tasks": {
    shortDescription: "Manage tasks and projects.",
    bestFor: ["Organized creators", "Teams"],
    unlocks: ["Task boards", "Project tracking", "Team collaboration"],
    creditEstimate: 5,
  },
  "events": {
    shortDescription: "Create events and manage RSVPs.",
    bestFor: ["Event hosts", "Speakers"],
    unlocks: ["Event pages", "Ticketing", "Attendee management"],
    creditEstimate: 15,
  },
  "polls": {
    shortDescription: "Collect audience feedback.",
    bestFor: ["Community builders"],
    unlocks: ["Quick polls", "Surveys", "Feedback analysis"],
    creditEstimate: 5,
  },
  "awards": {
    shortDescription: "Award programs and nominations.",
    bestFor: ["Community leaders", "Organizations"],
    unlocks: ["Award ceremonies", "Nominations", "Voting"],
    creditEstimate: 10,
  },
  "team": {
    shortDescription: "Manage team members and collaborate.",
    bestFor: ["Growing creators", "Agencies"],
    unlocks: ["Team access", "Roles", "Permissions"],
    creditEstimate: 10,
  },
  "billing": {
    shortDescription: "Manage memberships, tips, and paid offerings.",
    bestFor: ["Creators selling subscriptions"],
    unlocks: ["Payment collection", "Tiers", "Payout reporting"],
    creditEstimate: 10,
  },
  "payments": {
    shortDescription: "Track payout status and financials.",
    bestFor: ["Any monetized creator"],
    unlocks: ["Payout history", "Tax docs", "Withdrawal management"],
    creditEstimate: 5,
  },
  "gtm-engine": {
    shortDescription: "AI strategy engine for business growth.",
    bestFor: ["Entrepreneurs"],
    unlocks: ["Market research", "Positioning", "Channel planning"],
    creditEstimate: 25,
  },

  // IDENTITY & PROFILE
  "my-page": {
    shortDescription: "Build your personal landing page.",
    bestFor: ["All creators building their brand"],
    unlocks: ["Custom page builder", "Link-in-bio", "Analytics"],
    creditEstimate: 5,
  },
  "identity-verification": {
    shortDescription: "Verify voice and face, manage rights.",
    bestFor: ["Creators protecting their identity"],
    unlocks: ["Voice verification", "Face verification", "Rights management"],
    creditEstimate: 20,
  },
  "influencer-profile": {
    shortDescription: "Public influencer portfolio and media kit.",
    bestFor: ["Influencers seeking brand deals"],
    unlocks: ["Media kit", "Portfolio", "Brand outreach"],
    creditEstimate: 10,
  },

  // INTEGRATIONS
  "social-integrations": {
    shortDescription: "Connect social platforms for data sync.",
    bestFor: ["Multi-platform creators"],
    unlocks: ["Platform connections", "Data sync", "Analytics aggregation"],
    creditEstimate: 5,
  },
  "analytics-integrations": {
    shortDescription: "Third-party analytics tools.",
    bestFor: ["Data-driven creators"],
    unlocks: ["External analytics", "Custom dashboards", "Deep insights"],
    creditEstimate: 10,
  },
  "calendar-integrations": {
    shortDescription: "Sync with Google, Outlook, Apple Calendar.",
    bestFor: ["Busy creators with many events"],
    unlocks: ["Calendar sync", "Scheduling", "Time management"],
    creditEstimate: 5,
  },
};

export const getModuleTooltip = (moduleId: string): ModuleTooltipConfig | null => {
  return moduleTooltips[moduleId] || null;
};
