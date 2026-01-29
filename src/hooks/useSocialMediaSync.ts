import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SocialProfile {
  id: string;
  user_id: string;
  platform: string;
  platform_user_id: string | null;
  username: string | null;
  profile_picture: string | null;
  account_type: string | null;
  biography: string | null;
  followers_count: number;
  follows_count: number;
  media_count: number;
  connected_at: string;
  updated_at: string;
  last_sync_at: string | null;
  sync_status: string;
  sync_error: string | null;
  token_expires_at: string | null;
}

export interface SocialPost {
  id: string;
  profile_id: string;
  post_id: string;
  media_url: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  media_type: string | null;
  permalink: string | null;
  timestamp: string | null;
  like_count: number;
  comment_count: number;
  engagement_rate: number;
  impressions: number;
  reach: number;
  saved: number;
  views_count?: number;
}

export interface SocialInsight {
  id: string;
  profile_id: string;
  snapshot_date: string;
  impressions: number;
  reach: number;
  profile_views: number;
  website_clicks: number;
  email_contacts: number;
  follower_count: number;
  engagement_rate: number;
  accounts_engaged: number;
  total_interactions: number;
}

export interface SocialComment {
  id: string;
  post_id: string;
  comment_id: string;
  text: string | null;
  username: string | null;
  timestamp: string | null;
  like_count: number;
}

export function useSocialProfiles() {
  return useQuery({
    queryKey: ['social-profiles'],
    queryFn: async () => {
      const result = await (supabase as any)
        .from('social_media_profiles')
        .select('*')
        .order('connected_at', { ascending: false });

      if (result.error) {
        console.error('Error fetching social profiles:', result.error);
        throw result.error;
      }
      console.log('Fetched social profiles:', result.data?.length || 0, 'profiles');
      return result.data as SocialProfile[];
    },
  });
}

export function useSocialPosts(profileId: string | null) {
  return useQuery({
    queryKey: ['social-posts', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      const result = await (supabase as any)
        .from('social_media_posts')
        .select('*')
        .eq('profile_id', profileId)
        .order('timestamp', { ascending: false });

      if (result.error) throw result.error;
      return result.data as SocialPost[];
    },
    enabled: !!profileId,
  });
}

export function useSocialInsights(profileId: string | null) {
  return useQuery({
    queryKey: ['social-insights', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      const result = await (supabase as any)
        .from('social_insights_snapshots')
        .select('*')
        .eq('profile_id', profileId)
        .order('snapshot_date', { ascending: false })
        .limit(30);

      if (result.error) throw result.error;
      return result.data as SocialInsight[];
    },
    enabled: !!profileId,
  });
}

export function useSocialComments(postId: string | null) {
  return useQuery({
    queryKey: ['social-comments', postId],
    queryFn: async () => {
      if (!postId) return [];
      
      const result = await (supabase as any)
        .from('social_media_comments')
        .select('*')
        .eq('post_id', postId)
        .order('timestamp', { ascending: false });

      if (result.error) throw result.error;
      return result.data as SocialComment[];
    },
    enabled: !!postId,
  });
}

export function useSyncSocialData() {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const syncMutation = useMutation({
    mutationFn: async (profileId?: string) => {
      setIsSyncing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('meta-sync-social-data', {
        body: profileId ? { profile_id: profileId } : {},
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      setIsSyncing(false);
      queryClient.invalidateQueries({ queryKey: ['social-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      queryClient.invalidateQueries({ queryKey: ['social-insights'] });
      queryClient.invalidateQueries({ queryKey: ['social-comments'] });
      
      toast.success(`Sync complete — ${data.posts_synced} posts updated`);
    },
    onError: (error) => {
      setIsSyncing(false);
      console.error('Sync error:', error);
      toast.error('Failed to sync social data');
    },
  });

  return {
    syncData: syncMutation.mutate,
    isSyncing: isSyncing || syncMutation.isPending,
  };
}

export function useLatestInsights(profileId: string | null) {
  return useQuery({
    queryKey: ['latest-insights', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      
      const result = await (supabase as any)
        .from('social_insights_snapshots')
        .select('*')
        .eq('profile_id', profileId)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (result.error && result.error.code !== 'PGRST116') throw result.error;
      return result.data as SocialInsight | null;
    },
    enabled: !!profileId,
  });
}

export function useTopPosts(profileId: string | null, limit = 5) {
  return useQuery({
    queryKey: ['top-posts', profileId, limit],
    queryFn: async () => {
      if (!profileId) return [];
      
      const result = await (supabase as any)
        .from('social_media_posts')
        .select('*')
        .eq('profile_id', profileId)
        .order('engagement_rate', { ascending: false })
        .limit(limit);

      if (result.error) throw result.error;
      return result.data as SocialPost[];
    },
    enabled: !!profileId,
  });
}
