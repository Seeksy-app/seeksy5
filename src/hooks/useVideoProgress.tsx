import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VideoProgress {
  id: string;
  user_id: string;
  video_id: string;
  seconds_watched: number;
  completed: boolean;
  updated_at: string;
}

const UNLOCK_THRESHOLD_SECONDS = 30;

export function useVideoProgress(videoId: string) {
  const queryClient = useQueryClient();

  const { data: progress, isLoading } = useQuery({
    queryKey: ['videoProgress', videoId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const result = await (supabase as any)
        .from('video_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .maybeSingle();

      if (result.error) throw result.error;
      return result.data as VideoProgress | null;
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (secondsWatched: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const completed = secondsWatched >= UNLOCK_THRESHOLD_SECONDS;

      const result = await (supabase as any)
        .from('video_progress')
        .upsert({
          user_id: user.id,
          video_id: videoId,
          seconds_watched: secondsWatched,
          completed,
        }, {
          onConflict: 'user_id,video_id'
        });

      if (result.error) throw result.error;
      return { secondsWatched, completed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoProgress', videoId] });
      queryClient.invalidateQueries({ queryKey: ['allVideoProgress'] });
    },
  });

  return {
    progress,
    isLoading,
    secondsWatched: progress?.seconds_watched || 0,
    isCompleted: progress?.completed || false,
    isUnlocked: (progress?.seconds_watched || 0) >= UNLOCK_THRESHOLD_SECONDS,
    updateProgress: updateProgressMutation.mutate,
    isUpdating: updateProgressMutation.isPending,
    UNLOCK_THRESHOLD_SECONDS,
  };
}

export function useAllVideoProgress() {
  const { data: allProgress, isLoading } = useQuery({
    queryKey: ['allVideoProgress'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const result = await (supabase as any)
        .from('video_progress')
        .select('*')
        .eq('user_id', user.id);

      if (result.error) throw result.error;
      return result.data as VideoProgress[];
    },
  });

  const getProgressForVideo = (videoId: string) => {
    return allProgress?.find(p => p.video_id === videoId);
  };

  const isVideoUnlocked = (videoId: string, index: number) => {
    // First video is always unlocked
    if (index === 0) return true;
    
    const progress = getProgressForVideo(videoId);
    return (progress?.seconds_watched || 0) >= UNLOCK_THRESHOLD_SECONDS;
  };

  return {
    allProgress,
    isLoading,
    getProgressForVideo,
    isVideoUnlocked,
  };
}
