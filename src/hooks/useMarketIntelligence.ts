import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarketIntelligenceSource {
  id: string;
  name: string;
  url: string;
  category: 'competitor' | 'industry_publication' | 'market_research' | 'news' | 'financial';
  description: string | null;
  is_active: boolean;
  refresh_frequency: 'hourly' | 'daily' | 'weekly';
  last_fetched_at: string | null;
  created_at: string;
}

export interface MarketIntelligenceInsight {
  id: string;
  source_id: string | null;
  insight_type: 'competitor_move' | 'market_trend' | 'pricing_update' | 'funding_announcement' | 'product_launch' | 'industry_shift' | 'regulatory_change';
  title: string;
  summary: string;
  key_points: string[];
  source_url: string | null;
  source_name: string | null;
  relevance_score: number;
  published_date: string | null;
  audience: string[];
  is_featured: boolean;
  is_archived: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MarketIntelligenceJob {
  id: string;
  job_type: 'full_refresh' | 'source_refresh' | 'search';
  status: 'pending' | 'running' | 'completed' | 'failed';
  source_id: string | null;
  query: string | null;
  results_count: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// Fetch all sources
export function useMarketIntelligenceSources() {
  return useQuery({
    queryKey: ['market-intelligence-sources'],
    queryFn: async () => {
      const result = await (supabase as any)
        .from('market_intelligence_sources')
        .select('*')
        .order('category', { ascending: true });

      if (result.error) throw result.error;
      return result.data as MarketIntelligenceSource[];
    }
  });
}

// Fetch insights with optional filters
export function useMarketIntelligenceInsights(options?: {
  audience?: string;
  insightType?: string;
  limit?: number;
  featured?: boolean;
}) {
  return useQuery({
    queryKey: ['market-intelligence-insights', options],
    queryFn: async () => {
      let query = (supabase as any)
        .from('market_intelligence_insights')
        .select('*')
        .eq('is_archived', false)
        .gte('relevance_score', 0.7)
        .order('created_at', { ascending: false });

      if (options?.audience) {
        query = query.contains('audience', [options.audience]);
      }
      if (options?.insightType) {
        query = query.eq('insight_type', options.insightType);
      }
      if (options?.featured) {
        query = query.eq('is_featured', true);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const result = await query;
      if (result.error) throw result.error;
      return result.data as MarketIntelligenceInsight[];
    }
  });
}

// Fetch recent jobs
export function useMarketIntelligenceJobs(limit = 10) {
  return useQuery({
    queryKey: ['market-intelligence-jobs', limit],
    queryFn: async () => {
      const result = await (supabase as any)
        .from('market_intelligence_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (result.error) throw result.error;
      return result.data as MarketIntelligenceJob[];
    }
  });
}

// Trigger source refresh
export function useRefreshSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      const { data, error } = await supabase.functions.invoke('fetch-market-intelligence', {
        body: { action: 'refresh_source', sourceId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-intelligence-insights'] });
      queryClient.invalidateQueries({ queryKey: ['market-intelligence-sources'] });
      queryClient.invalidateQueries({ queryKey: ['market-intelligence-jobs'] });
    }
  });
}

// Trigger web search
export function useMarketIntelligenceSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ query, category }: { query: string; category?: string }) => {
      const { data, error } = await supabase.functions.invoke('fetch-market-intelligence', {
        body: { action: 'search', query, category }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-intelligence-insights'] });
      queryClient.invalidateQueries({ queryKey: ['market-intelligence-jobs'] });
    }
  });
}

// Refresh all sources
export function useRefreshAllSources() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-market-intelligence', {
        body: { action: 'refresh_all' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-intelligence-insights'] });
      queryClient.invalidateQueries({ queryKey: ['market-intelligence-sources'] });
      queryClient.invalidateQueries({ queryKey: ['market-intelligence-jobs'] });
    }
  });
}

// Toggle insight featured status
export function useToggleInsightFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const result = await (supabase as any)
        .from('market_intelligence_insights')
        .update({ is_featured: featured })
        .eq('id', id);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-intelligence-insights'] });
    }
  });
}

// Archive insight
export function useArchiveInsight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await (supabase as any)
        .from('market_intelligence_insights')
        .update({ is_archived: true })
        .eq('id', id);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-intelligence-insights'] });
    }
  });
}

// Add new source
export function useAddSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (source: Omit<MarketIntelligenceSource, 'id' | 'created_at' | 'last_fetched_at'>) => {
      const result = await (supabase as any)
        .from('market_intelligence_sources')
        .insert(source)
        .select()
        .single();
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-intelligence-sources'] });
    }
  });
}

// Toggle source active status
export function useToggleSourceActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const result = await (supabase as any)
        .from('market_intelligence_sources')
        .update({ is_active: isActive })
        .eq('id', id);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-intelligence-sources'] });
    }
  });
}

// Delete source
export function useDeleteSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await (supabase as any)
        .from('market_intelligence_sources')
        .delete()
        .eq('id', id);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-intelligence-sources'] });
    }
  });
}
