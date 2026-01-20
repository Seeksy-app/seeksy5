import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeArticle, PortalType } from '@/types/knowledge-blog';

export function useKnowledgeArticles(portal: PortalType, section?: string | null) {
  return useQuery({
    queryKey: ['knowledge-articles', portal, section],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_articles')
        .select('*')
        .eq('portal', portal)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (section) {
        query = query.eq('section', section);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as KnowledgeArticle[];
    }
  });
}

export function useKnowledgeArticle(portal: PortalType, slug: string) {
  return useQuery({
    queryKey: ['knowledge-article', portal, slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('portal', portal)
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      
      // Increment view count
      await supabase
        .from('knowledge_articles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);

      return data as KnowledgeArticle;
    },
    enabled: !!slug
  });
}

export function useSearchKnowledgeArticles(query: string, portal?: PortalType | null) {
  return useQuery({
    queryKey: ['knowledge-search', query, portal],
    queryFn: async () => {
      let dbQuery = supabase
        .from('knowledge_articles')
        .select('*')
        .eq('is_published', true)
        .textSearch('search_vector', query)
        .order('created_at', { ascending: false })
        .limit(50);

      if (portal) {
        dbQuery = dbQuery.eq('portal', portal);
      }

      const { data, error } = await dbQuery;
      if (error) throw error;
      return data as KnowledgeArticle[];
    },
    enabled: query.length > 2
  });
}

export function useRegenerateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-knowledge-article', {
        body: { articleId, regenerate: true }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-article'] });
    }
  });
}
