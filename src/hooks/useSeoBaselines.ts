import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SeoBaseline {
  id: string;
  seo_page_id: string;
  source: 'gsc' | 'ga4';
  baseline_clicks: number | null;
  baseline_impressions: number | null;
  baseline_ctr: number | null;
  baseline_position: number | null;
  baseline_users: number | null;
  baseline_sessions: number | null;
  captured_at: string;
  reset_by: string | null;
  reset_at: string | null;
}

export interface BaselinesMap {
  gsc: SeoBaseline | null;
  ga4: SeoBaseline | null;
}

export function useSeoBaseline(seoPageId: string | undefined) {
  return useQuery({
    queryKey: ['seo-baselines', seoPageId],
    queryFn: async () => {
      if (!seoPageId) return { gsc: null, ga4: null } as BaselinesMap;
      
      const { data, error } = await supabase
        .from('seo_metric_baselines')
        .select('*')
        .eq('seo_page_id', seoPageId);
      
      if (error) throw error;
      
      const result: BaselinesMap = { gsc: null, ga4: null };
      data?.forEach(b => {
        if (b.source === 'gsc') result.gsc = b as SeoBaseline;
        if (b.source === 'ga4') result.ga4 = b as SeoBaseline;
      });
      return result;
    },
    enabled: !!seoPageId,
    staleTime: 60000
  });
}

export function useSeoBaselinesForList(seoPageIds: string[]) {
  return useQuery({
    queryKey: ['seo-baselines-list', seoPageIds],
    queryFn: async () => {
      if (seoPageIds.length === 0) return new Map<string, BaselinesMap>();
      
      const { data, error } = await supabase
        .from('seo_metric_baselines')
        .select('*')
        .in('seo_page_id', seoPageIds);
      
      if (error) throw error;
      
      const result = new Map<string, BaselinesMap>();
      
      // Initialize all pages
      seoPageIds.forEach(id => {
        result.set(id, { gsc: null, ga4: null });
      });
      
      // Fill in baselines
      data?.forEach(b => {
        const existing = result.get(b.seo_page_id) || { gsc: null, ga4: null };
        if (b.source === 'gsc') existing.gsc = b as SeoBaseline;
        if (b.source === 'ga4') existing.ga4 = b as SeoBaseline;
        result.set(b.seo_page_id, existing);
      });
      
      return result;
    },
    enabled: seoPageIds.length > 0,
    staleTime: 60000
  });
}

export function useResetBaseline() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      seoPageId, 
      source, 
      currentMetrics 
    }: { 
      seoPageId: string; 
      source: 'gsc' | 'ga4';
      currentMetrics: {
        clicks?: number;
        impressions?: number;
        ctr?: number;
        position?: number;
        users?: number;
        sessions?: number;
      };
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const now = new Date().toISOString();
      
      const payload = {
        seo_page_id: seoPageId,
        source,
        baseline_clicks: currentMetrics.clicks ?? null,
        baseline_impressions: currentMetrics.impressions ?? null,
        baseline_ctr: currentMetrics.ctr ?? null,
        baseline_position: currentMetrics.position ?? null,
        baseline_users: currentMetrics.users ?? null,
        baseline_sessions: currentMetrics.sessions ?? null,
        captured_at: now,
        reset_by: user.id,
        reset_at: now
      };
      
      const { error } = await supabase
        .from('seo_metric_baselines')
        .upsert(payload, { onConflict: 'seo_page_id,source' });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seo-baselines', variables.seoPageId] });
      queryClient.invalidateQueries({ queryKey: ['seo-baselines-list'] });
      toast({ title: `${variables.source.toUpperCase()} baseline reset` });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to reset baseline", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });
}

export function useCaptureBaseline() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      seoPageId, 
      source, 
      metrics 
    }: { 
      seoPageId: string; 
      source: 'gsc' | 'ga4';
      metrics: {
        clicks?: number;
        impressions?: number;
        ctr?: number;
        position?: number;
        users?: number;
        sessions?: number;
      };
    }) => {
      // Only insert if doesn't exist (never overwrite automatically)
      const { data: existing } = await supabase
        .from('seo_metric_baselines')
        .select('id')
        .eq('seo_page_id', seoPageId)
        .eq('source', source)
        .maybeSingle();
      
      if (existing) {
        // Baseline already exists, don't overwrite
        return null;
      }
      
      const payload = {
        seo_page_id: seoPageId,
        source,
        baseline_clicks: metrics.clicks ?? null,
        baseline_impressions: metrics.impressions ?? null,
        baseline_ctr: metrics.ctr ?? null,
        baseline_position: metrics.position ?? null,
        baseline_users: metrics.users ?? null,
        baseline_sessions: metrics.sessions ?? null,
        captured_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('seo_metric_baselines')
        .insert(payload);
      
      if (error) throw error;
      return payload;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seo-baselines', variables.seoPageId] });
      queryClient.invalidateQueries({ queryKey: ['seo-baselines-list'] });
    }
  });
}
