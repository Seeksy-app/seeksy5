import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ScenarioKey = 'conservative' | 'base' | 'aggressive';

export interface ScenarioConfig {
  scenario_key: string;
  label: string;
  revenue_growth_multiplier: number;
  market_adoption_multiplier: number;
  churn_multiplier: number;
  cac_multiplier: number;
  impressions_multiplier: number;
  cpm_multiplier: number;
  fill_rate_multiplier: number;
  platform_revshare_adjustment: number;
}

export interface AdChannelData {
  impressions: number;
  cpm: number;
  fillRate: number;
  revenue: number;
  platformShare: number;
}

export interface AdvertisingBreakdown {
  hostReadAudio: AdChannelData;
  programmaticAudio: AdChannelData;
  videoPreroll: AdChannelData;
  videoMidroll: AdChannelData;
  brandDeals: { deals: number; avgValue: number; revenue: number; platformShare: number };
  newsletter: { impressions: number; cpm: number; revenue: number; platformShare: number };
  display: { impressions: number; cpm: number; revenue: number; platformShare: number };
  total: number;
  totalPlatformRevenue: number;
}

export interface YearlyForecast {
  year: number;
  revenue: {
    subscriptions: { free: number; pro: number; business: number; enterprise: number; total: number };
    aiCredits: { clips: number; postProduction: number; transcription: number; total: number };
    podcastHosting: { hosting: number; storage: number; total: number };
    advertising: AdvertisingBreakdown;
    events: { tickets: number; sponsorships: number; livestream: number; total: number };
    licensing: { whiteLabel: number; enterprise: number; total: number };
    totalRevenue: number;
  };
  expenses: {
    cogs: number;
    salesMarketing: number;
    rd: number;
    ga: number;
    total: number;
  };
  ebitda: number;
  ebitdaMargin: number;
  creatorCount: number;
  subscriberCount: number;
  churnRate: number;
  cac: number;
  ltv: number;
}

export interface ForecastResult {
  years: YearlyForecast[];
  breakEvenYear: number;
  commentary: string;
}

export interface Benchmark {
  metric_key: string;
  value: number;
  unit: string;
  confidence: string;
  source_notes: string;
}

export function useProFormaForecast() {
  const queryClient = useQueryClient();
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>('base');
  const [cfoOverrides, setCfoOverrides] = useState<Record<string, number>>({});
  
  // Store the latest generated forecast directly for immediate UI update
  const [generatedForecast, setGeneratedForecast] = useState<ForecastResult | null>(null);
  const [lastGeneratedScenario, setLastGeneratedScenario] = useState<ScenarioKey | null>(null);

  // Fetch scenario configs
  const { data: scenarios, isLoading: scenariosLoading } = useQuery({
    queryKey: ['scenario-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scenario_configs')
        .select('*')
        .eq('is_active', true)
        .order('scenario_key');
      
      if (error) throw error;
      return data as ScenarioConfig[];
    },
  });

  // Fetch benchmarks
  const { data: benchmarks, isLoading: benchmarksLoading } = useQuery({
    queryKey: ['rd-benchmarks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rd_benchmarks')
        .select('metric_key, value, unit, confidence, source_notes')
        .order('metric_key');
      
      if (error) throw error;
      return data as Benchmark[];
    },
  });

  // Generate forecast mutation
  const generateForecast = useMutation({
    mutationFn: async ({ scenarioKey, years, overrides }: { 
      scenarioKey: ScenarioKey; 
      years?: number[]; 
      overrides?: Record<string, number>;
    }) => {
      console.log('[useProFormaForecast] Calling generate-proforma-forecast with:', { scenarioKey, years });
      
      const { data, error } = await supabase.functions.invoke('generate-proforma-forecast', {
        body: {
          scenarioKey,
          years: years || [2025, 2026, 2027],
          cfoOverrides: overrides || cfoOverrides,
        },
      });

      console.log('[useProFormaForecast] Response:', { data, error });

      if (error) {
        console.error('[useProFormaForecast] Edge function error:', error);
        throw new Error(error.message || 'Failed to invoke edge function');
      }
      
      // Check for error in response body
      if (data?.error) {
        console.error('[useProFormaForecast] Response error:', data.error);
        throw new Error(data.error);
      }
      
      if (!data?.success) {
        throw new Error('Forecast generation failed - no success response');
      }
      
      return { 
        ...data as { success: boolean; scenario: string; forecast: ForecastResult; benchmarksUsed: number },
        scenarioKey 
      };
    },
    onSuccess: (data) => {
      console.log('[useProFormaForecast] Success, setting forecast state:', data.forecast);
      
      // Immediately set the generated forecast for instant UI update
      setGeneratedForecast(data.forecast);
      setLastGeneratedScenario(data.scenarioKey as ScenarioKey);
      
      toast.success(`${data.scenario} forecast generated using ${data.benchmarksUsed} benchmarks`);
      
      // Also invalidate the stored forecasts query for persistence
      queryClient.invalidateQueries({ queryKey: ['proforma-forecasts'] });
    },
    onError: (error: Error) => {
      console.error('[useProFormaForecast] Mutation error:', error);
      toast.error(`Failed to generate forecast: ${error.message}`);
    },
  });

  // Fetch stored forecasts from database
  const { data: storedForecasts, isLoading: forecastsLoading, refetch: refetchForecasts } = useQuery({
    queryKey: ['proforma-forecasts', selectedScenario],
    queryFn: async () => {
      console.log('[useProFormaForecast] Fetching stored forecasts for:', selectedScenario);
      const { data, error } = await supabase
        .from('proforma_forecasts')
        .select('*')
        .eq('scenario_key', selectedScenario)
        .order('forecast_year');
      
      if (error) {
        console.error('[useProFormaForecast] Error fetching forecasts:', error);
        throw error;
      }
      console.log('[useProFormaForecast] Fetched forecasts:', data?.length || 0, 'rows');
      return data;
    },
    staleTime: 0, // Always refetch
  });

  const updateCfoOverride = useCallback((key: string, value: number) => {
    setCfoOverrides(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearCfoOverrides = useCallback(() => {
    setCfoOverrides({});
  }, []);

  // Use generated forecast if it matches current scenario, otherwise use stored
  const activeForecast = (lastGeneratedScenario === selectedScenario && generatedForecast) 
    ? generatedForecast 
    : null;

  return {
    // State
    selectedScenario,
    setSelectedScenario,
    cfoOverrides,
    
    // Data
    scenarios,
    benchmarks,
    storedForecasts,
    generatedForecast: activeForecast, // The immediately-available forecast from generation
    
    // Loading states
    isLoading: scenariosLoading || benchmarksLoading || forecastsLoading,
    isGenerating: generateForecast.isPending,
    
    // Actions
    generateForecast: generateForecast.mutate,
    updateCfoOverride,
    clearCfoOverrides,
    refetchForecasts,
  };
}