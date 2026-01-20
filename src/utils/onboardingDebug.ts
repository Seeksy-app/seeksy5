/**
 * Debugging utilities for onboarding and module installation.
 * 
 * These utilities output logs prefixed with [Seeksy Debug] for easy filtering.
 * Enable/disable via localStorage: localStorage.setItem('seeksy_debug', 'true')
 */

const DEBUG_KEY = 'seeksy_debug';

/**
 * Check if debug mode is enabled.
 */
export function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DEBUG_KEY) === 'true' || 
         process.env.NODE_ENV === 'development';
}

/**
 * Enable debug mode.
 */
export function enableDebug(): void {
  localStorage.setItem(DEBUG_KEY, 'true');
  console.log('[Seeksy Debug] Debug mode enabled');
}

/**
 * Disable debug mode.
 */
export function disableDebug(): void {
  localStorage.removeItem(DEBUG_KEY);
  console.log('[Seeksy Debug] Debug mode disabled');
}

/**
 * Log workspace state for debugging.
 */
export function logWorkspaceState(data: {
  workspaceId?: string;
  workspaceName?: string;
  installedModuleIds: string[];
  installedCollections: string[];
}): void {
  if (!isDebugEnabled()) return;
  
  console.group('[Seeksy Debug] Workspace state');
  console.log('Workspace ID:', data.workspaceId || 'N/A');
  console.log('Workspace Name:', data.workspaceName || 'N/A');
  console.log('Installed Module IDs:', data.installedModuleIds);
  console.log('Installed Collections:', data.installedCollections);
  console.log('Module Count:', data.installedModuleIds.length);
  console.groupEnd();
}

/**
 * Log My Day widget filtering for debugging.
 */
export function logMyDayFiltering(data: {
  totalWidgets: number;
  availableWidgets: number;
  hiddenWidgets: string[];
  sections: string[];
}): void {
  if (!isDebugEnabled()) return;
  
  console.group('[Seeksy Debug] My Day filtered widgets');
  console.log('Total widgets in system:', data.totalWidgets);
  console.log('Available widgets (after filtering):', data.availableWidgets);
  console.log('Hidden widgets:', data.hiddenWidgets);
  console.log('Active sections:', data.sections);
  console.groupEnd();
}

/**
 * Log sidebar module state for debugging.
 */
export function logSidebarModules(data: {
  flatList: string[];
  hasGroupedParents: boolean;
  collapsedState: boolean;
}): void {
  if (!isDebugEnabled()) return;
  
  console.group('[Seeksy Debug] Sidebar modules');
  console.log('Flat list:', data.flatList);
  console.log('Has grouped parents (should be false):', data.hasGroupedParents);
  console.log('Collapsed state:', data.collapsedState);
  console.groupEnd();
}

/**
 * Log module installation for debugging.
 */
export function logModuleInstall(data: {
  moduleId: string;
  moduleName?: string;
  viaCollection?: string | null;
  recommendationsShown?: string[];
}): void {
  if (!isDebugEnabled()) return;
  
  console.group('[Seeksy Debug] Module installed');
  console.log('Module ID:', data.moduleId);
  console.log('Module Name:', data.moduleName || 'Unknown');
  console.log('Via Collection:', data.viaCollection || 'Direct install');
  if (data.recommendationsShown) {
    console.log('Recommendations shown:', data.recommendationsShown);
  }
  console.groupEnd();
}

/**
 * Log collection installation for debugging.
 */
export function logCollectionInstall(data: {
  collectionId: string;
  collectionName: string;
  modulesAdded: string[];
}): void {
  if (!isDebugEnabled()) return;
  
  console.group('[Seeksy Debug] Collection installed');
  console.log('Collection ID:', data.collectionId);
  console.log('Collection Name:', data.collectionName);
  console.log('Modules added:', data.modulesAdded);
  console.groupEnd();
}

/**
 * Log route validation for debugging.
 */
export function logRouteValidation(data: {
  moduleId: string;
  requestedRoute: string;
  isValid: boolean;
  redirectTo?: string;
}): void {
  if (!isDebugEnabled()) return;
  
  console.log('[Seeksy Debug] Route validation:', {
    moduleId: data.moduleId,
    requestedRoute: data.requestedRoute,
    isValid: data.isValid,
    redirectTo: data.redirectTo || 'N/A',
  });
}

// Make debug functions available globally in dev
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).SeeksyDebug = {
    enable: enableDebug,
    disable: disableDebug,
    isEnabled: isDebugEnabled,
  };
  console.log('[Seeksy Debug] Debug utilities available: window.SeeksyDebug.enable() / .disable()');
}
