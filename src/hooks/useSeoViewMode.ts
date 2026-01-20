import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SeoViewRole = 'owner' | 'agency' | 'admin';

export interface SeoViewConfig {
  role: SeoViewRole;
  defaultColumns: string[];
  showExports: boolean;
  showRawMetrics: boolean;
  showBaselineReset: boolean;
  showClientComparison: boolean;
}

const OWNER_CONFIG: SeoViewConfig = {
  role: 'owner',
  defaultColumns: ['score', 'gsc_clicks', 'ga4_users', 'alerts'],
  showExports: false,
  showRawMetrics: false,
  showBaselineReset: false,
  showClientComparison: false
};

const AGENCY_CONFIG: SeoViewConfig = {
  role: 'agency',
  defaultColumns: [
    'score', 
    'gsc_clicks', 'gsc_impressions', 'gsc_ctr', 'gsc_position',
    'ga4_users', 'ga4_sessions', 'ga4_views', 'ga4_engagement',
    'alerts'
  ],
  showExports: true,
  showRawMetrics: true,
  showBaselineReset: true,
  showClientComparison: true
};

const ADMIN_CONFIG: SeoViewConfig = {
  role: 'admin',
  defaultColumns: [
    'score', 
    'gsc_clicks', 'gsc_impressions', 'gsc_ctr', 'gsc_position',
    'ga4_users', 'ga4_sessions', 'ga4_views', 'ga4_engagement',
    'alerts'
  ],
  showExports: true,
  showRawMetrics: true,
  showBaselineReset: true,
  showClientComparison: true
};

export function useSeoViewMode(): { config: SeoViewConfig; isLoading: boolean } {
  const { data: userRole, isLoading } = useQuery({
    queryKey: ['user-workspace-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check if admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'super_admin');
      if (isAdmin) return 'admin';

      // Check workspace membership for agency detection
      const { data: memberships } = await supabase
        .from('workspace_members')
        .select('role, workspace:workspace_id(type)')
        .eq('user_id', user.id);

      const isAgency = memberships?.some(
        m => (m.workspace as any)?.type === 'agency' || m.role === 'agency_admin'
      );
      if (isAgency) return 'agency';

      return 'owner';
    },
    staleTime: 300000 // 5 minutes
  });

  if (isLoading || !userRole) {
    return { config: OWNER_CONFIG, isLoading };
  }

  switch (userRole) {
    case 'admin':
      return { config: ADMIN_CONFIG, isLoading: false };
    case 'agency':
      return { config: AGENCY_CONFIG, isLoading: false };
    default:
      return { config: OWNER_CONFIG, isLoading: false };
  }
}
