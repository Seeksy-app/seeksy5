/**
 * Workspace-scoped sidebar state persistence.
 * 
 * This ensures sidebar expand/collapse state is stored per-workspace,
 * preventing global state conflicts when switching workspaces.
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_PREFIX = 'seeksy-sidebar-state-';
const GLOBAL_FALLBACK_KEY = 'seeksy-sidebar-state-global';

interface SidebarPersistState {
  isExpanded: boolean;
  expandedGroups: Record<string, boolean>;
  lastUpdated: string;
}

const DEFAULT_STATE: SidebarPersistState = {
  isExpanded: true,
  expandedGroups: {},
  lastUpdated: new Date().toISOString(),
};

function getStorageKey(workspaceId: string | null): string {
  return workspaceId 
    ? `${STORAGE_KEY_PREFIX}${workspaceId}`
    : GLOBAL_FALLBACK_KEY;
}

function loadState(workspaceId: string | null): SidebarPersistState {
  try {
    const key = getStorageKey(workspaceId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch (e) {
    console.warn('[SidebarState] Failed to load:', e);
  }
  return DEFAULT_STATE;
}

function saveState(workspaceId: string | null, state: SidebarPersistState): void {
  try {
    const key = getStorageKey(workspaceId);
    localStorage.setItem(key, JSON.stringify({
      ...state,
      lastUpdated: new Date().toISOString(),
    }));
  } catch (e) {
    console.warn('[SidebarState] Failed to save:', e);
  }
}

export function useWorkspaceSidebarState(workspaceId: string | null) {
  const [state, setState] = useState<SidebarPersistState>(() => loadState(workspaceId));

  // Reload state when workspace changes
  useEffect(() => {
    const loaded = loadState(workspaceId);
    setState(loaded);
  }, [workspaceId]);

  // Persist state changes
  useEffect(() => {
    saveState(workspaceId, state);
  }, [workspaceId, state]);

  const setExpanded = useCallback((expanded: boolean) => {
    setState(prev => ({ ...prev, isExpanded: expanded }));
  }, []);

  const toggleExpanded = useCallback(() => {
    setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, []);

  const setGroupExpanded = useCallback((groupId: string, expanded: boolean) => {
    setState(prev => ({
      ...prev,
      expandedGroups: { ...prev.expandedGroups, [groupId]: expanded },
    }));
  }, []);

  const toggleGroup = useCallback((groupId: string) => {
    setState(prev => ({
      ...prev,
      expandedGroups: { 
        ...prev.expandedGroups, 
        [groupId]: !prev.expandedGroups[groupId] 
      },
    }));
  }, []);

  const isGroupExpanded = useCallback((groupId: string): boolean => {
    return state.expandedGroups[groupId] ?? false;
  }, [state.expandedGroups]);

  // Recovery: if sidebar is stuck collapsed with no way to expand, reset
  const resetToDefault = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  return {
    isExpanded: state.isExpanded,
    expandedGroups: state.expandedGroups,
    setExpanded,
    toggleExpanded,
    setGroupExpanded,
    toggleGroup,
    isGroupExpanded,
    resetToDefault,
  };
}
