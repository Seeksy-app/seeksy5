import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SaveToRDParams {
  title: string;
  url: string | null;
  content: string;
  sourceName: string | null;
  tags?: string[];
}

export function useSaveInsightToRD() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SaveToRDParams) => {
      // Insert as an RD feed item - generate a unique guid
      const itemGuid = `mi-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const result = await (supabase as any)
        .from('rd_feed_items')
        .insert({
          item_guid: itemGuid,
          title: params.title,
          url: params.url,
          content_type: 'market_insight',
          source_name: params.sourceName || 'Market Intelligence',
          raw_content: params.content,
          cleaned_text: params.content,
          processed: true,
          published_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (result.error) throw result.error;
      const data = result.data as any;

      // If we have tags, create an insight record
      if (data && params.tags?.length) {
        await (supabase as any)
          .from('rd_insights')
          .insert({
            feed_item_id: data.id,
            summary: params.content.substring(0, 500),
            tags: params.tags,
            stance: 'neutral',
            confidence_score: 0.85,
          });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdFeedItems'] });
      queryClient.invalidateQueries({ queryKey: ['rdInsights'] });
      toast.success('Saved to R&D Intelligence Feeds');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save to R&D');
    }
  });
}

export function useScheduleSourceRefresh() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sourceId, frequency }: { sourceId: string; frequency: 'hourly' | 'daily' | 'weekly' }) => {
      const result = await (supabase as any)
        .from('market_intelligence_sources')
        .update({ refresh_frequency: frequency })
        .eq('id', sourceId);

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-intelligence-sources'] });
      toast.success('Refresh schedule updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update schedule');
    }
  });
}
