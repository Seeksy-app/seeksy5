/**
 * Module Recommendations Configuration
 * 
 * Defines which modules are RECOMMENDED (not auto-installed) when installing others.
 * This replaces the old moduleCompanions.ts auto-install behavior.
 * 
 * KEY PRINCIPLE: Installing a module ONLY installs that module.
 * Companions are SUGGESTED, never auto-added.
 */

import { LucideIcon, Scissors, Wand2, Image, Podcast, Mic, Zap, Users, Mail, Calendar, Vote, FormInput, Trophy, CheckSquare, FolderOpen, FileText, DollarSign, Shield, BrainCircuit, Building2 } from 'lucide-react';

export interface ModuleRecommendation {
  moduleId: string;
  moduleName: string;
  moduleIcon: LucideIcon;
  reason: string;
  isRequired?: boolean; // True only if the module literally cannot function without it
}

export interface ModuleRecommendationsConfig {
  moduleId: string;
  recommendations: ModuleRecommendation[];
}

/**
 * Icon mapping for quick lookup
 */
export const MODULE_ICON_MAP: Record<string, LucideIcon> = {
  'studio': Mic,
  'ai-clips': Scissors,
  'ai-post-production': Wand2,
  'media-library': Image,
  'podcasts': Podcast,
  'automations': Zap,
  'contacts': Users,
  'email': Mail,
  'newsletter': Mail,
  'meetings': Calendar,
  'events': Calendar,
  'polls': Vote,
  'forms': FormInput,
  'awards': Trophy,
  'tasks': CheckSquare,
  'projects': FolderOpen,
  'proposals': FileText,
  'deals': DollarSign,
  'identity-verification': Shield,
  'spark-ai': BrainCircuit,
  'crm': Building2,
};

/**
 * Module recommendations registry.
 * These are SUGGESTIONS shown after install, not auto-adds.
 */
export const MODULE_RECOMMENDATIONS: ModuleRecommendationsConfig[] = [
  {
    moduleId: 'studio',
    recommendations: [
      {
        moduleId: 'ai-clips',
        moduleName: 'AI Clips Generator',
        moduleIcon: Scissors,
        reason: 'Generate viral clips from your recordings',
      },
      {
        moduleId: 'ai-post-production',
        moduleName: 'AI Post-Production',
        moduleIcon: Wand2,
        reason: 'Auto-clean audio and remove filler words',
      },
      {
        moduleId: 'media-library',
        moduleName: 'Media Library',
        moduleIcon: Image,
        reason: 'Store and organize your recordings',
      },
    ],
  },
  {
    moduleId: 'podcasts',
    recommendations: [
      {
        moduleId: 'studio',
        moduleName: 'Studio & Recording',
        moduleIcon: Mic,
        reason: 'Record podcast episodes with guests',
      },
      {
        moduleId: 'ai-post-production',
        moduleName: 'AI Post-Production',
        moduleIcon: Wand2,
        reason: 'Enhance audio quality automatically',
      },
    ],
  },
  {
    moduleId: 'ai-clips',
    recommendations: [
      {
        moduleId: 'studio',
        moduleName: 'Studio & Recording',
        moduleIcon: Mic,
        reason: 'Record content to generate clips from',
      },
      {
        moduleId: 'media-library',
        moduleName: 'Media Library',
        moduleIcon: Image,
        reason: 'Store your generated clips',
      },
    ],
  },
  {
    moduleId: 'newsletter',
    recommendations: [
      {
        moduleId: 'contacts',
        moduleName: 'Contacts & Audience',
        moduleIcon: Users,
        reason: 'Manage your subscriber list',
      },
      {
        moduleId: 'automations',
        moduleName: 'Workflow Automations',
        moduleIcon: Zap,
        reason: 'Automate welcome sequences',
      },
    ],
  },
  {
    moduleId: 'email',
    recommendations: [
      {
        moduleId: 'contacts',
        moduleName: 'Contacts & Audience',
        moduleIcon: Users,
        reason: 'Access your contact list in email',
      },
    ],
  },
  {
    moduleId: 'events',
    recommendations: [
      {
        moduleId: 'forms',
        moduleName: 'Forms Builder',
        moduleIcon: FormInput,
        reason: 'Create registration forms for events',
      },
    ],
  },
  {
    moduleId: 'polls',
    recommendations: [
      {
        moduleId: 'forms',
        moduleName: 'Forms Builder',
        moduleIcon: FormInput,
        reason: 'Create detailed surveys alongside polls',
      },
    ],
  },
  {
    moduleId: 'meetings',
    recommendations: [
      {
        moduleId: 'studio',
        moduleName: 'Studio & Recording',
        moduleIcon: Mic,
        reason: 'Record your video meetings',
      },
    ],
  },
  {
    moduleId: 'crm',
    recommendations: [
      {
        moduleId: 'contacts',
        moduleName: 'Contacts & Audience',
        moduleIcon: Users,
        reason: 'Sync contacts with CRM',
      },
      {
        moduleId: 'deals',
        moduleName: 'Deals Pipeline',
        moduleIcon: DollarSign,
        reason: 'Track deals through your pipeline',
      },
      {
        moduleId: 'tasks',
        moduleName: 'Tasks & To-dos',
        moduleIcon: CheckSquare,
        reason: 'Create follow-up tasks for contacts',
      },
    ],
  },
  {
    moduleId: 'campaigns',
    recommendations: [
      {
        moduleId: 'email',
        moduleName: 'Inbox',
        moduleIcon: Mail,
        reason: 'Send campaign emails',
      },
      {
        moduleId: 'contacts',
        moduleName: 'Contacts & Audience',
        moduleIcon: Users,
        reason: 'Target your audience segments',
      },
    ],
  },
];

/**
 * Get recommendations for a module.
 * Returns empty array if no recommendations exist.
 */
export function getModuleRecommendations(moduleId: string): ModuleRecommendation[] {
  const config = MODULE_RECOMMENDATIONS.find(m => m.moduleId === moduleId);
  return config?.recommendations || [];
}

/**
 * Check if a module has any recommendations
 */
export function hasRecommendations(moduleId: string): boolean {
  return getModuleRecommendations(moduleId).length > 0;
}

/**
 * Filter recommendations to only show ones not already installed
 */
export function getUninstalledRecommendations(
  moduleId: string, 
  installedModuleIds: string[]
): ModuleRecommendation[] {
  const recommendations = getModuleRecommendations(moduleId);
  return recommendations.filter(r => !installedModuleIds.includes(r.moduleId));
}
