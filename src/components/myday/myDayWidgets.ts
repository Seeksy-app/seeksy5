import { ComponentType } from "react";
import { 
  Shield, 
  Scissors, 
  Image, 
  Users, 
  Mail, 
  Calendar, 
  CheckSquare, 
  Bell, 
  Sparkles,
  Video,
  Mic,
  BarChart3,
  Zap,
  Layout,
} from "lucide-react";

/**
 * My Day Widget Definitions
 * 
 * CRITICAL: Every widget MUST have a `requiredModuleId` to link it to an installed module.
 * Widgets will ONLY appear if their required module is installed in the workspace.
 * 
 * There are NO "core" widgets - every widget requires a module.
 */

export interface MyDayWidget {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  section: string;
  defaultOrder: number;
  isHideable: boolean;
  minHeight?: string;
  /** 
   * REQUIRED: The module ID that must be installed for this widget to appear.
   * Every widget MUST have this set - no exceptions.
   */
  requiredModuleId: string;
  /**
   * If true, widget is visible by default when module is installed.
   * If false, user must manually enable in Customize.
   */
  defaultEnabled?: boolean;
}

export interface MyDaySection {
  id: string;
  title: string;
  defaultOrder: number;
  icon: ComponentType<{ className?: string }>;
  /**
   * REQUIRED: Modules that must be installed for this section to appear.
   */
  requiredModuleIds: string[];
}

// Section definitions - sections ONLY appear if at least one required module is installed
export const MY_DAY_SECTIONS: MyDaySection[] = [
  { 
    id: "identity-rights", 
    title: "Identity & Rights", 
    defaultOrder: 0, 
    icon: Shield,
    requiredModuleIds: ["identity-verification", "identity"],
  },
  { 
    id: "media-content", 
    title: "Media & Content", 
    defaultOrder: 1, 
    icon: Video,
    requiredModuleIds: ["media-library", "studio", "podcasts", "ai-clips"],
  },
  { 
    id: "email-engagement", 
    title: "Email & Engagement", 
    defaultOrder: 2, 
    icon: Mail,
    requiredModuleIds: ["newsletter", "email", "campaigns"],
  },
  { 
    id: "todays-focus", 
    title: "Today's Focus", 
    defaultOrder: 3, 
    icon: Zap,
    requiredModuleIds: ["email", "meetings", "tasks"],
  },
  { 
    id: "schedule-tasks", 
    title: "Schedule & Tasks", 
    defaultOrder: 4, 
    icon: Calendar,
    requiredModuleIds: ["meetings", "tasks", "events"],
  },
];

// Widget registry with required module linkage
export const MY_DAY_WIDGETS: MyDayWidget[] = [
  // Identity & Rights - requires identity module
  { 
    id: "identity-status", 
    title: "Identity Status", 
    icon: Shield, 
    section: "identity-rights", 
    defaultOrder: 0, 
    isHideable: true,
    requiredModuleId: "identity-verification",
    defaultEnabled: true,
  },
  { 
    id: "certified-clips", 
    title: "Certified Clips", 
    icon: Scissors, 
    section: "identity-rights", 
    defaultOrder: 1, 
    isHideable: true,
    requiredModuleId: "identity-verification",
    defaultEnabled: true,
  },
  { 
    id: "advertiser-access", 
    title: "Advertiser Access", 
    icon: Users, 
    section: "identity-rights", 
    defaultOrder: 2, 
    isHideable: true,
    requiredModuleId: "identity-verification",
    defaultEnabled: false,
  },

  // Media & Content - requires media modules
  { 
    id: "media-vault", 
    title: "Media Vault", 
    icon: Image, 
    section: "media-content", 
    defaultOrder: 0, 
    isHideable: true,
    requiredModuleId: "media-library",
    defaultEnabled: true,
  },
  { 
    id: "podcasts", 
    title: "Podcasts", 
    icon: Mic, 
    section: "media-content", 
    defaultOrder: 1, 
    isHideable: true,
    requiredModuleId: "podcasts",
    defaultEnabled: true,
  },
  { 
    id: "media-files", 
    title: "Media Files", 
    icon: Video, 
    section: "media-content", 
    defaultOrder: 2, 
    isHideable: true,
    requiredModuleId: "studio",
    defaultEnabled: true,
  },
  { 
    id: "page-analytics", 
    title: "Page Analytics", 
    icon: BarChart3, 
    section: "media-content", 
    defaultOrder: 3, 
    isHideable: true,
    requiredModuleId: "my-page",
    defaultEnabled: false,
  },

  // Email & Engagement - requires email/newsletter modules
  { 
    id: "emails-sent", 
    title: "Emails Sent", 
    icon: Mail, 
    section: "email-engagement", 
    defaultOrder: 0, 
    isHideable: true,
    requiredModuleId: "newsletter",
    defaultEnabled: true,
  },
  { 
    id: "emails-opened", 
    title: "Emails Opened", 
    icon: Mail, 
    section: "email-engagement", 
    defaultOrder: 1, 
    isHideable: true,
    requiredModuleId: "newsletter",
    defaultEnabled: true,
  },
  { 
    id: "email-clicks", 
    title: "Email Clicks", 
    icon: Mail, 
    section: "email-engagement", 
    defaultOrder: 2, 
    isHideable: true,
    requiredModuleId: "newsletter",
    defaultEnabled: true,
  },

  // Today's Focus - core widgets, always available but some require modules
  { 
    id: "unread-emails", 
    title: "Emails", 
    icon: Mail, 
    section: "todays-focus", 
    defaultOrder: 0, 
    isHideable: false,
    requiredModuleId: "email",
    defaultEnabled: true,
  },
  { 
    id: "meetings-today", 
    title: "Meetings", 
    icon: Calendar, 
    section: "todays-focus", 
    defaultOrder: 1, 
    isHideable: false,
    requiredModuleId: "meetings",
    defaultEnabled: true,
  },
  { 
    id: "tasks-due", 
    title: "Tasks", 
    icon: CheckSquare, 
    section: "todays-focus", 
    defaultOrder: 2, 
    isHideable: false,
    requiredModuleId: "tasks",
    defaultEnabled: true,
  },

  // Schedule & Tasks - requires scheduling modules
  { 
    id: "upcoming-meetings", 
    title: "Upcoming Meetings", 
    icon: Calendar, 
    section: "schedule-tasks", 
    defaultOrder: 0, 
    isHideable: true, 
    minHeight: "200px",
    requiredModuleId: "meetings",
    defaultEnabled: true,
  },
  { 
    id: "todays-tasks", 
    title: "Today's Key Tasks", 
    icon: CheckSquare, 
    section: "schedule-tasks", 
    defaultOrder: 1, 
    isHideable: true, 
    minHeight: "200px",
    requiredModuleId: "tasks",
    defaultEnabled: true,
  },

  // Quick Create - these require specific modules and are NOT default-enabled
  // Moved to a hidden section that users must explicitly enable
  { 
    id: "create-clip", 
    title: "Create Clip", 
    icon: Scissors, 
    section: "quick-actions", 
    defaultOrder: 0, 
    isHideable: true,
    requiredModuleId: "ai-clips",
    defaultEnabled: false,
  },
  { 
    id: "upload-media", 
    title: "Upload Media", 
    icon: Image, 
    section: "quick-actions", 
    defaultOrder: 1, 
    isHideable: true,
    requiredModuleId: "media-library",
    defaultEnabled: false,
  },
  { 
    id: "verify-face", 
    title: "Verify Face", 
    icon: Shield, 
    section: "quick-actions", 
    defaultOrder: 2, 
    isHideable: true,
    requiredModuleId: "identity-verification",
    defaultEnabled: false,
  },
  { 
    id: "verify-voice", 
    title: "Verify Voice", 
    icon: Mic, 
    section: "quick-actions", 
    defaultOrder: 3, 
    isHideable: true,
    requiredModuleId: "identity-verification",
    defaultEnabled: false,
  },
  { 
    id: "book-mia", 
    title: "Book with Mia", 
    icon: Calendar, 
    section: "quick-actions", 
    defaultOrder: 4, 
    isHideable: true,
    requiredModuleId: "meetings",
    defaultEnabled: false,
  },
];

export interface LayoutConfig {
  sectionOrder: string[];
  widgetOrder: Record<string, string[]>;
  hiddenWidgets: string[];
}

/**
 * Get the default layout filtered by installed modules.
 * This is the NEW function that should be used instead of DEFAULT_LAYOUT.
 * 
 * CRITICAL: If no modules are installed, returns empty layout.
 * 
 * @param installedModuleIds - Array of module IDs installed in the workspace
 */
export function getFilteredDefaultLayout(installedModuleIds: string[]): LayoutConfig {
  // If no modules installed, return completely empty layout
  if (!installedModuleIds || installedModuleIds.length === 0) {
    return {
      sectionOrder: [],
      widgetOrder: {},
      hiddenWidgets: [],
    };
  }

  // Filter widgets to only those whose required module is installed
  // NO core widgets - every widget MUST have requiredModuleId
  const availableWidgets = MY_DAY_WIDGETS.filter(widget => {
    return installedModuleIds.includes(widget.requiredModuleId);
  });

  // Filter sections to only those with at least one available widget AND required modules installed
  const sectionIdsWithWidgets = new Set(availableWidgets.map(w => w.section));
  const availableSections = MY_DAY_SECTIONS.filter(section => {
    // Section MUST have at least one of its required modules installed
    const hasRequiredModule = section.requiredModuleIds.some(
      id => installedModuleIds.includes(id)
    );
    if (!hasRequiredModule) return false;
    // Section must have at least one widget
    return sectionIdsWithWidgets.has(section.id);
  });

  // Build section order
  const sectionOrder = availableSections
    .sort((a, b) => a.defaultOrder - b.defaultOrder)
    .map(s => s.id);

  // Build widget order per section
  const widgetOrder: Record<string, string[]> = {};
  for (const section of availableSections) {
    widgetOrder[section.id] = availableWidgets
      .filter(w => w.section === section.id)
      .sort((a, b) => a.defaultOrder - b.defaultOrder)
      .map(w => w.id);
  }

  // Hidden widgets: those that are available but defaultEnabled is false
  const hiddenWidgets = availableWidgets
    .filter(w => w.defaultEnabled === false)
    .map(w => w.id);

  return {
    sectionOrder,
    widgetOrder,
    hiddenWidgets,
  };
}

/**
 * Get widgets available for the Customize modal based on installed modules.
 * Returns ONLY widgets whose required module is installed.
 */
export function getAvailableWidgetsForCustomize(installedModuleIds: string[]): MyDayWidget[] {
  if (!installedModuleIds || installedModuleIds.length === 0) {
    return [];
  }
  return MY_DAY_WIDGETS.filter(widget => {
    return installedModuleIds.includes(widget.requiredModuleId);
  });
}

/**
 * Get sections that have at least one available widget.
 * Returns ONLY sections whose required modules are installed.
 */
export function getAvailableSections(installedModuleIds: string[]): MyDaySection[] {
  if (!installedModuleIds || installedModuleIds.length === 0) {
    return [];
  }
  
  const availableWidgets = getAvailableWidgetsForCustomize(installedModuleIds);
  const sectionIdsWithWidgets = new Set(availableWidgets.map(w => w.section));
  
  return MY_DAY_SECTIONS.filter(section => {
    // Check if any required module is installed
    const hasRequiredModule = section.requiredModuleIds.some(
      id => installedModuleIds.includes(id)
    );
    if (!hasRequiredModule) return false;
    return sectionIdsWithWidgets.has(section.id);
  });
}

/**
 * Legacy DEFAULT_LAYOUT - DEPRECATED
 * Use getFilteredDefaultLayout(installedModuleIds) instead.
 * This is kept for backward compatibility but shows minimal content.
 */
export const DEFAULT_LAYOUT: LayoutConfig = {
  sectionOrder: ["todays-focus"],
  widgetOrder: {
    "todays-focus": ["alerts"],
  },
  hiddenWidgets: [],
};
