import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ForecastResult } from './useProFormaForecast';
import { Json } from '@/integrations/supabase/types';

export interface ProFormaVersion {
  id: string;
  scenario_key: string;
  label: string;
  summary: string | null;
  forecast_payload: ForecastResult;
  assumptions_snapshot: Record<string, number> | null;
  created_by: string | null;
  created_at: string;
}

export function useProFormaVersions() {
  const queryClient = useQueryClient();

  // Fetch all saved versions
  const { data: versions, isLoading } = useQuery({
    queryKey: ['proforma-versions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proforma_versions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((row) => ({
        ...row,
        forecast_payload: row.forecast_payload as unknown as ForecastResult,
        assumptions_snapshot: row.assumptions_snapshot as Record<string, number> | null,
      })) as ProFormaVersion[];
    },
  });

  // Save a new version
  const saveVersion = useMutation({
    mutationFn: async ({
      scenario_key,
      label,
      summary,
      forecast,
      assumptions,
    }: {
      scenario_key: string;
      label: string;
      summary?: string;
      forecast: ForecastResult;
      assumptions?: Record<string, number>;
    }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('You must be logged in to save a version');
      }
      
      const { data, error } = await supabase
        .from('proforma_versions')
        .insert({
          scenario_key,
          label,
          summary: summary || null,
          forecast_payload: forecast as any,
          assumptions_snapshot: assumptions || null,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['proforma-versions'] });
      toast.success(`Version saved as "${data.label}"`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to save version: ${error.message}`);
    },
  });

  // Delete a version
  const deleteVersion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('proforma_versions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proforma-versions'] });
      toast.success('Version deleted');
    },
  });

  return {
    versions,
    isLoading,
    saveVersion: saveVersion.mutate,
    deleteVersion: deleteVersion.mutate,
    isSaving: saveVersion.isPending,
  };
}
