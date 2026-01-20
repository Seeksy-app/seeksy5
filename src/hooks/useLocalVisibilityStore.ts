import { create } from 'zustand';
import type {
  Connection,
  GBPLocation,
  GBPInsights,
  GBPReview,
  LocalSearchQuery,
  TrackingHealthCheck,
  GrowthAction,
  ActivityLogEntry,
  VisibilitySummary,
} from '@/types/local-visibility';

interface LocalVisibilityState {
  // Connections
  connections: Connection[];
  setConnections: (connections: Connection[]) => void;
  updateConnection: (id: string, updates: Partial<Connection>) => void;

  // GBP
  locations: GBPLocation[];
  setLocations: (locations: GBPLocation[]) => void;
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string | null) => void;
  insights: GBPInsights | null;
  setInsights: (insights: GBPInsights | null) => void;
  reviews: GBPReview[];
  setReviews: (reviews: GBPReview[]) => void;

  // Search Console
  searchQueries: LocalSearchQuery[];
  setSearchQueries: (queries: LocalSearchQuery[]) => void;

  // Tracking Health
  healthChecks: TrackingHealthCheck[];
  setHealthChecks: (checks: TrackingHealthCheck[]) => void;

  // Growth Actions
  growthActions: GrowthAction[];
  setGrowthActions: (actions: GrowthAction[]) => void;
  updateGrowthAction: (id: string, updates: Partial<GrowthAction>) => void;

  // Activity Log
  activityLog: ActivityLogEntry[];
  addActivityLog: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
  setActivityLog: (entries: ActivityLogEntry[]) => void;

  // Summary
  summary: VisibilitySummary | null;
  setSummary: (summary: VisibilitySummary | null) => void;

  // UI State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useLocalVisibilityStore = create<LocalVisibilityState>((set) => ({
  // Connections
  connections: [],
  setConnections: (connections) => set({ connections }),
  updateConnection: (id, updates) =>
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  // GBP
  locations: [],
  setLocations: (locations) => set({ locations }),
  selectedLocationId: null,
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),
  insights: null,
  setInsights: (insights) => set({ insights }),
  reviews: [],
  setReviews: (reviews) => set({ reviews }),

  // Search Console
  searchQueries: [],
  setSearchQueries: (searchQueries) => set({ searchQueries }),

  // Tracking Health
  healthChecks: [],
  setHealthChecks: (healthChecks) => set({ healthChecks }),

  // Growth Actions
  growthActions: [],
  setGrowthActions: (growthActions) => set({ growthActions }),
  updateGrowthAction: (id, updates) =>
    set((state) => ({
      growthActions: state.growthActions.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),

  // Activity Log
  activityLog: [],
  addActivityLog: (entry) =>
    set((state) => ({
      activityLog: [
        {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
        ...state.activityLog,
      ],
    })),
  setActivityLog: (activityLog) => set({ activityLog }),

  // Summary
  summary: null,
  setSummary: (summary) => set({ summary }),

  // UI State
  activeTab: 'overview',
  setActiveTab: (activeTab) => set({ activeTab }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}));
