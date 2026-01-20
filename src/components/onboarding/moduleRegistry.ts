// Module Registry for Onboarding Recommendations
// Maps user choices to recommended modules

export interface RecommendedModule {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: "core" | "recommended" | "optional";
}

export const MODULE_REGISTRY: Record<string, RecommendedModule> = {
  "social-connect": {
    id: "social-connect",
    name: "Social Connect",
    description: "Connect Instagram, YouTube, TikTok, Facebook",
    category: "creator",
    priority: "core",
  },
  "audience-insights": {
    id: "audience-insights",
    name: "Audience Insights",
    description: "Deep analytics on followers & engagement",
    category: "creator",
    priority: "core",
  },
  "studio": {
    id: "studio",
    name: "Studio & Recording",
    description: "Record podcasts, videos, livestreams",
    category: "media",
    priority: "core",
  },
  "podcasts": {
    id: "podcasts",
    name: "Podcasts",
    description: "Podcast hosting + RSS distribution",
    category: "media",
    priority: "core",
  },
  "media-library": {
    id: "media-library",
    name: "Media Library",
    description: "Store audio, video, images",
    category: "media",
    priority: "core",
  },
  "contacts": {
    id: "contacts",
    name: "Contacts & Audience",
    description: "Manage contacts, leads, subscribers",
    category: "marketing",
    priority: "core",
  },
  "campaigns": {
    id: "campaigns",
    name: "Campaigns",
    description: "Multi-channel marketing campaigns",
    category: "marketing",
    priority: "recommended",
  },
  "segments": {
    id: "segments",
    name: "Segments",
    description: "Create targeted audience segments",
    category: "marketing",
    priority: "recommended",
  },
  "email": {
    id: "email",
    name: "Email",
    description: "Full email inbox with multi-account support",
    category: "marketing",
    priority: "core",
  },
  "email-templates": {
    id: "email-templates",
    name: "Email Templates",
    description: "Design reusable email templates",
    category: "marketing",
    priority: "recommended",
  },
  "automations": {
    id: "automations",
    name: "Automations",
    description: "Automated workflows and sequences",
    category: "marketing",
    priority: "optional",
  },
  "sms": {
    id: "sms",
    name: "SMS",
    description: "Text messaging and campaigns",
    category: "marketing",
    priority: "optional",
  },
  "forms": {
    id: "forms",
    name: "Forms",
    description: "Build forms and collect submissions",
    category: "marketing",
    priority: "recommended",
  },
  "monetization-hub": {
    id: "monetization-hub",
    name: "Monetization Hub",
    description: "Manage revenue and campaigns",
    category: "monetization",
    priority: "core",
  },
  "my-page": {
    id: "my-page",
    name: "My Page Builder",
    description: "Build your personal landing page",
    category: "identity",
    priority: "core",
  },
  "identity": {
    id: "identity",
    name: "Identity & Verification",
    description: "Verify voice and face, manage rights",
    category: "identity",
    priority: "recommended",
  },
  "guest-appearances": {
    id: "guest-appearances",
    name: "Guest Appearances",
    description: "Track and verify your podcast/video guest appearances",
    category: "identity",
    priority: "recommended",
  },
  "proposals": {
    id: "proposals",
    name: "Proposals",
    description: "Create professional proposals",
    category: "business",
    priority: "recommended",
  },
  "tasks": {
    id: "tasks",
    name: "Tasks",
    description: "Manage tasks and projects",
    category: "business",
    priority: "optional",
  },
  "project-management": {
    id: "project-management",
    name: "Project Management",
    description: "Tasks, tickets, leads, and documents",
    category: "business",
    priority: "recommended",
  },
  "events": {
    id: "events",
    name: "Events",
    description: "Create events and manage RSVPs",
    category: "business",
    priority: "core",
  },
  "polls": {
    id: "polls",
    name: "Polls & Surveys",
    description: "Collect audience feedback",
    category: "business",
    priority: "optional",
  },
  "team": {
    id: "team",
    name: "Team & Collaboration",
    description: "Manage team members",
    category: "business",
    priority: "recommended",
  },
  "analytics": {
    id: "analytics",
    name: "Analytics & Insights",
    description: "Track performance metrics",
    category: "analytics",
    priority: "recommended",
  },
  "social-integrations": {
    id: "social-integrations",
    name: "Social Integrations",
    description: "Connect social platforms",
    category: "integrations",
    priority: "core",
  },
  "email-signatures": {
    id: "email-signatures",
    name: "Settings",
    description: "Email settings, signatures, and tracking configuration",
    category: "marketing",
    priority: "recommended",
  },
};

// User type to module mapping
export const USER_TYPE_MODULES: Record<string, string[]> = {
  creator: ["social-connect", "audience-insights", "my-page", "monetization-hub", "contacts"],
  business: ["contacts", "segments", "campaigns", "email-templates", "forms", "events"],
  event_host: ["events", "contacts", "forms", "email-templates", "campaigns"],
  agency: ["team", "proposals", "contacts", "analytics", "automations"],
  podcaster: ["studio", "podcasts", "media-library", "my-page", "monetization-hub"],
};

// Goals to module mapping
export const GOAL_MODULES: Record<string, string[]> = {
  social_analytics: ["social-connect", "audience-insights", "analytics"],
  grow_audience: ["campaigns", "automations", "social-connect", "my-page"],
  scheduling: ["events", "forms", "contacts"],
  marketing: ["campaigns", "email-templates", "segments", "automations", "sms"],
  podcasting: ["studio", "podcasts", "media-library"],
  public_page: ["my-page", "identity"],
  monetization: ["monetization-hub", "proposals", "contacts"],
  manage_clients: ["team", "contacts", "proposals", "analytics"],
};

// Platform to module mapping
export const PLATFORM_MODULES: Record<string, string[]> = {
  instagram: ["social-connect", "social-integrations"],
  youtube: ["social-connect", "social-integrations", "studio"],
  tiktok: ["social-connect", "social-integrations"],
  facebook: ["social-connect", "social-integrations"],
  spotify_podcast: ["podcasts", "studio"],
  apple_podcast: ["podcasts", "studio"],
  website: ["my-page", "forms"],
  starting_fresh: ["my-page", "contacts"],
};

// Content focus to module mapping
export const CONTENT_MODULES: Record<string, string[]> = {
  educational: ["podcasts", "studio", "my-page"],
  entertainment: ["studio", "social-connect", "my-page"],
  lifestyle: ["social-connect", "my-page", "campaigns"],
  business: ["proposals", "contacts", "campaigns", "forms"],
  podcasting: ["studio", "podcasts", "media-library"],
  video: ["studio", "media-library", "social-connect"],
  events: ["events", "forms", "contacts"],
  brand: ["campaigns", "contacts", "email-templates", "analytics"],
};

// Monetization to module mapping
export const MONETIZATION_MODULES: Record<string, string[]> = {
  brand_partnerships: ["monetization-hub", "proposals", "contacts", "my-page"],
  digital_products: ["monetization-hub", "my-page", "forms"],
  podcast_sponsorship: ["podcasts", "monetization-hub", "studio"],
  ticket_sales: ["events", "forms", "contacts"],
  subscribers: ["my-page", "campaigns", "contacts", "automations"],
  not_monetizing: ["my-page", "contacts"],
};

export function generateStarterStack(
  userType: string,
  goals: string[],
  platforms: string[],
  contentFocus: string[],
  monetization: string
): RecommendedModule[] {
  const moduleIds = new Set<string>();

  // Add user type modules
  USER_TYPE_MODULES[userType]?.forEach((id) => moduleIds.add(id));

  // Add goal modules
  goals.forEach((goal) => {
    GOAL_MODULES[goal]?.forEach((id) => moduleIds.add(id));
  });

  // Add platform modules
  platforms.forEach((platform) => {
    PLATFORM_MODULES[platform]?.forEach((id) => moduleIds.add(id));
  });

  // Add content modules
  contentFocus.forEach((content) => {
    CONTENT_MODULES[content]?.forEach((id) => moduleIds.add(id));
  });

  // Add monetization modules
  MONETIZATION_MODULES[monetization]?.forEach((id) => moduleIds.add(id));

  // Convert to module objects and sort by priority
  const modules = Array.from(moduleIds)
    .map((id) => MODULE_REGISTRY[id])
    .filter(Boolean)
    .sort((a, b) => {
      const priorityOrder = { core: 0, recommended: 1, optional: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  return modules;
}
