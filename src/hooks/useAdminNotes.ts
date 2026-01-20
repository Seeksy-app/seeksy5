import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminNote {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  title: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  is_archived: boolean;
}

export function useAdminNotes(includeArchived = false) {
  
  return useQuery({
    queryKey: ['admin-notes', includeArchived],
    queryFn: async () => {
      let query = supabase
        .from('admin_notes')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });
      
      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as AdminNote[];
    },
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (note: Partial<AdminNote>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('admin_notes')
        .insert({
          created_by: user?.id,
          title: note.title || 'Untitled',
          content: note.content || '',
          tags: note.tags || [],
          is_pinned: note.is_pinned || false,
          is_archived: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as AdminNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AdminNote> & { id: string }) => {
      const { data, error } = await supabase
        .from('admin_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as AdminNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
      toast.success('Note deleted');
    },
  });
}
