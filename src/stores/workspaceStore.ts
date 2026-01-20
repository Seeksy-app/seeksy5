import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SeeksyApp = {
  id: string;
  name: string;
  icon: string;
  route: string;
  color?: string;
  isPinned?: boolean;
  lastAccessed?: string;
};

export type ContextColumn = {
  id: string;
  type: 'detail' | 'edit' | 'analytics' | 'calendar' | 'notes' | 'custom';
  title: string;
  entityType?: string;
  entityId?: string;
  isPinned?: boolean;
  data?: Record<string, any>;
};

export type WorkspaceState = {
  // Layout state
  appRailExpanded: boolean;
  aiColumnOpen: boolean;
  
  // Active app
  activeSeeksyId: string | null;
  
  // Context columns (max 3)
  contextColumns: ContextColumn[];
  
  // Installed/pinned apps
  installedSeekies: SeeksyApp[];
  pinnedSeekies: string[]; // IDs
  recentSeekies: string[]; // IDs (last 5)
  
  // Workspace info
  currentWorkspaceId: string | null;
  workspaceName: string;
  
  // AI context
  aiContext: {
    primaryContext: Record<string, any>;
    recentActions: string[];
  };
  
  // Actions
  toggleAppRail: () => void;
  toggleAiColumn: () => void;
  setActiveSeeksy: (id: string) => void;
  
  // Context columns
  openContextColumn: (column: Omit<ContextColumn, 'id'>) => void;
  closeContextColumn: (id: string) => void;
  pinContextColumn: (id: string) => void;
  unpinContextColumn: (id: string) => void;
  
  // Seeksy management
  pinSeeksy: (id: string) => void;
  unpinSeeksy: (id: string) => void;
  addRecentSeeksy: (id: string) => void;
  
  // AI context
  updateAiContext: (context: Partial<WorkspaceState['aiContext']>) => void;
  addRecentAction: (action: string) => void;
  
  // Workspace
  setWorkspace: (id: string, name: string) => void;
};

const DEFAULT_SEEKIES: SeeksyApp[] = [
  { id: 'dashboard', name: 'Dashboard', icon: 'LayoutDashboard', route: '/workspace', color: 'text-blue-500' },
  { id: 'podcasts', name: 'Podcasts', icon: 'Mic', route: '/workspace/podcasts', color: 'text-purple-500' },
  { id: 'episodes', name: 'Episodes', icon: 'Play', route: '/workspace/episodes', color: 'text-green-500' },
  { id: 'analytics', name: 'Analytics', icon: 'BarChart3', route: '/workspace/analytics', color: 'text-orange-500' },
  { id: 'campaigns', name: 'Campaigns', icon: 'Megaphone', route: '/workspace/campaigns', color: 'text-pink-500' },
  { id: 'audience', name: 'Audience', icon: 'Users', route: '/workspace/audience', color: 'text-cyan-500' },
  { id: 'monetization', name: 'Monetization', icon: 'DollarSign', route: '/workspace/monetization', color: 'text-emerald-500' },
  { id: 'studio', name: 'Studio', icon: 'Video', route: '/workspace/studio', color: 'text-red-500' },
  { id: 'calendar', name: 'Calendar', icon: 'Calendar', route: '/workspace/calendar', color: 'text-amber-500' },
  { id: 'settings', name: 'Settings', icon: 'Settings', route: '/workspace/settings', color: 'text-slate-500' },
];

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      // Initial state
      appRailExpanded: true,
      aiColumnOpen: false,
      activeSeeksyId: 'dashboard',
      contextColumns: [],
      installedSeekies: DEFAULT_SEEKIES,
      pinnedSeekies: ['dashboard', 'podcasts', 'analytics'],
      recentSeekies: [],
      currentWorkspaceId: null,
      workspaceName: 'My Workspace',
      aiContext: {
        primaryContext: {},
        recentActions: [],
      },

      // Actions
      toggleAppRail: () => set((state) => ({ appRailExpanded: !state.appRailExpanded })),
      
      toggleAiColumn: () => set((state) => ({ aiColumnOpen: !state.aiColumnOpen })),
      
      setActiveSeeksy: (id) => {
        get().addRecentSeeksy(id);
        set({ activeSeeksyId: id });
      },
      
      openContextColumn: (column) => {
        const id = `col-${Date.now()}`;
        set((state) => {
          // Max 3 columns - remove oldest unpinned if needed
          let columns = [...state.contextColumns];
          if (columns.length >= 3) {
            const unpinnedIndex = columns.findIndex(c => !c.isPinned);
            if (unpinnedIndex !== -1) {
              columns.splice(unpinnedIndex, 1);
            } else {
              columns.shift(); // Remove first if all pinned
            }
          }
          return { contextColumns: [...columns, { ...column, id }] };
        });
      },
      
      closeContextColumn: (id) => set((state) => ({
        contextColumns: state.contextColumns.filter(c => c.id !== id),
      })),
      
      pinContextColumn: (id) => set((state) => ({
        contextColumns: state.contextColumns.map(c => 
          c.id === id ? { ...c, isPinned: true } : c
        ),
      })),
      
      unpinContextColumn: (id) => set((state) => ({
        contextColumns: state.contextColumns.map(c => 
          c.id === id ? { ...c, isPinned: false } : c
        ),
      })),
      
      pinSeeksy: (id) => set((state) => ({
        pinnedSeekies: [...state.pinnedSeekies, id],
      })),
      
      unpinSeeksy: (id) => set((state) => ({
        pinnedSeekies: state.pinnedSeekies.filter(s => s !== id),
      })),
      
      addRecentSeeksy: (id) => set((state) => {
        const recent = [id, ...state.recentSeekies.filter(s => s !== id)].slice(0, 5);
        return { recentSeekies: recent };
      }),
      
      updateAiContext: (context) => set((state) => ({
        aiContext: { ...state.aiContext, ...context },
      })),
      
      addRecentAction: (action) => set((state) => ({
        aiContext: {
          ...state.aiContext,
          recentActions: [action, ...state.aiContext.recentActions].slice(0, 10),
        },
      })),
      
      setWorkspace: (id, name) => set({ currentWorkspaceId: id, workspaceName: name }),
    }),
    {
      name: 'seeksy-workspace',
      partialize: (state) => ({
        appRailExpanded: state.appRailExpanded,
        activeSeeksyId: state.activeSeeksyId,
        pinnedSeekies: state.pinnedSeekies,
        recentSeekies: state.recentSeekies,
        currentWorkspaceId: state.currentWorkspaceId,
        workspaceName: state.workspaceName,
      }),
    }
  )
);
