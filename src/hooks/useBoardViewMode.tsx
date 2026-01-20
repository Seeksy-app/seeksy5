import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from './useUserRoles';

export function useBoardViewMode() {
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRoles();
  const canToggleBoardView = isAdmin; // isAdmin already includes super_admin

  const { data: viewMode, isLoading } = useQuery({
    queryKey: ['adminViewMode'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { viewAsBoard: false };

      const { data, error } = await supabase
        .from('admin_view_mode')
        .select('view_as_board')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching view mode:', error);
        return { viewAsBoard: false };
      }

      return { viewAsBoard: data?.view_as_board || false };
    },
    enabled: canToggleBoardView,
  });

  const toggleBoardViewMutation = useMutation({
    mutationFn: async (viewAsBoard: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('admin_view_mode')
        .upsert({
          user_id: user.id,
          view_as_board: viewAsBoard,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      return viewAsBoard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminViewMode'] });
    },
  });

  const toggleBoardView = (): Promise<boolean> => {
    const newValue = !viewMode?.viewAsBoard;
    return new Promise((resolve, reject) => {
      toggleBoardViewMutation.mutate(newValue, {
        onSuccess: () => resolve(newValue),
        onError: (error) => reject(error),
      });
    });
  };

  return {
    isViewingAsBoard: viewMode?.viewAsBoard || false,
    canToggleBoardView,
    toggleBoardView,
    isLoading,
    isToggling: toggleBoardViewMutation.isPending,
  };
}
