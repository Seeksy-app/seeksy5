/**
 * Single source of truth for installed modules in a workspace.
 * 
 * This hook provides:
 * - The canonical list of module IDs installed in the current workspace
 * - Helper to check if a specific module is installed
 * - Integration with WorkspaceContext
 * 
 * IMPORTANT: This replaces any usage of user_modules for determining
 * what appears in My Day or the sidebar. user_modules is for global
 * user-level activations, NOT workspace-scoped installations.
 */

import { useMemo, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { logWorkspaceState } from '@/utils/onboardingDebug';

export interface InstalledModule {
  moduleId: string;
  position: number;
  isPinned: boolean;
  isStandalone: boolean;
  addedViaCollection?: string | null;
}

export function useWorkspaceInstalledModules() {
  const { currentWorkspace, workspaceModules, isLoading } = useWorkspace();

  // Get list of installed module IDs for the current workspace
  const installedModuleIds = useMemo(() => {
    if (!currentWorkspace || !workspaceModules) return [];
    return workspaceModules.map(wm => wm.module_id);
  }, [currentWorkspace, workspaceModules]);

  // Get installed collections (from modules added_via_collection)
  const installedCollections = useMemo(() => {
    if (!workspaceModules) return [];
    const collections = new Set<string>();
    workspaceModules.forEach(wm => {
      if (wm.added_via_collection) {
        collections.add(wm.added_via_collection);
      }
    });
    return Array.from(collections);
  }, [workspaceModules]);

  // Log workspace state for debugging
  useEffect(() => {
    if (currentWorkspace && !isLoading) {
      logWorkspaceState({
        workspaceId: currentWorkspace.id,
        workspaceName: currentWorkspace.name,
        installedModuleIds,
        installedCollections,
      });
    }
  }, [currentWorkspace, installedModuleIds, installedCollections, isLoading]);

  // Get full installed module data
  const installedModules: InstalledModule[] = useMemo(() => {
    if (!currentWorkspace || !workspaceModules) return [];
    return workspaceModules.map(wm => ({
      moduleId: wm.module_id,
      position: wm.position,
      isPinned: wm.is_pinned,
      isStandalone: wm.is_standalone,
      addedViaCollection: wm.added_via_collection || null,
    }));
  }, [currentWorkspace, workspaceModules]);

  // Check if a specific module is installed
  const isModuleInstalled = (moduleId: string): boolean => {
    return installedModuleIds.includes(moduleId);
  };

  // Check if any of the given modules are installed
  const hasAnyModuleInstalled = (moduleIds: string[]): boolean => {
    return moduleIds.some(id => installedModuleIds.includes(id));
  };

  // Check if all of the given modules are installed
  const hasAllModulesInstalled = (moduleIds: string[]): boolean => {
    return moduleIds.every(id => installedModuleIds.includes(id));
  };

  return {
    workspaceId: currentWorkspace?.id || null,
    installedModuleIds,
    installedModules,
    installedCollections,
    isModuleInstalled,
    hasAnyModuleInstalled,
    hasAllModulesInstalled,
    isLoading,
    hasNoModules: !isLoading && installedModuleIds.length === 0,
  };
}

/**
 * Standalone helper function for use outside of React components.
 * Use this when you need to check installed modules in utility functions.
 */
export function getInstalledModuleIds(workspaceModules: Array<{ module_id: string }>): string[] {
  return workspaceModules.map(wm => wm.module_id);
}
