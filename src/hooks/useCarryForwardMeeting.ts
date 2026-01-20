import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useCarryForwardMeeting() {
  const queryClient = useQueryClient();

  const carryForwardMutation = useMutation({
    mutationFn: async (completedMeetingId: string) => {
      const { data, error } = await supabase.functions.invoke('board-carry-forward-meeting', {
        body: { completed_meeting_id: completedMeetingId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['board-meeting-notes'] });
      queryClient.invalidateQueries({ queryKey: ['board-decisions'] });
      
      if (data.already_existed) {
        toast.info('Follow-up meeting already exists');
      } else {
        toast.success(
          `Created follow-up meeting with ${data.carried_agenda_items} agenda items and ${data.carried_decisions} decisions carried forward`
        );
      }
      
      // Push GTM event
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'board_meeting_carry_forward',
          source_meeting_id: data.source_meeting_id,
          new_meeting_id: data.new_meeting_id,
          carried_agenda_items: data.carried_agenda_items,
          carried_decisions: data.carried_decisions,
        });
      }
    },
    onError: (error: Error) => {
      console.error('Carry forward error:', error);
      toast.error(error.message || 'Failed to create follow-up meeting');
    },
  });

  return {
    carryForward: carryForwardMutation.mutate,
    carryForwardAsync: carryForwardMutation.mutateAsync,
    isCarryingForward: carryForwardMutation.isPending,
  };
}
