/**
 * Maps onboarding focus selections to Seeksy module IDs and workspace names.
 * 
 * This is the SINGLE SOURCE OF TRUTH for what modules get installed
 * based on user onboarding choices.
 */

export interface OnboardingSeeksyConfig {
  workspaceName: string;
  moduleIds: string[];
}

/**
 * Maps manageFocus selection from onboarding to workspace name and module IDs.
 */
export function getSeeksyConfigForFocus(manageFocus: string | null): OnboardingSeeksyConfig {
  switch (manageFocus) {
    case 'Podcasting':
      return {
        workspaceName: 'Podcast Studio',
        moduleIds: ['podcast-hosting', 'studio-recording', 'ai-clips', 'podcast-analytics'],
      };
    case 'Content Creation':
      return {
        workspaceName: 'Creator Workspace',
        moduleIds: ['studio-recording', 'ai-clips', 'media-library', 'social-publisher'],
      };
    case 'Events & Meetings':
      return {
        workspaceName: 'Events & Meetings',
        moduleIds: ['meetings', 'events', 'calendar-sync', 'crm'],
      };
    case 'Marketing & CRM':
      return {
        workspaceName: 'Marketing Hub',
        moduleIds: ['crm', 'newsletter', 'email-campaigns', 'audience'],
      };
    case 'Monetization':
      return {
        workspaceName: 'Monetization',
        moduleIds: ['proposals', 'invoices', 'crm', 'deals'],
      };
    case 'Analytics':
      return {
        workspaceName: 'Analytics Hub',
        moduleIds: ['social-analytics', 'audience-insights', 'podcast-analytics'],
      };
    case 'Social Media':
      return {
        workspaceName: 'Social Hub',
        moduleIds: ['social-connect', 'ai-clips', 'social-publisher', 'social-analytics'],
      };
    case 'Team Collaboration':
      return {
        workspaceName: 'Team Workspace',
        moduleIds: ['meetings', 'tasks', 'project-management', 'team-chat'],
      };
    default:
      // Default for "Other" or unspecified
      return {
        workspaceName: 'My Workspace',
        moduleIds: ['my-page', 'meetings', 'events'],
      };
  }
}

/**
 * Get a list of commonly recognized module IDs that definitely exist.
 * Used to filter out any non-existent modules.
 */
export const KNOWN_MODULE_IDS = new Set([
  'my-page',
  'meetings',
  'events',
  'crm',
  'newsletter',
  'ai-clips',
  'studio-recording',
  'podcast-hosting',
  'social-connect',
  'social-analytics',
  'audience',
  'tasks',
  'proposals',
  'polls',
  'forms',
  'media-library',
  'blog',
  'identity',
]);

/**
 * Filter module IDs to only include known valid modules.
 */
export function filterValidModuleIds(moduleIds: string[]): string[] {
  return moduleIds.filter(id => KNOWN_MODULE_IDS.has(id));
}
