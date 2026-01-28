import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  CFO_ASSUMPTIONS_SCHEMA, 
  getAssumptionConfig, 
  getMetricCategory,
  getDefaultValue,
  type AssumptionConfig 
} from '@/lib/cfo-assumptions-schema';

export interface CFOAssumption {
  id: string;
  metric_key: string;
  value: number;
  unit: string;
  source: 'cfo_override' | 'r_d_default' | 'blended';
  category: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EffectiveAssumption {
  metric_key: string;
  value: number;
  unit: string;
  source: 'cfo_override' | 'r_d_default' | 'schema_default';
  rd_value?: number;
  cfo_value?: number;
  config?: AssumptionConfig;
}

export function useCFOAssumptions() {
  const queryClient = useQueryClient();

  // Fetch CFO assumptions
  const { data: cfoAssumptions, isLoading: cfoLoading } = useQuery({
    queryKey: ['cfo-assumptions'],
    queryFn: async () => {
      const result = await (supabase as any)
        .from('cfo_assumptions')
        .select('*')
        .order('category', { ascending: true });
      
      if (result.error) throw result.error;
      return result.data as CFOAssumption[];
    },
  });

  // Fetch R&D benchmarks
  const { data: rdBenchmarks, isLoading: rdLoading } = useQuery({
    queryKey: ['rd-benchmarks'],
    queryFn: async () => {
      const result = await (supabase as any)
        .from('rd_benchmarks')
        .select('metric_key, value, unit, confidence, source_notes')
        .order('metric_key');
      
      if (result.error) throw result.error;
      return result.data as any[];
    },
  });

  // Build effective assumptions map using canonical schema
  // Priority: 1) CFO override, 2) R&D benchmark, 3) Schema default
  const effectiveAssumptions: Record<string, EffectiveAssumption> = {};
  
  // Start with schema defaults
  Object.entries(CFO_ASSUMPTIONS_SCHEMA).forEach(([category, metrics]) => {
    Object.entries(metrics as Record<string, AssumptionConfig>).forEach(([key, config]) => {
      effectiveAssumptions[key] = {
        metric_key: key,
        value: config.default,
        unit: config.unit,
        source: 'schema_default',
        config,
      };
    });
  });

  // Apply R&D benchmarks (override schema defaults)
  rdBenchmarks?.forEach((b: any) => {
    const config = getAssumptionConfig(b.metric_key);
    if (effectiveAssumptions[b.metric_key]) {
      effectiveAssumptions[b.metric_key] = {
        ...effectiveAssumptions[b.metric_key],
        value: Number(b.value),
        unit: b.unit || effectiveAssumptions[b.metric_key].unit,
        source: 'r_d_default',
        rd_value: Number(b.value),
      };
    } else {
      // R&D benchmark not in schema - still track it
      effectiveAssumptions[b.metric_key] = {
        metric_key: b.metric_key,
        value: Number(b.value),
        unit: b.unit || 'number',
        source: 'r_d_default',
        rd_value: Number(b.value),
      };
    }
  });

  // Apply CFO overrides (highest priority)
  cfoAssumptions?.forEach((a) => {
    const existing = effectiveAssumptions[a.metric_key];
    effectiveAssumptions[a.metric_key] = {
      metric_key: a.metric_key,
      value: Number(a.value),
      unit: a.unit || existing?.unit || 'number',
      source: 'cfo_override',
      rd_value: existing?.rd_value,
      cfo_value: Number(a.value),
      config: existing?.config,
    };
  });

  // Save or update CFO assumption
  const saveAssumption = useMutation({
    mutationFn: async ({ metric_key, value, unit, category, notes }: {
      metric_key: string;
      value: number;
      unit?: string;
      category?: string;
      notes?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      const inferredCategory = category || getMetricCategory(metric_key) || 'general';
      const config = getAssumptionConfig(metric_key);
      
      const result = await (supabase as any)
        .from('cfo_assumptions')
        .upsert({
          metric_key,
          value,
          unit: unit || config?.unit || 'number',
          source: 'cfo_override',
          category: inferredCategory,
          notes,
          created_by: user.user?.id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'metric_key',
        });
      
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfo-assumptions'] });
      toast.success('Assumption saved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  // Save multiple assumptions at once
  const saveMultipleAssumptions = useMutation({
    mutationFn: async (assumptions: Array<{
      metric_key: string;
      value: number;
      unit?: string;
      category?: string;
      notes?: string;
    }>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const records = assumptions.map((a) => {
        const inferredCategory = a.category || getMetricCategory(a.metric_key) || 'general';
        const config = getAssumptionConfig(a.metric_key);
        
        return {
          metric_key: a.metric_key,
          value: a.value,
          unit: a.unit || config?.unit || 'number',
          source: 'cfo_override' as const,
          category: inferredCategory,
          notes: a.notes,
          created_by: user.user?.id,
          updated_at: new Date().toISOString(),
        };
      });
      
      const result = await (supabase as any)
        .from('cfo_assumptions')
        .upsert(records, { onConflict: 'metric_key' });
      
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfo-assumptions'] });
      toast.success('Assumptions saved. Future AI forecasts will use these values.');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  // Delete a CFO assumption (revert to R&D default or schema default)
  const deleteAssumption = useMutation({
    mutationFn: async (metric_key: string) => {
      const result = await (supabase as any)
        .from('cfo_assumptions')
        .delete()
        .eq('metric_key', metric_key);
      
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfo-assumptions'] });
      toast.success('Reverted to default');
    },
  });

  // Get effective value for a metric (uses schema default as fallback)
  const getEffectiveValue = (metricKey: string, fallback?: number): number => {
    const effective = effectiveAssumptions[metricKey];
    if (effective) return effective.value;
    
    // Check schema default
    const schemaDefault = getDefaultValue(metricKey);
    if (schemaDefault !== 0) return schemaDefault;
    
    return fallback ?? 0;
  };

  // Get assumption with full metadata
  const getAssumption = (metricKey: string): EffectiveAssumption | undefined => {
    return effectiveAssumptions[metricKey];
  };

  // Get all assumptions for a category
  const getAssumptionsByCategory = (category: keyof typeof CFO_ASSUMPTIONS_SCHEMA): EffectiveAssumption[] => {
    const categoryMetrics = CFO_ASSUMPTIONS_SCHEMA[category];
    return Object.keys(categoryMetrics).map(key => effectiveAssumptions[key]).filter(Boolean);
  };

  // Get counts for display
  const rdCount = rdBenchmarks?.length || 0;
  const cfoOverrideCount = cfoAssumptions?.length || 0;
  const schemaCount = Object.values(CFO_ASSUMPTIONS_SCHEMA).reduce(
    (acc, cat) => acc + Object.keys(cat).length, 
    0
  );

  // Determine data source status
  const hasCFOAssumptions = cfoOverrideCount > 0;
  const dataSource = hasCFOAssumptions ? 'cfo' : 'demo';
  const lastCFOUpdate = cfoAssumptions?.[0]?.updated_at || null;

  return {
    cfoAssumptions,
    rdBenchmarks,
    effectiveAssumptions,
    schema: CFO_ASSUMPTIONS_SCHEMA,
    isLoading: cfoLoading || rdLoading,
    saveAssumption: saveAssumption.mutate,
    saveMultipleAssumptions: saveMultipleAssumptions.mutate,
    deleteAssumption: deleteAssumption.mutate,
    getEffectiveValue,
    getAssumption,
    getAssumptionsByCategory,
    rdCount,
    cfoOverrideCount,
    schemaCount,
    isSaving: saveAssumption.isPending || saveMultipleAssumptions.isPending,
    // New CFO-controlled data source info
    hasCFOAssumptions,
    dataSource,
    lastCFOUpdate,
  };
}
