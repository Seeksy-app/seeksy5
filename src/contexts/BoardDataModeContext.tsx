import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';
import { useRealPlatformMetrics } from '@/hooks/useRealPlatformMetrics';

type DataMode = 'cfo' | 'live';

interface BoardDataModeContextType {
  dataMode: DataMode;
  setDataMode: (mode: DataMode) => void;
  isCFO: boolean;
  isLive: boolean;
  isDemo: boolean; // Kept for backward compatibility, always false now
  hasCFOAssumptions: boolean;
  hasLiveData: boolean;
  availableModes: DataMode[];
  modeLabel: string;
  modeTooltip: string;
}

const BoardDataModeContext = createContext<BoardDataModeContextType | undefined>(undefined);

export function BoardDataModeProvider({ children }: { children: ReactNode }) {
  const { hasCFOAssumptions } = useCFOAssumptions();
  const { data: realData, isLoading: realLoading } = useRealPlatformMetrics();
  
  // Check if we have live data
  const hasLiveData = !realLoading && realData && (
    realData.totalCreators > 0 || 
    realData.totalPodcasts > 0 || 
    realData.totalEpisodes > 0
  );

  // Available modes: CFO Model and Live Data
  const availableModes: DataMode[] = ['cfo', 'live'];

  // Default to Live Data mode
  const defaultMode: DataMode = 'live';
  
  const [dataMode, setDataMode] = useState<DataMode>(defaultMode);

  // Update mode when availability changes
  useEffect(() => {
    if (!availableModes.includes(dataMode)) {
      setDataMode(defaultMode);
    }
  }, [availableModes, dataMode, defaultMode]);

  // Get label and tooltip for current mode
  const getModeInfo = (mode: DataMode): { label: string; tooltip: string } => {
    switch (mode) {
      case 'cfo':
        return {
          label: 'CFO Model',
          tooltip: 'CFO-Controlled Financial Model — All KPIs and forecasts are derived from CFO assumptions.',
        };
      case 'live':
        return {
          label: 'Live Data',
          tooltip: 'Real-time platform metrics: creators, podcasts, episodes, signups, and revenue.',
        };
    }
  };

  const { label: modeLabel, tooltip: modeTooltip } = getModeInfo(dataMode);

  return (
    <BoardDataModeContext.Provider
      value={{
        dataMode,
        setDataMode,
        isCFO: dataMode === 'cfo',
        isLive: dataMode === 'live',
        isDemo: false, // Always false - demo mode removed
        hasCFOAssumptions,
        hasLiveData: !!hasLiveData,
        availableModes,
        modeLabel,
        modeTooltip,
      }}
    >
      {children}
    </BoardDataModeContext.Provider>
  );
}

// Safe default values for when hook is used outside provider
const defaultContextValue: BoardDataModeContextType = {
  dataMode: 'cfo',
  setDataMode: () => {
    if (import.meta.env.DEV) {
      console.warn('useBoardDataMode: setDataMode called outside provider - no effect');
    }
  },
  isCFO: true,
  isLive: false,
  isDemo: false,
  hasCFOAssumptions: false,
  hasLiveData: false,
  availableModes: ['cfo', 'live'],
  modeLabel: 'CFO Model',
  modeTooltip: 'All metrics powered by CFO assumptions. Baseline for all Board forecasts.',
};

export function useBoardDataMode(): BoardDataModeContextType {
  const context = useContext(BoardDataModeContext);
  
  if (!context) {
    // Log warning in development only
    if (import.meta.env.DEV) {
      console.warn('useBoardDataMode: used outside BoardDataModeProvider - falling back to CFO mode');
    }
    // Return safe defaults instead of throwing
    return defaultContextValue;
  }
  
  return context;
}
