import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BoardContent {
  id: string;
  page_slug: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  updated_at: string;
}

export function useBoardContent(pageSlug: string) {
  const queryClient = useQueryClient();

  const { data: content, isLoading, error } = useQuery({
    queryKey: ['boardContent', pageSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('board_content')
        .select('*')
        .eq('page_slug', pageSlug)
        .single();

      if (error) throw error;
      return data as BoardContent;
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: async ({ content: newContent, title }: { content: string; title?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        content: newContent,
        updated_by: user?.id,
      };
      
      if (title) updateData.title = title;

      const { error } = await supabase
        .from('board_content')
        .update(updateData)
        .eq('page_slug', pageSlug);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boardContent', pageSlug] });
    },
  });

  return {
    content,
    isLoading,
    error,
    updateContent: updateContentMutation.mutate,
    isUpdating: updateContentMutation.isPending,
  };
}

export function useBoardMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['boardMetrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('board_metrics')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return data;
    },
  });

  return { metrics, isLoading };
}

export function useBoardDocuments() {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['boardDocuments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('board_documents')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data;
    },
  });

  return { documents, isLoading };
}
