/**
 * Module Relationships Configuration
 * 
 * Defines dependencies and enhancements between modules.
 * - REQUIRED: Module won't work without these (auto-installed with explanation)
 * - ENHANCED: Module works alone but better with these (suggested, skippable)
 */

import { LucideIcon, Mic, Scissors, Podcast, Megaphone, Calendar, Users, Shield, BrainCircuit, Wand2, Image, Share2, CalendarClock, PieChart, Instagram } from "lucide-react";

export type RelationshipType = "required" | "enhanced";

export interface ModuleRelationship {
  moduleId: string;
  relatedModuleId: string;
  type: RelationshipType;
  reason: string;
}

export interface ModuleWithRelationships {
  id: string;
  name: string;
  icon: LucideIcon;
  category: "standalone" | "dependent" | "enhanced";
  required?: string[]; // Module IDs that are required
  enhancedBy?: string[]; // Module IDs that enhance this one
  enhances?: string[]; // Module IDs this enhances
}

// Intent-based suggestions for AI-guided onboarding
export interface UserIntent {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  suggestedModules: string[];
  workflow: string;
  color: string;
}

export const USER_INTENTS: UserIntent[] = [
  {
    id: "record-podcasts",
    label: "Record podcasts",
    description: "Create professional audio content",
    icon: Mic,
    suggestedModules: ["studio", "podcasts", "ai-post-production", "media-library"],
    workflow: "Record → Edit with AI → Publish → Distribute",
    color: "from-rose-500 to-pink-600",
  },
  {
    id: "grow-audience",
    label: "Grow my audience",
    description: "Build and engage your community",
    icon: PieChart,
    suggestedModules: ["social-connect", "social-analytics", "newsletter", "segments"],
    workflow: "Connect socials → Analyze → Segment → Nurture",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "create-clips",
    label: "Create viral clips",
    description: "Turn long content into shareable moments",
    icon: Scissors,
    suggestedModules: ["ai-clips", "studio", "media-library", "video-editor"],
    workflow: "Upload → AI detects moments → Edit → Share",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "host-events",
    label: "Host events & meetings",
    description: "Schedule, sell tickets, manage RSVPs",
    icon: Calendar,
    suggestedModules: ["events", "meetings", "forms", "automations"],
    workflow: "Create event → Sell tickets → Remind → Check-in",
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "manage-brand-deals",
    label: "Manage brand deals",
    description: "Track campaigns and revenue",
    icon: Megaphone,
    suggestedModules: ["campaigns", "deals", "proposals", "crm"],
    workflow: "Receive offer → Proposal → Track → Invoice",
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "build-identity",
    label: "Build my brand",
    description: "Verify identity and create landing page",
    icon: Shield,
    suggestedModules: ["my-page", "identity-verification", "social-connect"],
    workflow: "Verify → Build page → Connect socials → Share",
    color: "from-cyan-500 to-blue-600",
  },
];

// Module relationships for smart dependency handling
export const MODULE_RELATIONSHIPS: ModuleRelationship[] = [
  // Social Analytics REQUIRES Social Connect
  { moduleId: "social-analytics", relatedModuleId: "social-connect", type: "required", reason: "Needs connected social accounts to analyze" },
  { moduleId: "audience-insights", relatedModuleId: "social-connect", type: "required", reason: "Needs connected social accounts for insights" },
  
  // Studio is ENHANCED BY these
  { moduleId: "studio", relatedModuleId: "media-library", type: "enhanced", reason: "Store and organize your recordings" },
  { moduleId: "studio", relatedModuleId: "ai-post-production", type: "enhanced", reason: "Auto-remove filler words and pauses" },
  { moduleId: "studio", relatedModuleId: "ai-clips", type: "enhanced", reason: "Generate viral clips from recordings" },
  
  // Podcasts is ENHANCED BY these
  { moduleId: "podcasts", relatedModuleId: "studio", type: "enhanced", reason: "Record directly in Seeksy" },
  { moduleId: "podcasts", relatedModuleId: "ai-post-production", type: "enhanced", reason: "Polish audio before publishing" },
  
  // AI Clips is ENHANCED BY these
  { moduleId: "ai-clips", relatedModuleId: "studio", type: "enhanced", reason: "Record source content" },
  { moduleId: "ai-clips", relatedModuleId: "media-library", type: "enhanced", reason: "Import existing content" },
  
  // Campaigns is ENHANCED BY these
  { moduleId: "campaigns", relatedModuleId: "automations", type: "enhanced", reason: "Automate follow-ups and sequences" },
  { moduleId: "campaigns", relatedModuleId: "segments", type: "enhanced", reason: "Target specific audience groups" },
  { moduleId: "campaigns", relatedModuleId: "contacts", type: "enhanced", reason: "Manage your subscriber list" },
  
  // Newsletter is ENHANCED BY these
  { moduleId: "newsletter", relatedModuleId: "contacts", type: "enhanced", reason: "Manage subscribers" },
  { moduleId: "newsletter", relatedModuleId: "segments", type: "enhanced", reason: "Send targeted newsletters" },
  
  // Events is ENHANCED BY these
  { moduleId: "events", relatedModuleId: "forms", type: "enhanced", reason: "Custom registration forms" },
  { moduleId: "events", relatedModuleId: "automations", type: "enhanced", reason: "Automated reminders and follow-ups" },
  
  // CRM is ENHANCED BY these
  { moduleId: "crm", relatedModuleId: "deals", type: "enhanced", reason: "Track sales pipeline" },
  { moduleId: "crm", relatedModuleId: "proposals", type: "enhanced", reason: "Send professional proposals" },
  { moduleId: "crm", relatedModuleId: "tasks", type: "enhanced", reason: "Track follow-up tasks" },
];

/**
 * Get modules required by a given module
 */
export function getRequiredModules(moduleId: string): { moduleId: string; reason: string }[] {
  return MODULE_RELATIONSHIPS
    .filter(r => r.moduleId === moduleId && r.type === "required")
    .map(r => ({ moduleId: r.relatedModuleId, reason: r.reason }));
}

/**
 * Get modules that enhance a given module
 */
export function getEnhancingModules(moduleId: string): { moduleId: string; reason: string }[] {
  return MODULE_RELATIONSHIPS
    .filter(r => r.moduleId === moduleId && r.type === "enhanced")
    .map(r => ({ moduleId: r.relatedModuleId, reason: r.reason }));
}

/**
 * Get all modules in the dependency chain (module + required)
 */
export function getModulesWithDependencies(moduleId: string): string[] {
  const required = getRequiredModules(moduleId).map(r => r.moduleId);
  return [moduleId, ...required];
}

/**
 * Check if a module has any dependencies
 */
export function hasDependencies(moduleId: string): boolean {
  return getRequiredModules(moduleId).length > 0;
}

/**
 * Check if a module is enhanced by others
 */
export function hasEnhancements(moduleId: string): boolean {
  return getEnhancingModules(moduleId).length > 0;
}
