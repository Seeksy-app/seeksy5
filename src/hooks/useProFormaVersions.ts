import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ForecastResult } from './useProFormaForecast';

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
      const result = await (supabase as any)
        .from('proforma_versions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (result.error) throw result.error;
      return (result.data || []).map((row: any) => ({
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
      
      const result = await (supabase as any)
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
      
      if (result.error) throw result.error;
      return result.data as any;
    },
    onSuccess: (data: any) => {
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
      const result = await (supabase as any)
        .from('proforma_versions')
        .delete()
        .eq('id', id);
      
      if (result.error) throw result.error;
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
