import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CFOLockStatus {
  id: string;
  is_locked: boolean;
  locked_by: string | null;
  locked_at: string | null;
  updated_at: string;
}

export function useCFOLockStatus() {
  const queryClient = useQueryClient();

  const { data: lockStatus, isLoading } = useQuery({
    queryKey: ['cfo-lock-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cfo_lock_status')
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data as CFOLockStatus;
    },
  });

  const toggleLock = useMutation({
    mutationFn: async (lock: boolean) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('cfo_lock_status')
        .update({
          is_locked: lock,
          locked_by: lock ? user.user?.id : null,
          locked_at: lock ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .not('id', 'is', null); // Update the only row
      
      if (error) throw error;
    },
    onSuccess: (_, lock) => {
      queryClient.invalidateQueries({ queryKey: ['cfo-lock-status'] });
      toast.success(lock ? 'Assumptions locked for Board' : 'Assumptions unlocked');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update lock: ${error.message}`);
    },
  });

  return {
    isLocked: lockStatus?.is_locked ?? false,
    lockedAt: lockStatus?.locked_at,
    lockedBy: lockStatus?.locked_by,
    isLoading,
    toggleLock: toggleLock.mutate,
    isToggling: toggleLock.isPending,
  };
}
