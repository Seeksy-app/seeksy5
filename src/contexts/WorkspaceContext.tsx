import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export interface Workspace {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  icon_color: string;
  is_default: boolean;
  modules: string[];
  created_at: string;
  updated_at: string;
}

export interface WorkspaceModule {
  id: string;
  workspace_id: string;
  module_id: string;
  position: number;
  settings: Record<string, unknown>;
  is_pinned: boolean;
  is_standalone: boolean;
  added_via_collection: string | null;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  workspaceModules: WorkspaceModule[];
  isLoading: boolean;
  hasFetchedOnce: boolean; // True after first fetch completes (even if empty)
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  createWorkspace: (name: string, templateModules?: string[]) => Promise<Workspace | null>;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<{ navigateTo: string | null; createdWorkspace: Workspace | null }>;
  addModule: (moduleId: string) => Promise<void>;
  removeModule: (moduleId: string) => Promise<void>;
  toggleStandalone: (moduleId: string) => Promise<void>;
  togglePinned: (moduleId: string) => Promise<void>;
  reorderModules: (moduleIds: string[]) => Promise<void>;
  refreshWorkspaces: (forceFetch?: boolean) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [workspaceModules, setWorkspaceModules] = useState<WorkspaceModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false); // Track if we've completed at least one fetch
  const queryClient = useQueryClient();

  const fetchWorkspaces = useCallback(async (forceFetch = false) => {
    // Skip workspace fetching for admin, board, advertiser, and CFO routes - they don't need workspace context
    // Unless forceFetch is true (e.g., when admin switches to creator view)
    const currentPath = window.location.pathname;
    const isNonWorkspaceRoute = 
      currentPath.startsWith('/admin') ||
      currentPath.startsWith('/board') ||
      currentPath.startsWith('/advertiser') ||
      currentPath.startsWith('/cfo');
    
    if (isNonWorkspaceRoute && !forceFetch) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[WorkspaceContext] Session:', session?.user?.id, session?.user?.email);
      if (!session) {
        console.log('[WorkspaceContext] No session, skipping fetch');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('custom_packages')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      console.log('[WorkspaceContext] Fetched workspaces:', data?.length, 'error:', error);

      if (error) throw error;

      const mapped: Workspace[] = (data || []).map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        slug: pkg.slug,
        description: pkg.description,
        icon_color: pkg.icon_color || '#2C6BED',
        is_default: pkg.is_default || false,
        modules: (pkg.modules as string[]) || [],
        created_at: pkg.created_at,
        updated_at: pkg.updated_at,
      }));

      setWorkspaces(mapped);

      // Set current workspace - prioritize saved ID, then default, then first workspace
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
      let workspaceToSet: Workspace | null = null;
      
      // Try to restore from saved ID first
      if (savedWorkspaceId) {
        workspaceToSet = mapped.find(w => w.id === savedWorkspaceId) || null;
      }
      
      // Fall back to default or first workspace
      if (!workspaceToSet) {
        workspaceToSet = mapped.find(w => w.is_default) || mapped[0] || null;
        // Update localStorage with the fallback choice
        if (workspaceToSet) {
          localStorage.setItem('currentWorkspaceId', workspaceToSet.id);
        }
      }
      
      setCurrentWorkspaceState(workspaceToSet);
      
      if (workspaceToSet) {
        await fetchWorkspaceModules(workspaceToSet.id);
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    } finally {
      setIsLoading(false);
      setHasFetchedOnce(true); // Mark that we've completed a fetch (even if empty results)
    }
  }, []);

  const fetchWorkspaceModules = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('workspace_modules')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('position', { ascending: true });

      if (error) throw error;

      setWorkspaceModules((data || []).map(m => ({
        id: m.id,
        workspace_id: m.workspace_id,
        module_id: m.module_id,
        position: m.position,
        settings: (m.settings as Record<string, unknown>) || {},
        is_pinned: m.is_pinned || false,
        is_standalone: m.is_standalone || false,
        added_via_collection: (m as any).added_via_collection || null,
      })));
    } catch (err) {
      console.error('Error fetching workspace modules:', err);
    }
  };

  const setCurrentWorkspace = useCallback((workspace: Workspace | null) => {
    setCurrentWorkspaceState(workspace);
    if (workspace) {
      localStorage.setItem('currentWorkspaceId', workspace.id);
      fetchWorkspaceModules(workspace.id);
    } else {
      localStorage.removeItem('currentWorkspaceId');
      setWorkspaceModules([]);
    }
  }, []);

  const generateSlug = (name: string): string => {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    // Add timestamp suffix to ensure uniqueness
    return `${baseSlug}-${Date.now().toString(36)}`;
  };

  const createWorkspace = async (name: string, templateModules?: string[]): Promise<Workspace | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const slug = generateSlug(name);
      const isFirstWorkspace = workspaces.length === 0;
      const modules = templateModules || [];

      const { data, error } = await supabase
        .from('custom_packages')
        .insert({
          user_id: session.user.id,
          name,
          slug,
          modules,
          is_default: isFirstWorkspace,
          icon_color: '#2C6BED',
        })
        .select()
        .single();

      if (error) throw error;

      // Insert workspace_modules for each module
      if (modules.length > 0 && data) {
        const moduleInserts = modules.map((moduleId, index) => ({
          workspace_id: data.id,
          module_id: moduleId,
          position: index,
        }));

        await supabase.from('workspace_modules').insert(moduleInserts);
      }

      await fetchWorkspaces();
      
      const newWorkspace: Workspace = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon_color: data.icon_color || '#2C6BED',
        is_default: data.is_default || false,
        modules: (data.modules as string[]) || [],
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return newWorkspace;
    } catch (err) {
      console.error('Error creating workspace:', err);
      return null;
    }
  };

  const updateWorkspace = async (id: string, updates: Partial<Workspace>) => {
    try {
      const { error } = await supabase
        .from('custom_packages')
        .update({
          name: updates.name,
          description: updates.description,
          icon_color: updates.icon_color,
          is_default: updates.is_default,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      await fetchWorkspaces();
    } catch (err) {
      console.error('Error updating workspace:', err);
    }
  };

  const deleteWorkspace = async (id: string): Promise<{ navigateTo: string | null; createdWorkspace: Workspace | null }> => {
    try {
      const { error } = await supabase
        .from('custom_packages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const remaining = workspaces.filter(w => w.id !== id);
      
      // Determine recovery strategy
      if (remaining.length > 0) {
        // Select next available workspace
        const nextWorkspace = remaining.find(w => w.is_default) || remaining[0];
        setCurrentWorkspace(nextWorkspace);
        await fetchWorkspaces();
        return { navigateTo: '/my-day', createdWorkspace: null };
      } else {
        // No workspaces left - create "My Workspace"
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');
        
        const slug = `my-workspace-${Date.now().toString(36)}`;
        const { data: newPkg, error: createError } = await supabase
          .from('custom_packages')
          .insert({
            user_id: session.user.id,
            name: 'My Workspace',
            slug,
            modules: [],
            is_default: true,
            icon_color: '#2C6BED',
          })
          .select()
          .single();
        
        if (createError) throw createError;
        
        const createdWorkspace: Workspace = {
          id: newPkg.id,
          name: newPkg.name,
          slug: newPkg.slug,
          description: newPkg.description,
          icon_color: newPkg.icon_color || '#2C6BED',
          is_default: true,
          modules: [],
          created_at: newPkg.created_at,
          updated_at: newPkg.updated_at,
        };
        
        setCurrentWorkspace(createdWorkspace);
        await fetchWorkspaces();
        return { navigateTo: '/apps?view=modules', createdWorkspace };
      }
    } catch (err) {
      console.error('Error deleting workspace:', err);
      return { navigateTo: null, createdWorkspace: null };
    }
  };

  const addModule = async (moduleId: string) => {
    if (!currentWorkspace) return;

    try {
      // Check if module already exists in workspace_modules table
      const existingModule = workspaceModules.find(wm => wm.module_id === moduleId);
      if (existingModule) {
        // Module already in workspace - no action needed
        console.log('Module already exists in workspace, skipping add');
        return;
      }

      // First check module_bundle_relations for bundled integrations
      const { data: bundleRelations } = await supabase
        .from('module_bundle_relations')
        .select('related_module_id')
        .eq('bundle_module_id', moduleId);

      let modulesToAdd = [moduleId];

      // If this is a bundle root, also add its related modules
      if (bundleRelations && bundleRelations.length > 0) {
        const existingIds = new Set(workspaceModules.map(wm => wm.module_id));
        const relatedModules = bundleRelations
          .map(r => r.related_module_id)
          .filter(id => !existingIds.has(id));
        modulesToAdd = [moduleId, ...relatedModules];
      } else {
        // Fallback: Check if this module belongs to a group as a primary module
        const { data: groupData } = await supabase
          .from('module_group_modules')
          .select('group_id, relationship_type')
          .eq('module_key', moduleId)
          .eq('relationship_type', 'primary')
          .maybeSingle();

        if (groupData?.group_id) {
          const { data: groupModules } = await supabase
            .from('module_group_modules')
            .select('module_key')
            .eq('group_id', groupData.group_id)
            .eq('relationship_type', 'primary')
            .order('sort_order');

          if (groupModules) {
            const existingIds = new Set(workspaceModules.map(wm => wm.module_id));
            modulesToAdd = groupModules
              .map(gm => gm.module_key)
              .filter(key => !existingIds.has(key));
          }
        }
      }

      // Add all modules to workspace_modules table
      const insertedModules: WorkspaceModule[] = [];
      for (let i = 0; i < modulesToAdd.length; i++) {
        const modId = modulesToAdd[i];
        const { data: insertedModule, error: moduleError } = await supabase
          .from('workspace_modules')
          .insert({
            workspace_id: currentWorkspace.id,
            module_id: modId,
            position: workspaceModules.length + i,
          })
          .select()
          .single();

        if (moduleError) {
          if (moduleError.code !== '23505') throw moduleError;
        } else if (insertedModule) {
          insertedModules.push({
            id: insertedModule.id,
            workspace_id: insertedModule.workspace_id,
            module_id: insertedModule.module_id,
            position: insertedModule.position,
            settings: (insertedModule.settings as Record<string, unknown>) || {},
            is_pinned: insertedModule.is_pinned || false,
            is_standalone: insertedModule.is_standalone || false,
            added_via_collection: (insertedModule as any).added_via_collection || null,
          });
        }
      }

      if (insertedModules.length > 0) {
        setWorkspaceModules(prev => [...prev, ...insertedModules]);
      }

      const updatedModules = [...new Set([...(currentWorkspace.modules || []), ...modulesToAdd])];
      await supabase
        .from('custom_packages')
        .update({ modules: updatedModules, updated_at: new Date().toISOString() })
        .eq('id', currentWorkspace.id);

      setCurrentWorkspaceState(prev => prev ? { ...prev, modules: updatedModules } : null);
      setWorkspaces(prev => prev.map(w => w.id === currentWorkspace.id ? { ...w, modules: updatedModules } : w));
    } catch (err) {
      console.error('Error adding module:', err);
      throw err;
    }
  };

  const removeModule = async (moduleId: string) => {
    if (!currentWorkspace) return;

    try {
      // Optimistically update local state immediately
      setWorkspaceModules(prev => prev.filter(wm => wm.module_id !== moduleId));

      // Remove from workspace_modules table
      await supabase
        .from('workspace_modules')
        .delete()
        .eq('workspace_id', currentWorkspace.id)
        .eq('module_id', moduleId);

      // Also update the legacy modules array
      const updatedModules = (currentWorkspace.modules || []).filter(m => m !== moduleId);
      await supabase
        .from('custom_packages')
        .update({ modules: updatedModules, updated_at: new Date().toISOString() })
        .eq('id', currentWorkspace.id);

      // Update current workspace state
      setCurrentWorkspaceState(prev => prev ? { ...prev, modules: updatedModules } : null);
      setWorkspaces(prev => prev.map(w => w.id === currentWorkspace.id ? { ...w, modules: updatedModules } : w));
    } catch (err) {
      console.error('Error removing module:', err);
      // Revert optimistic update on error
      await fetchWorkspaceModules(currentWorkspace.id);
      throw err;
    }
  };

  const reorderModules = async (moduleIds: string[]) => {
    if (!currentWorkspace) return;

    try {
      // Update positions in workspace_modules
      const updates = moduleIds.map((moduleId, index) => 
        supabase
          .from('workspace_modules')
          .update({ position: index })
          .eq('workspace_id', currentWorkspace.id)
          .eq('module_id', moduleId)
      );

      await Promise.all(updates);

      // Also update the legacy modules array
      await supabase
        .from('custom_packages')
        .update({ modules: moduleIds, updated_at: new Date().toISOString() })
        .eq('id', currentWorkspace.id);

      await fetchWorkspaceModules(currentWorkspace.id);
    } catch (err) {
      console.error('Error reordering modules:', err);
    }
  };

  const toggleStandalone = async (moduleId: string) => {
    if (!currentWorkspace) return;

    try {
      const existingModule = workspaceModules.find(wm => wm.module_id === moduleId);
      if (!existingModule) return;

      const newStandaloneValue = !existingModule.is_standalone;

      // Update in database
      await supabase
        .from('workspace_modules')
        .update({ is_standalone: newStandaloneValue })
        .eq('id', existingModule.id);

      // Update local state
      setWorkspaceModules(prev => prev.map(wm => 
        wm.id === existingModule.id 
          ? { ...wm, is_standalone: newStandaloneValue }
          : wm
      ));
    } catch (err) {
      console.error('Error toggling standalone:', err);
      throw err;
    }
  };

  const togglePinned = async (moduleId: string) => {
    if (!currentWorkspace) return;

    try {
      const existingModule = workspaceModules.find(wm => wm.module_id === moduleId);
      if (!existingModule) return;

      const newPinnedValue = !existingModule.is_pinned;

      // Update in database
      await supabase
        .from('workspace_modules')
        .update({ is_pinned: newPinnedValue })
        .eq('id', existingModule.id);

      // Update local state
      setWorkspaceModules(prev => prev.map(wm => 
        wm.id === existingModule.id 
          ? { ...wm, is_pinned: newPinnedValue }
          : wm
      ));
    } catch (err) {
      console.error('Error toggling pinned:', err);
      throw err;
    }
  };

  // Listen for auth state changes to refetch workspaces when user logs in
  useEffect(() => {
    fetchWorkspaces();
    
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[WorkspaceContext] Auth state changed:', event, session?.user?.email);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // User just logged in - refetch workspaces
        fetchWorkspaces();
      } else if (event === 'SIGNED_OUT') {
        // Clear workspace state on logout
        setWorkspaces([]);
        setCurrentWorkspaceState(null);
        setWorkspaceModules([]);
        localStorage.removeItem('currentWorkspaceId');
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchWorkspaces]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        workspaceModules,
        isLoading,
        hasFetchedOnce, // Expose this for components that need to know if fetch completed
        setCurrentWorkspace,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        addModule,
        removeModule,
        toggleStandalone,
        togglePinned,
        reorderModules,
        refreshWorkspaces: (forceFetch = false) => fetchWorkspaces(forceFetch),
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
