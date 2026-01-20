import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Json } from '@/integrations/supabase/types';

export interface SubItemConfig {
  id: string;
  visible: boolean;
  pinned: boolean;
  order: number;
}

export interface NavConfig {
  order: string[];
  hidden: string[];
  pinned: string[];
  subItems?: Record<string, SubItemConfig[]>;
}

export interface NavSubItem {
  id: string;
  label: string;
  path: string;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  isHome?: boolean;
  subItems?: NavSubItem[];
  /** Module ID required for this nav item to be visible (for module activation) */
  moduleId?: string;
  /** Navigation level: 0 = top-level (left-justified), 1 = sub-item (indented) */
  level: 0 | 1;
}

const DEFAULT_NAV_CONFIG: NavConfig = {
  order: [
    'my_workspaces',
    'my_page',
    'creator_hub',
    'my_day',
    'dashboard',
    'media_content',
    'seekies',
    'settings',
    'meetings',
    'events',
    'email',
    'marketing',
    'awards',
    'project_management',
  ],
  hidden: [],
  pinned: ['my_day', 'dashboard', 'creator_hub'],
  subItems: {}
};

const DEFAULT_ADMIN_NAV_CONFIG: NavConfig = {
  order: [
    'admin_dashboard',
    'admin_support',
    'admin_content',
    'admin_financials',
    'admin_users',
    'admin_rd',
    'admin_developer',
    'admin_advertising',
  ],
  hidden: [],
  pinned: ['admin_dashboard', 'admin_financials'],
  subItems: {}
};

const DEFAULT_LANDING_ROUTE = '/my-day';

/**
 * Creator navigation items - clean, consistent structure
 * Top-level items in order:
 * 1. My Workspaces
 * 2. Creator Hub
 * 3. My Day
 * 4. Dashboard
 * 5. Media & Content (with Studio Hub, AI Post-Production, AI Clip Generation, Media Library, Blog Posts, Podcasts)
 * 6. Seekies & Apps
 * 7. Email
 * 8. Marketing
 * 9. Settings
 * 10. Awards
 */
export const NAV_ITEMS: NavItem[] = [
  // Core nav items (always visible, no module requirement)
  { id: 'my_day', label: 'My Day', path: '/my-day', isHome: true, level: 0 },
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', isHome: true, level: 0 },
  { id: 'creator_hub', label: 'Creator Hub', path: '/creator-hub', isHome: true, level: 0 },
  { id: 'settings', label: 'Settings', path: '/settings', level: 0 },
  { id: 'my_workspaces', label: 'My Workspaces', path: '/apps?filter=my-workspaces', level: 0 },
  { id: 'seekies', label: 'Module Center', path: '/apps?view=modules', level: 0 },
  
  // Standalone module items (top-level when activated)
  { id: 'meetings', label: 'Meetings', path: '/meetings', level: 0, moduleId: 'meetings' },
  { id: 'events', label: 'Events', path: '/events', level: 0, moduleId: 'events' },
  { id: 'my_page', label: 'My Page', path: '/profile/edit', level: 0, moduleId: 'my-page' },
  { id: 'awards', label: 'Awards', path: '/awards', level: 0, moduleId: 'awards' },
  { id: 'project_management', label: 'Project Management', path: '/project-management', level: 0, moduleId: 'project-management' },
  { id: 'aars', label: 'AARs', path: '/aar', level: 0 },

  // Grouped module items (collapsible sections when activated)
  { 
    id: 'media_content', 
    label: 'Media & Content', 
    path: '/studio',
    level: 0,
    moduleId: 'studio',
    subItems: [
      { id: 'studio_hub', label: 'Studio Hub', path: '/studio' },
      { id: 'ai_post_production', label: 'AI Post-Production', path: '/studio/ai-post-production' },
      { id: 'ai_clip_generation', label: 'AI Clips Studio', path: '/clips-studio' },
      { id: 'content_library', label: 'Content Library', path: '/studio/media' },
      { id: 'podcasts', label: 'Podcasts', path: '/podcasts' },
    ]
  },
  { 
    id: 'email', 
    label: 'Email Suite', 
    path: '/email/inbox',
    level: 0,
    moduleId: 'email',
    subItems: [
      { id: 'email_inbox', label: 'Inbox', path: '/email/inbox' },
      { id: 'email_settings', label: 'Settings', path: '/email-settings' },
    ]
  },
  { 
    id: 'marketing', 
    label: 'Marketing', 
    path: '/contacts',
    level: 0,
    moduleId: 'marketing',
    subItems: [
      { id: 'marketing_blog', label: 'Blog', path: '/marketing/blog' },
      { id: 'marketing_newsletters', label: 'Newsletters', path: '/marketing/newsletters' },
      { id: 'marketing_subscribers', label: 'Subscriber Lists', path: '/marketing/subscribers' },
      { id: 'marketing_audience', label: 'Contacts & Audience', path: '/contacts' },
      { id: 'marketing_segments', label: 'Segments', path: '/marketing/segments' },
      { id: 'marketing_campaigns', label: 'Campaigns', path: '/marketing/campaigns' },
      { id: 'marketing_templates', label: 'Templates', path: '/marketing/templates' },
      { id: 'marketing_automations', label: 'Automations', path: '/marketing/automations' },
    ]
  },
];

export const LANDING_OPTIONS = [
  { id: '/my-day', label: 'My Day', description: 'Your daily schedule and action items' },
  { id: '/dashboard', label: 'Dashboard', description: 'Key metrics and performance snapshot' },
  { id: '/creator-hub', label: 'Creator Hub', description: 'Tools and monetization opportunities' },
];

function parseNavConfig(value: unknown): NavConfig | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  if (Array.isArray(obj.order) && Array.isArray(obj.hidden) && Array.isArray(obj.pinned)) {
    return {
      order: obj.order as string[],
      hidden: obj.hidden as string[],
      pinned: obj.pinned as string[],
      subItems: (obj.subItems as Record<string, SubItemConfig[]>) || {}
    };
  }
  return null;
}

export function useNavPreferences() {
  const [navConfig, setNavConfig] = useState<NavConfig>(DEFAULT_NAV_CONFIG);
  const [adminNavConfig, setAdminNavConfig] = useState<NavConfig>(DEFAULT_ADMIN_NAV_CONFIG);
  const [defaultLandingRoute, setDefaultLandingRoute] = useState<string>(DEFAULT_LANDING_ROUTE);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadPreferences();
  }, []);

  // Listen for nav preference updates from other components
  useEffect(() => {
    const handleNavUpdate = (event: CustomEvent<{ config: NavConfig; landingRoute: string; isAdmin?: boolean }>) => {
      if (event.detail) {
        if (event.detail.isAdmin) {
          setAdminNavConfig(event.detail.config);
        } else {
          setNavConfig(event.detail.config);
        }
        setDefaultLandingRoute(event.detail.landingRoute);
      }
    };
    window.addEventListener('navPreferencesUpdated', handleNavUpdate as EventListener);
    return () => window.removeEventListener('navPreferencesUpdated', handleNavUpdate as EventListener);
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      setUserId(user.id);

      const { data, error } = await supabase
        .from('user_preferences')
        .select('nav_config, admin_nav_config, default_landing_route')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading nav preferences:', error);
      }

      if (data) {
        const parsed = parseNavConfig(data.nav_config);
        if (parsed) {
          setNavConfig(parsed);
        }
        const adminParsed = parseNavConfig(data.admin_nav_config);
        if (adminParsed) {
          setAdminNavConfig(adminParsed);
        }
        if (data.default_landing_route) {
          setDefaultLandingRoute(data.default_landing_route);
        }
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = useCallback(async (config: NavConfig, landingRoute: string, isAdmin: boolean = false) => {
    if (!userId) return;

    try {
      // First check if record exists
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .single();

      const updateData = isAdmin
        ? {
            admin_nav_config: config as unknown as Json,
            default_landing_route: landingRoute,
            updated_at: new Date().toISOString()
          }
        : {
            nav_config: config as unknown as Json,
            default_landing_route: landingRoute,
            updated_at: new Date().toISOString()
          };

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('user_preferences')
          .update(updateData)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            ...updateData,
          });
        if (error) throw error;
      }

      if (isAdmin) {
        setAdminNavConfig(config);
      } else {
        setNavConfig(config);
      }
      setDefaultLandingRoute(landingRoute);
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      
      // Dispatch event to notify sidebar to refresh immediately
      window.dispatchEvent(new CustomEvent('navPreferencesUpdated', { 
        detail: { config, landingRoute, isAdmin } 
      }));
    } catch (err) {
      console.error('Error saving preferences:', err);
      throw err;
    }
  }, [userId, queryClient]);

  const resetToDefaults = useCallback(async (isAdmin: boolean = false) => {
    if (isAdmin) {
      await savePreferences(DEFAULT_ADMIN_NAV_CONFIG, '/admin', true);
    } else {
      await savePreferences(DEFAULT_NAV_CONFIG, DEFAULT_LANDING_ROUTE, false);
    }
  }, [savePreferences]);

  return {
    navConfig,
    adminNavConfig,
    defaultLandingRoute,
    isLoading,
    savePreferences,
    resetToDefaults,
    NAV_ITEMS,
    LANDING_OPTIONS
  };
}
