/**
 * Hook for installing collections to a workspace.
 * 
 * This hook provides:
 * - Install a collection (adds all its modules with added_via_collection set)
 * - Track installed collections at workspace level
 * - Get list of installed collections
 * - Preview which modules will be installed before confirmation
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { SEEKSY_COLLECTIONS, type SeeksyCollection } from '@/components/modules/collectionData';
import { toast } from 'sonner';
import { logCollectionInstall } from '@/utils/onboardingDebug';

export interface InstalledCollection {
  collectionId: string;
  installedAt: string;
  moduleIds: string[];
}

export function useCollectionInstallation() {
  const { currentWorkspace, workspaceModules, refreshWorkspaces } = useWorkspace();

  /**
   * Get all installed collections for the current workspace.
   */
  const getInstalledCollections = useCallback(async (): Promise<string[]> => {
    if (!currentWorkspace) return [];

    try {
      const { data, error } = await supabase
        .from('custom_packages')
        .select('installed_collections')
        .eq('id', currentWorkspace.id)
        .single();

      if (error) throw error;
      return (data?.installed_collections as string[]) || [];
    } catch (err) {
      console.error('Error fetching installed collections:', err);
      return [];
    }
  }, [currentWorkspace]);

  /**
   * Check if a collection is installed.
   */
  const isCollectionInstalled = useCallback(async (collectionId: string): Promise<boolean> => {
    const installed = await getInstalledCollections();
    return installed.includes(collectionId);
  }, [getInstalledCollections]);

  /**
   * Install a collection to the current workspace.
   * This adds all modules from the collection with added_via_collection set.
   */
  const installCollection = useCallback(async (collectionId: string): Promise<boolean> => {
    if (!currentWorkspace) {
      toast.error('No workspace selected');
      return false;
    }

    // Find the collection
    const collection = SEEKSY_COLLECTIONS.find(c => c.id === collectionId);
    if (!collection) {
      toast.error('Collection not found');
      return false;
    }

    try {
      // Get current installed collections
      const currentCollections = await getInstalledCollections();
      if (currentCollections.includes(collectionId)) {
        toast.info('Collection already installed');
        return true;
      }

      // Get existing module IDs in workspace
      const existingModuleIds = new Set(workspaceModules.map(wm => wm.module_id));
      
      // Filter modules that aren't already installed
      const newModuleIds = collection.includedApps.filter(id => !existingModuleIds.has(id));
      
      // Add each new module with added_via_collection set
      const currentPosition = workspaceModules.length;
      
      for (let i = 0; i < newModuleIds.length; i++) {
        const moduleId = newModuleIds[i];
        
        await supabase
          .from('workspace_modules')
          .insert({
            workspace_id: currentWorkspace.id,
            module_id: moduleId,
            position: currentPosition + i,
            added_via_collection: collectionId,
          });
      }

      // Update the workspace's installed_collections array
      const updatedCollections = [...currentCollections, collectionId];
      
      await supabase
        .from('custom_packages')
        .update({ 
          installed_collections: updatedCollections,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentWorkspace.id);

      // Also update the legacy modules array
      const allModuleIds = [...new Set([
        ...workspaceModules.map(wm => wm.module_id),
        ...newModuleIds,
      ])];
      
      await supabase
        .from('custom_packages')
        .update({ 
          modules: allModuleIds,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentWorkspace.id);

      // Refresh workspace data
      await refreshWorkspaces();

      // Log for debugging
      logCollectionInstall({
        collectionId,
        collectionName: collection.name,
        modulesAdded: newModuleIds,
      });

      toast.success('Collection installed', {
        description: `${collection.name} has been added to your workspace.`,
      });
      
      return true;
    } catch (err) {
      console.error('Error installing collection:', err);
      toast.error('Failed to install collection');
      return false;
    }
  }, [currentWorkspace, workspaceModules, getInstalledCollections, refreshWorkspaces]);

  /**
   * Uninstall a collection from the current workspace.
   * This removes modules that were added via this collection (unless used by another).
   */
  const uninstallCollection = useCallback(async (collectionId: string): Promise<boolean> => {
    if (!currentWorkspace) {
      toast.error('No workspace selected');
      return false;
    }

    try {
      // Get current installed collections
      const currentCollections = await getInstalledCollections();
      if (!currentCollections.includes(collectionId)) {
        toast.info('Collection not installed');
        return true;
      }

      // Remove modules that were added via this collection
      await supabase
        .from('workspace_modules')
        .delete()
        .eq('workspace_id', currentWorkspace.id)
        .eq('added_via_collection', collectionId);

      // Update the workspace's installed_collections array
      const updatedCollections = currentCollections.filter(c => c !== collectionId);
      
      await supabase
        .from('custom_packages')
        .update({ 
          installed_collections: updatedCollections,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentWorkspace.id);

      // Refresh workspace data
      await refreshWorkspaces();

      const collection = SEEKSY_COLLECTIONS.find(c => c.id === collectionId);
      toast.success('Collection removed', {
        description: `${collection?.name || 'Collection'} has been removed from your workspace.`,
      });
      
      return true;
    } catch (err) {
      console.error('Error uninstalling collection:', err);
      toast.error('Failed to remove collection');
      return false;
    }
  }, [currentWorkspace, getInstalledCollections, refreshWorkspaces]);

  /**
   * Get collection details by ID.
   */
  const getCollectionById = useCallback((collectionId: string): SeeksyCollection | undefined => {
    return SEEKSY_COLLECTIONS.find(c => c.id === collectionId);
  }, []);

  /**
   * Preview which modules would be installed for a collection.
   * Returns both new modules and already-installed modules.
   */
  const previewCollectionInstall = useCallback((collectionId: string): {
    newModules: string[];
    alreadyInstalled: string[];
    collection: SeeksyCollection | undefined;
  } => {
    const collection = SEEKSY_COLLECTIONS.find(c => c.id === collectionId);
    if (!collection) {
      return { newModules: [], alreadyInstalled: [], collection: undefined };
    }

    const existingModuleIds = new Set(workspaceModules.map(wm => wm.module_id));
    const newModules = collection.includedApps.filter(id => !existingModuleIds.has(id));
    const alreadyInstalled = collection.includedApps.filter(id => existingModuleIds.has(id));

    return { newModules, alreadyInstalled, collection };
  }, [workspaceModules]);

  return {
    installCollection,
    uninstallCollection,
    getInstalledCollections,
    isCollectionInstalled,
    getCollectionById,
    previewCollectionInstall,
    allCollections: SEEKSY_COLLECTIONS,
  };
}
