import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUnreadUpdates(visibilityFilter?: string) {
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-updates', visibilityFilter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      // Get all updates for this visibility
      let query = (supabase as any).from('platform_updates').select('id');
      if (visibilityFilter) {
        query = query.contains('visibility', [visibilityFilter]);
      }
      const updatesResult = await query;
      const updates = updatesResult.data as any[] | null;
      if (!updates?.length) return 0;

      // Get read updates
      const readsResult = await (supabase as any)
        .from('user_update_reads')
        .select('update_id')
        .eq('user_id', user.id);

      const reads = readsResult.data as any[] | null;
      const readIds = new Set(reads?.map(r => r.update_id) || []);
      return updates.filter(u => !readIds.has(u.id)).length;
    }
  });

  const markAsRead = useMutation({
    mutationFn: async (updateId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase as any).from('user_update_reads').upsert({
        user_id: user.id,
        update_id: updateId
      }, { onConflict: 'user_id,update_id' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-updates'] });
    }
  });

  const markAllAsRead = useMutation({
    mutationFn: async (updateIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const inserts = updateIds.map(update_id => ({
        user_id: user.id,
        update_id
      }));

      await (supabase as any).from('user_update_reads').upsert(inserts, { onConflict: 'user_id,update_id' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-updates'] });
    }
  });

  return { unreadCount, markAsRead, markAllAsRead };
}
