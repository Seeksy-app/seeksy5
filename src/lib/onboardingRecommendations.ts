// Recommendation Engine for Onboarding
import { MODULE_REGISTRY, RecommendedModule } from "@/components/onboarding/moduleRegistry";
import { RECOMMENDATION_RULES, GOAL_MODULE_MAP, OnboardingAnswers } from "@/config/onboardingQuestions";

export interface RecommendedModuleBundle {
  modules: RecommendedModule[];
  summary: string;
  dashboardType: string;
}

export function generateRecommendations(answers: OnboardingAnswers): RecommendedModuleBundle {
  const moduleIds = new Set<string>();
  const priorityMap = new Map<string, "core" | "recommended" | "optional">();

  // Apply creator type rules
  RECOMMENDATION_RULES.forEach((rule) => {
    if (rule.creatorTypes.includes(answers.creatorType)) {
      rule.modules.forEach((moduleId) => {
        moduleIds.add(moduleId);
        // Keep highest priority (core > recommended > optional)
        const existing = priorityMap.get(moduleId);
        if (!existing || getPriorityValue(rule.priority) < getPriorityValue(existing)) {
          priorityMap.set(moduleId, rule.priority);
        }
      });
    }
  });

  // Add goal-based modules
  const goalModules = GOAL_MODULE_MAP[answers.primaryGoal] || [];
  goalModules.forEach((moduleId) => {
    moduleIds.add(moduleId);
    if (!priorityMap.has(moduleId)) {
      priorityMap.set(moduleId, "recommended");
    }
  });

  // Add explicitly selected tools
  answers.tools.forEach((toolId) => {
    moduleIds.add(toolId);
    if (!priorityMap.has(toolId)) {
      priorityMap.set(toolId, "core");
    }
  });

  // Convert to module objects
  const modules = Array.from(moduleIds)
    .map((id) => {
      const base = MODULE_REGISTRY[id];
      if (!base) return null;
      return {
        ...base,
        priority: priorityMap.get(id) || base.priority,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const priorityOrder = { core: 0, recommended: 1, optional: 2 };
      return priorityOrder[a!.priority] - priorityOrder[b!.priority];
    }) as RecommendedModule[];

  // Determine dashboard type
  const dashboardType = mapCreatorTypeToDashboard(answers.creatorType);
  
  // Generate summary
  const summary = generateSummary(answers, modules.length);

  return { modules, summary, dashboardType };
}

function getPriorityValue(priority: "core" | "recommended" | "optional"): number {
  const values = { core: 0, recommended: 1, optional: 2 };
  return values[priority];
}

function mapCreatorTypeToDashboard(creatorType: string): string {
  const mapping: Record<string, string> = {
    podcaster: "podcaster",
    influencer: "creator",
    speaker: "creator",
    event_host: "event_host",
    entrepreneur: "business",
    agency: "agency",
    brand: "business",
  };
  return mapping[creatorType] || "creator";
}

function generateSummary(answers: OnboardingAnswers, moduleCount: number): string {
  const typeLabels: Record<string, string> = {
    podcaster: "podcaster",
    influencer: "influencer",
    speaker: "speaker & coach",
    event_host: "event host",
    entrepreneur: "entrepreneur",
    agency: "agency manager",
    brand: "brand representative",
  };
  
  return `Based on your profile as a ${typeLabels[answers.creatorType] || "creator"}, we've selected ${moduleCount} tools to help you get started.`;
}

// Dashboard preview configurations
export interface DashboardPreviewConfig {
  title: string;
  quickActions: { label: string; icon: string }[];
  panels: string[];
}

export const DASHBOARD_PREVIEWS: Record<string, DashboardPreviewConfig> = {
  podcaster: {
    title: "Podcaster Dashboard",
    quickActions: [
      { label: "Create Recording", icon: "Mic" },
      { label: "Upload Episode", icon: "Upload" },
      { label: "Invite Guest", icon: "UserPlus" },
    ],
    panels: ["Studio", "Podcasts", "Clips", "AI Tools", "Booking"],
  },
  creator: {
    title: "Creator Dashboard",
    quickActions: [
      { label: "Connect Accounts", icon: "Link" },
      { label: "View Analytics", icon: "BarChart" },
      { label: "Edit My Page", icon: "Layout" },
    ],
    panels: ["Social Analytics", "Monetization Hub", "Audience Insights", "Brand Campaigns"],
  },
  event_host: {
    title: "Event Host Dashboard",
    quickActions: [
      { label: "Create Event", icon: "Calendar" },
      { label: "Build Page", icon: "Layout" },
      { label: "Send Invite", icon: "Mail" },
    ],
    panels: ["Events", "Calendar", "Contacts", "Proposals"],
  },
  business: {
    title: "Business Dashboard",
    quickActions: [
      { label: "Add Contact", icon: "UserPlus" },
      { label: "Create Campaign", icon: "Megaphone" },
      { label: "Build Form", icon: "FileText" },
    ],
    panels: ["CRM", "Automations", "Email/SMS", "Forms", "My Page Builder"],
  },
  agency: {
    title: "Agency Dashboard",
    quickActions: [
      { label: "Add Creator", icon: "UserPlus" },
      { label: "Create Proposal", icon: "FileText" },
      { label: "View Analytics", icon: "BarChart" },
    ],
    panels: ["Campaigns", "Creator Hub", "Analytics"],
  },
};

export function getDashboardPreview(dashboardType: string): DashboardPreviewConfig {
  return DASHBOARD_PREVIEWS[dashboardType] || DASHBOARD_PREVIEWS.creator;
}
