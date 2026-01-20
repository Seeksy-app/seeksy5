import { useGlobalDataMode } from '@/contexts/GlobalDataModeContext';
import { useMemo } from 'react';

/**
 * Hook to filter data arrays based on the global data mode.
 * In LIVE mode, records with is_demo = true are filtered out.
 * In DEMO mode, all records are shown.
 */
export function useDataModeFilter<T extends { is_demo?: boolean | null }>(
  data: T[] | null | undefined
): T[] {
  const { dataMode } = useGlobalDataMode();

  return useMemo(() => {
    if (!data) return [];
    
    if (dataMode === 'live') {
      // In LIVE mode, filter out demo records
      return data.filter(item => item.is_demo !== true);
    }
    
    // In DEMO mode, show all records
    return data;
  }, [data, dataMode]);
}

/**
 * Hook to get the SQL filter condition for data mode.
 * Useful for building queries that respect data mode.
 */
export function useDataModeQueryFilter() {
  const { dataMode } = useGlobalDataMode();

  return useMemo(() => {
    if (dataMode === 'live') {
      return { is_demo: false };
    }
    return {}; // No filter in demo mode - show all
  }, [dataMode]);
}
