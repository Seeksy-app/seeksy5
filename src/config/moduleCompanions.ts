/**
 * Module Companion Configuration
 * 
 * Defines which modules should be auto-activated together.
 * When a main module is activated, its companions are also activated.
 */

export interface ModuleCompanion {
  moduleId: string;
  companions: string[];
  description?: string;
}

export const MODULE_COMPANIONS: ModuleCompanion[] = [
  {
    moduleId: 'social-analytics',
    companions: ['social-connect'],
    description: 'Social Analytics requires Social Connect for data'
  },
  {
    moduleId: 'podcasts',
    companions: ['studio', 'content-library'],
    description: 'Podcasts work best with Studio and Content Library'
  },
  {
    moduleId: 'studio',
    companions: ['content-library'],
    description: 'Studio recordings are stored in Content Library'
  },
  {
    moduleId: 'brand-campaigns',
    companions: ['revenue-tracking'],
    description: 'Brand Campaigns integrates with Revenue Tracking'
  },
  {
    moduleId: 'meetings',
    companions: [],
    description: 'Meetings is standalone'
  },
];

/**
 * Get companion modules for a given module ID
 */
export function getModuleCompanions(moduleId: string): string[] {
  const config = MODULE_COMPANIONS.find(m => m.moduleId === moduleId);
  return config?.companions || [];
}

/**
 * Get all modules that should be activated when activating a module
 * (includes the module itself and all companions)
 */
export function getAllModulesToActivate(moduleId: string): string[] {
  const companions = getModuleCompanions(moduleId);
  return [moduleId, ...companions];
}
