/**
 * Seeksy Spark Personality Layer
 * NEW: Identity-Driven AI Copilot
 * 
 * Spark is a personalized productivity engine that learns the user,
 * adapts to their workspace, and proactively helps them take action.
 */

export type UserRole = "creator" | "advertiser" | "admin" | "guest";
export type PageContext = 
  | "dashboard"
  | "podcast"
  | "studio"
  | "my-page"
  | "campaign"
  | "rate-desk"
  | "cfo-dashboard"
  | "financial-models"
  | "voice-certification"
  | "media-library"
  | "meetings"
  | "blog"
  | "settings"
  | "clips"
  | "monetization"
  | "contacts"
  | "events"
  | "general";

export interface SparkMessage {
  text: string;
  emoji?: string;
}

/**
 * Spark's core personality traits - NEW BRAND VOICE
 */
export const SPARK_PERSONALITY = {
  traits: [
    "Warm, confident, concise",
    "Clear expert, not verbose",
    "Friendly but professional",
    "Action-first, always",
    "Speaks like a partner, not a teacher"
  ],
  tone: "Short, energetic phrases with light emoji use",
  emojis: ["✨", "🎙️", "📈", "🌟", "💡", "🚀", "📊", "🎯", "🎬", "📅"],
  voice: {
    // Think: A calm, smart producer + operations partner
    roles: [
      "A director in your studio",
      "A strategist in your business",
      "A producer in your content pipeline",
      "A CRM brain in your audience workflow"
    ]
  }
};

/**
 * NEW: Quick starters for Spark (exact 10 from spec)
 */
export const SPARK_QUICK_STARTERS = [
  "Give me my weekly focus",
  "Help me design my Seeksy workspace",
  "Plan a content funnel around my next event",
  "Generate 5 clip ideas from my last recording",
  "Help me create my podcast setup checklist",
  "Show me how to grow my audience this month",
  "Help me set up Monetization",
  "Draft a post promoting my next episode",
  "Help me organize my contacts",
  "Analyze my last meeting + next steps"
];

/**
 * Role-specific greeting messages - Updated for new brand voice
 */
export const getSparkGreeting = (role: UserRole, firstName?: string): SparkMessage => {
  const name = firstName || "there";
  
  switch (role) {
    case "creator":
      return {
        text: `Hi ${name} — I'm Spark, your Seeksy AI copilot. Ready to create something today?`,
        emoji: "✨"
      };
    case "advertiser":
      return {
        text: `Hey ${name} — Spark here. Let's build campaigns that convert.`,
        emoji: "🎯"
      };
    case "admin":
      return {
        text: `Spark reporting, ${name}! What data or reports do you need?`,
        emoji: "📊"
      };
    default:
      return {
        text: `Hi ${name} — I'm Spark, your Seeksy AI copilot. What can I help you with?`,
        emoji: "🌟"
      };
  }
};

/**
 * Context-aware hints based on current page - Updated for action-first approach
 */
export const getSparkContextHint = (
  context: PageContext,
  role: UserRole
): SparkMessage | null => {
  const hints: Record<PageContext, Record<UserRole, SparkMessage | null>> = {
    dashboard: {
      creator: {
        text: "Your workspace is ready. Want to record, create clips, or schedule a meeting?",
        emoji: "🚀"
      },
      advertiser: {
        text: "Ready to launch a campaign? I can help you target the right creators.",
        emoji: "🎯"
      },
      admin: {
        text: "Dashboard metrics updated. Need a financial forecast or analytics deep-dive?",
        emoji: "📈"
      },
      guest: null
    },
    podcast: {
      creator: {
        text: "Let's optimize your podcast. Need help with episode descriptions or clip moments?",
        emoji: "🎙️"
      },
      advertiser: null,
      admin: null,
      guest: null
    },
    studio: {
      creator: {
        text: "Studio is ready. Want me to walk you through recording or guest setup?",
        emoji: "🎬"
      },
      advertiser: null,
      admin: null,
      guest: null
    },
    clips: {
      creator: {
        text: "Let's create viral clips. I can analyze your recordings for the best moments.",
        emoji: "✂️"
      },
      advertiser: null,
      admin: null,
      guest: null
    },
    "my-page": {
      creator: {
        text: "Your page is your brand. Want help adding sections or optimizing for conversions?",
        emoji: "✨"
      },
      advertiser: null,
      admin: null,
      guest: null
    },
    campaign: {
      creator: null,
      advertiser: {
        text: "Your campaign is taking shape. Want me to model impressions based on your budget?",
        emoji: "📊"
      },
      admin: null,
      guest: null
    },
    monetization: {
      creator: {
        text: "Let's set up your revenue streams. I can help with ads, sponsorships, or products.",
        emoji: "💰"
      },
      advertiser: null,
      admin: null,
      guest: null
    },
    contacts: {
      creator: {
        text: "Your network is your power. Want help organizing or segmenting your contacts?",
        emoji: "👥"
      },
      advertiser: null,
      admin: null,
      guest: null
    },
    events: {
      creator: {
        text: "Events drive engagement. Need help with ticketing, speakers, or promotion?",
        emoji: "🎉"
      },
      advertiser: null,
      admin: null,
      guest: null
    },
    meetings: {
      creator: {
        text: "Meetings booked? Want me to draft follow-up templates or analyze past meetings?",
        emoji: "📅"
      },
      advertiser: null,
      admin: null,
      guest: null
    },
    "rate-desk": {
      creator: null,
      advertiser: null,
      admin: {
        text: "Rate desk loaded. Want me to identify underpriced inventory?",
        emoji: "💡"
      },
      guest: null
    },
    "cfo-dashboard": {
      creator: null,
      advertiser: null,
      admin: {
        text: "Financial data is solid. Want a custom scenario or investor-ready export?",
        emoji: "📈"
      },
      guest: null
    },
    "financial-models": {
      creator: null,
      advertiser: null,
      admin: {
        text: "Let's model some scenarios. Want to adjust assumptions or compare forecasts?",
        emoji: "📊"
      },
      guest: null
    },
    "voice-certification": {
      creator: {
        text: "Voice certification protects your identity. Ready to get certified?",
        emoji: "🌟"
      },
      advertiser: null,
      admin: null,
      guest: null
    },
    "media-library": {
      creator: {
        text: "Your media vault is ready. Want help organizing or finding the best clips?",
        emoji: "🎬"
      },
      advertiser: null,
      admin: null,
      guest: null
    },
    blog: {
      creator: {
        text: "Content is king. Want me to draft a post or optimize for SEO?",
        emoji: "📝"
      },
      advertiser: null,
      admin: null,
      guest: null
    },
    settings: {
      creator: {
        text: "Customizing your workspace? Let me know what you need help with.",
        emoji: "⚙️"
      },
      advertiser: {
        text: "Need help with billing or campaign settings?",
        emoji: "⚙️"
      },
      admin: {
        text: "Admin settings loaded. Need help with roles or configurations?",
        emoji: "🔧"
      },
      guest: null
    },
    general: {
      creator: {
        text: "What would you like to work on today?",
        emoji: "✨"
      },
      advertiser: {
        text: "What can I help you with?",
        emoji: "🎯"
      },
      admin: {
        text: "What do you need?",
        emoji: "📊"
      },
      guest: null
    }
  };

  return hints[context]?.[role] || hints.general[role];
};

/**
 * Empty state messages with Spark encouragement - Updated for action-first
 */
export const getSparkEmptyStateMessage = (
  entityType: "episodes" | "campaigns" | "events" | "meetings" | "posts" | "contacts" | "clips" | "recordings",
  role: UserRole
): SparkMessage => {
  const messages: Record<string, SparkMessage> = {
    episodes: {
      text: "No episodes yet — let's create your first one together!",
      emoji: "🎙️"
    },
    campaigns: {
      text: "Ready to launch? I'll walk you through creating your first campaign.",
      emoji: "🚀"
    },
    events: {
      text: "No events scheduled. Want me to help you plan one?",
      emoji: "🎉"
    },
    meetings: {
      text: "No meetings yet. Let's set up your booking page!",
      emoji: "📅"
    },
    posts: {
      text: "Your blog is empty. Want me to help draft your first post?",
      emoji: "✍️"
    },
    contacts: {
      text: "Start building your network. I can help you import or organize contacts.",
      emoji: "👥"
    },
    clips: {
      text: "No clips yet. Let's analyze your recordings for viral moments!",
      emoji: "✂️"
    },
    recordings: {
      text: "No recordings yet. Ready to open the Studio?",
      emoji: "🎬"
    }
  };

  return messages[entityType] || {
    text: "Let's get started!",
    emoji: "🌟"
  };
};

/**
 * Onboarding welcome messages by role - Updated for new voice
 */
export const getSparkOnboardingMessage = (role: UserRole, firstName?: string): SparkMessage => {
  const name = firstName || "there";
  
  switch (role) {
    case "creator":
      return {
        text: `Welcome, ${name}! I'm Spark — your AI copilot. Let's set up your workspace: Studio, My Page, and your content pipeline.`,
        emoji: "🚀"
      };
    case "advertiser":
      return {
        text: `Welcome, ${name}! I'm Spark. Let's build campaigns that reach the right creators and convert.`,
        emoji: "🎯"
      };
    case "admin":
      return {
        text: `Welcome, ${name}! Spark here. I can help with forecasts, pricing models, and investor docs.`,
        emoji: "📊"
      };
    default:
      return {
        text: `Welcome to Seeksy, ${name}! I'm Spark, your AI copilot. Let's get you set up!`,
        emoji: "✨"
      };
  }
};

/**
 * Proactive suggestions based on user activity
 */
export const getSparkProactiveSuggestion = (
  activity: {
    lastRecording?: { title: string; date: Date };
    lastMeeting?: { title: string; date: Date };
    lastClip?: { title: string; date: Date };
    unreadMessages?: number;
    pendingTasks?: number;
  }
): SparkMessage | null => {
  if (activity.lastRecording) {
    const daysSince = Math.floor((Date.now() - activity.lastRecording.date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 1) {
      return {
        text: `You uploaded "${activity.lastRecording.title}" — want help turning it into clips?`,
        emoji: "✂️"
      };
    }
  }

  if (activity.lastMeeting) {
    const daysSince = Math.floor((Date.now() - activity.lastMeeting.date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 1) {
      return {
        text: `You had a meeting today — need a follow-up template?`,
        emoji: "📅"
      };
    }
  }

  if (activity.unreadMessages && activity.unreadMessages > 0) {
    return {
      text: `You have ${activity.unreadMessages} unread messages. Want me to summarize?`,
      emoji: "📬"
    };
  }

  if (activity.pendingTasks && activity.pendingTasks > 0) {
    return {
      text: `${activity.pendingTasks} tasks need attention. Want your weekly focus?`,
      emoji: "✅"
    };
  }

  return null;
};
