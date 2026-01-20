import { supabase } from "@/integrations/supabase/client";

export type BoardActivityType = 'login' | 'video_watch' | 'share' | 'page_view';

type ActivityData = Record<string, unknown>;

export async function logBoardActivity(
  activityType: BoardActivityType,
  activityData: ActivityData = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("board_member_activity")
      .insert({
        user_id: user.id,
        activity_type: activityType,
        activity_data: activityData,
      });

    if (error) {
      console.error("Error logging board activity:", error);
    }
  } catch (error) {
    console.error("Error logging board activity:", error);
  }
}

export const BoardActivityLogger = {
  login: () => logBoardActivity('login', { timestamp: new Date().toISOString() }),
  
  videoWatch: (videoId: string, videoTitle: string, watchDurationSeconds: number, totalDurationSeconds: number) =>
    logBoardActivity('video_watch', {
      videoId,
      videoTitle,
      watchDurationSeconds,
      totalDurationSeconds,
      percentWatched: Math.round((watchDurationSeconds / totalDurationSeconds) * 100),
    }),
  
  share: (shareType: 'investor_link' | 'document' | 'video', sharedItemTitle?: string, recipientEmail?: string) =>
    logBoardActivity('share', {
      shareType,
      sharedItemTitle,
      recipientEmail,
    }),
  
  pageView: (pagePath: string, pageTitle: string) =>
    logBoardActivity('page_view', { pagePath, pageTitle }),
};
