import { useQuery } from "@tanstack/react-query";
import { supabase, type Json } from "@/integrations/supabase/client";

interface BoardMemberStats {
  userId: string;
  displayName: string;
  email: string;
  totalLogins: number;
  lastLogin: string | null;
  totalVideoWatches: number;
  totalWatchTimeSeconds: number;
  videosWatched: Array<{
    videoTitle: string;
    watchCount: number;
    totalWatchTimeSeconds: number;
    avgPercentWatched: number;
  }>;
  totalShares: number;
  sharesByType: Record<string, number>;
  totalPageViews: number;
}

interface ActivityRecord {
  id: string;
  user_id: string;
  activity_type: string;
  activity_data: Json;
  created_at: string;
}

export function useBoardMemberAnalytics() {
  return useQuery({
    queryKey: ["board-member-analytics"],
    queryFn: async (): Promise<BoardMemberStats[]> => {
      // Get all board members
      const rolesResult = await (supabase as any)
        .from("user_roles")
        .select("user_id")
        .eq("role", "board_member");

      if (rolesResult.error) throw rolesResult.error;
      const boardMembers = rolesResult.data as any[];

      // Get profiles for board members
      const userIds = boardMembers?.map((m: any) => m.user_id) || [];
      const profilesResult = await (supabase as any)
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      
      const profiles = profilesResult.data as any[];

      // Get all board activity
      const activitiesResult = await (supabase as any)
        .from("board_member_activity")
        .select("*")
        .order("created_at", { ascending: false });

      if (activitiesResult.error) throw activitiesResult.error;

      const activitiesTyped = (activitiesResult.data || []) as ActivityRecord[];

      // Process data for each board member
      const stats: BoardMemberStats[] = (boardMembers || []).map((member: any) => {
        const profile = profiles?.find((p: any) => p.id === member.user_id);
        const userActivities = activitiesTyped.filter(a => a.user_id === member.user_id);

        // Login stats
        const logins = userActivities.filter(a => a.activity_type === "login");
        const lastLogin = logins.length > 0 ? logins[0].created_at : null;

        // Video watch stats
        const videoWatches = userActivities.filter(a => a.activity_type === "video_watch");
        const videoMap = new Map<string, { watchCount: number; totalSeconds: number; percentages: number[] }>();
        
        videoWatches.forEach((watch) => {
          const data = watch.activity_data as Record<string, unknown> | null;
          const title = (data?.videoTitle as string) || "Unknown";
          const existing = videoMap.get(title) || { watchCount: 0, totalSeconds: 0, percentages: [] };
          existing.watchCount++;
          existing.totalSeconds += (data?.watchDurationSeconds as number) || 0;
          existing.percentages.push((data?.percentWatched as number) || 0);
          videoMap.set(title, existing);
        });

        const videosWatched = Array.from(videoMap.entries()).map(([title, data]) => ({
          videoTitle: title,
          watchCount: data.watchCount,
          totalWatchTimeSeconds: data.totalSeconds,
          avgPercentWatched: data.percentages.length > 0 
            ? Math.round(data.percentages.reduce((a, b) => a + b, 0) / data.percentages.length)
            : 0,
        }));

        // Share stats
        const shares = userActivities.filter(a => a.activity_type === "share");
        const sharesByType: Record<string, number> = {};
        shares.forEach((share) => {
          const data = share.activity_data as Record<string, unknown> | null;
          const type = (data?.shareType as string) || "unknown";
          sharesByType[type] = (sharesByType[type] || 0) + 1;
        });

        // Page view stats
        const pageViews = userActivities.filter(a => a.activity_type === "page_view");

        // Calculate total watch time
        const totalWatchTimeSeconds = videoWatches.reduce((sum, w) => {
          const data = w.activity_data as Record<string, unknown> | null;
          return sum + ((data?.watchDurationSeconds as number) || 0);
        }, 0);

        return {
          userId: member.user_id,
          displayName: profile?.full_name || "Unknown",
          email: "",
          totalLogins: logins.length,
          lastLogin,
          totalVideoWatches: videoWatches.length,
          totalWatchTimeSeconds,
          videosWatched,
          totalShares: shares.length,
          sharesByType,
          totalPageViews: pageViews.length,
        };
      });

      return stats;
    },
  });
}

export function useBoardMemberActivityLog(userId?: string) {
  return useQuery({
    queryKey: ["board-member-activity-log", userId],
    queryFn: async () => {
      let query = (supabase as any)
        .from("board_member_activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const result = await query;
      if (result.error) throw result.error;
      return result.data as ActivityRecord[];
    },
  });
}
