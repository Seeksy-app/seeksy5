import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from '@/hooks/useUserRoles';

type DataMode = 'demo' | 'live';

interface GlobalDataModeContextType {
  dataMode: DataMode;
  isLoading: boolean;
  isAdmin: boolean;
  setDataMode: (mode: DataMode) => Promise<void>;
  isDemoData: (isDemo: boolean | null | undefined) => boolean;
}

const GlobalDataModeContext = createContext<GlobalDataModeContextType | undefined>(undefined);

export function GlobalDataModeProvider({ children }: { children: React.ReactNode }) {
  const [dataMode, setDataModeState] = useState<DataMode>('live');
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useUserRoles();

  const canManageDataMode = isAdmin; // isAdmin already includes super_admin

  // Fetch current data mode from app_settings
  useEffect(() => {
    const fetchDataMode = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('data_mode')
          .eq('key', 'global')
          .maybeSingle();

        if (error) {
          console.error('Error fetching data mode:', error);
          setDataModeState('live');
        } else {
          setDataModeState((data?.data_mode as DataMode) || 'live');
        }
      } catch (err) {
        console.error('Error fetching data mode:', err);
        setDataModeState('live');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataMode();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('app_settings_data_mode')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_settings' },
        (payload) => {
          if (payload.new && 'data_mode' in payload.new) {
            setDataModeState(payload.new.data_mode as DataMode);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const setDataMode = useCallback(async (mode: DataMode) => {
    if (!canManageDataMode) {
      console.error('Unauthorized: Only Admin/SuperAdmin can change data mode');
      return;
    }

    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ data_mode: mode, updated_at: new Date().toISOString() })
        .eq('key', 'global');

      if (error) {
        console.error('Error updating data mode:', error);
        throw error;
      }

      setDataModeState(mode);
    } catch (err) {
      console.error('Error setting data mode:', err);
      throw err;
    }
  }, [canManageDataMode]);

  // Helper function to check if a record should be shown based on its is_demo flag
  const isDemoData = useCallback((isDemo: boolean | null | undefined): boolean => {
    // In LIVE mode, hide demo data (is_demo = true)
    // In DEMO mode, show everything
    if (dataMode === 'live' && isDemo === true) {
      return true; // This is demo data and should be hidden in live mode
    }
    return false; // Show this record
  }, [dataMode]);

  return (
    <GlobalDataModeContext.Provider
      value={{
        dataMode,
        isLoading,
        isAdmin: canManageDataMode,
        setDataMode,
        isDemoData,
      }}
    >
      {children}
    </GlobalDataModeContext.Provider>
  );
}

export function useGlobalDataMode() {
  const context = useContext(GlobalDataModeContext);
  if (context === undefined) {
    throw new Error('useGlobalDataMode must be used within a GlobalDataModeProvider');
  }
  return context;
}
