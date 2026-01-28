import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreatorValuation {
  id: string;
  user_id: string;
  profile_id: string;
  platform: string;
  calculated_at: string;
  followers: number;
  engagement_rate: number;
  avg_likes_per_post: number;
  avg_comments_per_post: number;
  est_reach_per_post: number;
  reel_price_low: number;
  reel_price_mid: number;
  reel_price_high: number;
  feed_post_price_low: number;
  feed_post_price_mid: number;
  feed_post_price_high: number;
  story_price_low: number;
  story_price_mid: number;
  story_price_high: number;
  currency: string;
  assumptions_json: {
    niche_multiplier?: number;
    platform_multiplier?: number;
    niche_tags?: string[];
    base_cpm?: Record<string, number>;
    posts_analyzed?: number;
    using_default_engagement?: boolean;
    content_types?: Record<string, string>;
  };
}

export function useCreatorValuation(profileId: string | null) {
  return useQuery({
    queryKey: ['creator-valuation', profileId],
    queryFn: async () => {
      if (!profileId) return null;

      const result = await (supabase as any)
        .from('creator_valuations')
        .select('*')
        .eq('profile_id', profileId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (result.error) throw result.error;
      return result.data as CreatorValuation | null;
    },
    enabled: !!profileId,
  });
}

export function useCalculateValuation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('calculate-creator-valuation', {
        body: { profile_id: profileId },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data, profileId) => {
      queryClient.invalidateQueries({ queryKey: ['creator-valuation', profileId] });
      toast.success('Valuation calculated successfully');
    },
    onError: (error) => {
      console.error('Valuation error:', error);
      toast.error('Failed to calculate valuation');
    },
  });

  return {
    calculateValuation: mutation.mutate,
    isCalculating: mutation.isPending,
  };
}
