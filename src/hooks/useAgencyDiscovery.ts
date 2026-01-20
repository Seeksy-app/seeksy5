import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgencyDiscoveryProfile {
  id: string;
  platform: string;
  username: string;
  profile_picture_url: string | null;
  followers: number;
  engagement_rate: number;
  niche_tags: string[];
  location: string | null;
  email: string | null;
  estimated_value_per_post: number;
  source: string;
  linked_profile_id: string | null;
  last_refreshed_at: string | null;
}

export interface DiscoveryFilters {
  platform?: string;
  minFollowers?: number;
  maxFollowers?: number;
  minEngagement?: number;
  maxEngagement?: number;
  nicheTags?: string[];
  location?: string;
  searchTerm?: string;
}

export function useAgencyDiscovery(filters: DiscoveryFilters = {}) {
  return useQuery({
    queryKey: ['agency-discovery', filters],
    queryFn: async () => {
      let query = supabase
        .from('agency_discovery_profiles')
        .select('*')
        .order('followers', { ascending: false });

      if (filters.platform) {
        query = query.eq('platform', filters.platform);
      }
      if (filters.minFollowers) {
        query = query.gte('followers', filters.minFollowers);
      }
      if (filters.maxFollowers) {
        query = query.lte('followers', filters.maxFollowers);
      }
      if (filters.minEngagement) {
        query = query.gte('engagement_rate', filters.minEngagement);
      }
      if (filters.maxEngagement) {
        query = query.lte('engagement_rate', filters.maxEngagement);
      }
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      if (filters.searchTerm) {
        query = query.ilike('username', `%${filters.searchTerm}%`);
      }
      if (filters.nicheTags && filters.nicheTags.length > 0) {
        query = query.overlaps('niche_tags', filters.nicheTags);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;

      return data as AgencyDiscoveryProfile[];
    },
  });
}

export function useDiscoveryStats() {
  return useQuery({
    queryKey: ['agency-discovery-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_discovery_profiles')
        .select('id, followers, engagement_rate, source');

      if (error) throw error;

      const totalProfiles = data?.length || 0;
      const connectedCreators = data?.filter(p => p.source === 'connected_creator').length || 0;
      const avgFollowers = data?.length 
        ? Math.round(data.reduce((sum, p) => sum + p.followers, 0) / data.length) 
        : 0;
      const avgEngagement = data?.length
        ? (data.reduce((sum, p) => sum + p.engagement_rate, 0) / data.length).toFixed(2)
        : '0';

      return {
        totalProfiles,
        connectedCreators,
        avgFollowers,
        avgEngagement,
      };
    },
  });
}
