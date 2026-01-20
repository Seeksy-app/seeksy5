/**
 * GBPLayout - Shared layout for all GBP Manager pages
 * 
 * Features:
 * - Tab navigation for GBP sections
 * - Sticky write mode warning banner
 * - Compact density styling
 */

import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GBPLayoutProps {
  children: ReactNode;
  title?: string;
  showTabs?: boolean;
}

const GBP_TABS = [
  { value: 'home', label: 'Overview', path: '/admin/gbp' },
  { value: 'locations', label: 'Locations', path: '/admin/gbp/locations' },
  { value: 'reviews', label: 'Reviews', path: '/admin/gbp/reviews' },
  { value: 'performance', label: 'Performance', path: '/admin/gbp/performance' },
  { value: 'audit', label: 'Audit', path: '/admin/gbp/audit' },
];

export function GBPLayout({ children, title, showTabs = true }: GBPLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Check write mode status
  const { data: adminSettings } = useQuery({
    queryKey: ['gbp-admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_admin_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching GBP admin settings:', error);
        return null;
      }
      return data;
    },
  });

  const isWriteModeEnabled = adminSettings?.write_mode_enabled ?? false;

  // Determine current tab from path
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/admin/gbp') return 'home';
    if (path.startsWith('/admin/gbp/location/')) return 'locations';
    const tab = GBP_TABS.find(t => t.path === path);
    return tab?.value || 'home';
  };

  const handleTabChange = (value: string) => {
    const tab = GBP_TABS.find(t => t.value === value);
    if (tab) {
      navigate(tab.path);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Write Mode Warning Banner */}
      {isWriteModeEnabled && (
        <div className="sticky top-0 z-50 bg-amber-500/90 text-amber-950 px-4 py-2 flex items-center gap-2 text-sm font-medium backdrop-blur-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>Write Mode is ENABLED - Changes will be pushed to Google Business Profile</span>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">
              {title || 'GBP Manager'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage Google Business Profile listings
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        {showTabs && (
          <Tabs value={getCurrentTab()} onValueChange={handleTabChange}>
            <TabsList className="h-9">
              {GBP_TABS.map(tab => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value}
                  className="text-sm px-3 py-1.5"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1320px] mx-auto px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
