/**
 * Role-based sidebar
 * 
 * For Creators: Uses NAV_ITEMS from useNavPreferences as source of truth
 * For Admins: Shows admin-specific collapsible groups from NAVIGATION_CONFIG
 */

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  User as UserIcon,
  Settings,
  Grid3x3,
  Users,
  History,
  FileText,
  Megaphone,
  MessageSquare,
  Target,
  Clapperboard,
  Library,
  Scissors,
  Mic,
  FileAudio,
  Podcast,
  FolderOpen,
  Plus,
  DollarSign,
  BookOpen,
  UserCog,
  Puzzle,
  Activity,
  HelpCircle,
  Layers,
  Code,
  Sparkles,
  Shield,
  Image,
  Layout,
  Wand2,
  Palette,
  Camera,
  Scale,
  Fingerprint,
  ShieldCheck,
  Tag,
  Award,
  Hexagon,
  Radio,
  TrendingUp,
  FileBarChart,
  Calculator,
  Headphones,
  CreditCard,
  Banknote,
  FileSpreadsheet,
  Network,
  Key,
  Bot,
  MessageCircle,
  Inbox,
  Video,
  Coins,
  Calendar,
  Send,
  Zap,
  Rocket,
  Briefcase,
  Sliders,
  Rss,
  Wrench,
  Globe,
  UserPlus,
  BarChart2,
  ScrollText,
  Webhook,
  Mail,
  Instagram,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Package,
  LogOut,
  MoreHorizontal,
  ExternalLink,
  Star,
  Trash2,
  FolderInput,
} from "lucide-react";
import { clearPortalStorage } from "@/contexts/PortalContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Pin, PinOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NavLink } from "@/components/NavLink";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NAVIGATION_CONFIG, filterNavigationByRoles } from "@/config/navigation";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAccountType } from "@/hooks/useAccountType";
import { useRoleBasedNavigation } from "@/hooks/useRoleBasedNavigation";
import { SparkIcon } from "@/components/spark/SparkIcon";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useModuleActivation } from "@/hooks/useModuleActivation";
import { useNavPreferences, NAV_ITEMS } from "@/hooks/useNavPreferences";
import { useCustomPackages } from "@/hooks/useCustomPackages";
import { toast } from "sonner";

interface RoleBasedSidebarProps {
  user?: User | null;
}

// Mapping of nav item IDs to module IDs for module-gated features
// Items without a mapping are always visible (core nav)
const NAV_TO_MODULE_MAP: Record<string, string> = {
  'meetings': 'meetings',
  'media_content': 'studio',
  'email': 'email',
  'marketing': 'marketing',
  'awards': 'awards',
  'project_management': 'project-management',
};

// Icon mapping for all nav items
const ICON_MAP: Record<string, any> = {
  // Nav item IDs
  'my_day': Calendar,
  'dashboard': LayoutDashboard,
  'creator_hub': Rocket,
  'my_streaming_channel': Radio,
  'my_workspaces': Package,
  'meetings': Calendar,
  'events': Calendar,
  'my_page': Layout,
  'studio': Video,
  'social_analytics': BarChart2,
  'media_content': Clapperboard,
  'monetization': DollarSign,
  'seekies': Grid3x3,
  'email': Mail,
  'marketing': Megaphone,
  'settings': Settings,
  'awards': Award,
  'aars': FileText,
  // Legacy icon names
  home: LayoutDashboard,
  'layout-dashboard': LayoutDashboard,
  user: UserIcon,
  link: Network,
  'grid-3x3': Grid3x3,
  users: Users,
  history: History,
  'file-text': FileText,
  megaphone: Megaphone,
  'message-square': MessageSquare,
  target: Target,
  clapperboard: Clapperboard,
  library: Library,
  scissors: Scissors,
  mic: Mic,
  'file-audio': FileAudio,
  podcast: Podcast,
  'folder-open': FolderOpen,
  plus: Plus,
  'dollar-sign': DollarSign,
  'book-open': BookOpen,
  'user-cog': UserCog,
  puzzle: Puzzle,
  activity: Activity,
  'help-circle': HelpCircle,
  layers: Layers,
  code: Code,
  sparkles: Sparkles,
  shield: Shield,
  image: Image,
  layout: Layout,
  'wand-2': Wand2,
  palette: Palette,
  camera: Camera,
  scale: Scale,
  fingerprint: Fingerprint,
  'shield-check': ShieldCheck,
  tag: Tag,
  award: Award,
  hexagon: Hexagon,
  radio: Radio,
  'trending-up': TrendingUp,
  'file-bar-chart': FileBarChart,
  calculator: Calculator,
  headphones: Headphones,
  'credit-card': CreditCard,
  banknote: Banknote,
  'file-spreadsheet': FileSpreadsheet,
  network: Network,
  key: Key,
  bot: Bot,
  'message-circle': MessageCircle,
  inbox: Inbox,
  video: Video,
  coins: Coins,
  calendar: Calendar,
  send: Send,
  zap: Zap,
  rocket: Rocket,
  briefcase: Briefcase,
  sliders: Sliders,
  rss: Rss,
  wrench: Wrench,
  globe: Globe,
  'user-plus': UserPlus,
  'bar-chart-2': BarChart2,
  'scroll-text': ScrollText,
  webhook: Webhook,
  mail: Mail,
  instagram: Instagram,
  play: Play,
  package: Package,
};

// Module ID to icon mapping for active apps
const MODULE_ICON_MAP: Record<string, any> = {
  'audience-insights': BarChart2,
  'social-analytics': BarChart2,
  'studio': Video,
  'podcasts': Podcast,
  'media-library': Image,
  'clips-editing': Scissors,
  'contacts': Users,
  'segments': Target,
  'campaigns': Megaphone,
  'email-templates': Mail,
  'automations': Zap,
  'sms': MessageCircle,
  'forms': FileText,
  'qr-codes': Grid3x3,
  'meetings': Calendar,
  'events': Calendar,
  'proposals': FileText,
  'tasks': Activity,
  'polls': MessageSquare,
  'awards': Award,
  'team': Users,
  'my-page': Layout,
  'identity-verification': Shield,
  'social-connect': Instagram,
  'marketing': Megaphone,
  'email': Mail,
  'content-library': FolderOpen,
  'clips': Scissors,
};

// Module ID to route mapping
const MODULE_ROUTE_MAP: Record<string, string> = {
  'audience-insights': '/social-analytics',
  'social-analytics': '/social-analytics',
  'studio': '/studio',
  'podcasts': '/podcasts',
  'media-library': '/studio/media',
  'clips-editing': '/clips',
  'contacts': '/audience',
  'segments': '/marketing/segments',
  'campaigns': '/marketing/campaigns',
  'email-templates': '/marketing/templates',
  'automations': '/marketing/automations',
  'sms': '/sms',
  'forms': '/forms',
  'qr-codes': '/qr-codes',
  'meetings': '/meetings',
  'events': '/events',
  'proposals': '/proposals',
  'tasks': '/tasks',
  'polls': '/polls',
  'awards': '/awards',
  'team': '/team',
  'my-page': '/profile/edit',
  'identity-verification': '/identity',
  'social-connect': '/integrations',
  'marketing': '/contacts',
  'email': '/email/inbox',
  'content-library': '/studio/media',
  'clips': '/clips',
};

// Module ID to display name mapping
const MODULE_NAME_MAP: Record<string, string> = {
  'audience-insights': 'Audience Insights',
  'social-analytics': 'Social Analytics',
  'studio': 'Studio',
  'podcasts': 'Podcasts',
  'media-library': 'Media Library',
  'clips-editing': 'Clips & Editing',
  'contacts': 'Contacts',
  'segments': 'Segments',
  'campaigns': 'Campaigns',
  'email-templates': 'Email Templates',
  'automations': 'Automations',
  'sms': 'SMS',
  'forms': 'Forms',
  'qr-codes': 'QR Codes',
  'meetings': 'Meetings',
  'events': 'Events',
  'proposals': 'Proposals',
  'tasks': 'Tasks',
  'polls': 'Polls & Surveys',
  'awards': 'Awards',
  'team': 'Team',
  'my-page': 'My Page',
  'identity-verification': 'Identity',
  'social-connect': 'Social Connect',
  'marketing': 'Marketing',
  'email': 'Email',
  'content-library': 'Content Library',
  'clips': 'AI Clips',
};

export function RoleBasedSidebar({ user }: RoleBasedSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { roles, isLoading: rolesLoading, isAdmin } = useUserRoles();
  const { activeAccountType } = useAccountType();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const { activatedModuleIds, isLoading: modulesLoading } = useModuleActivation();
  const { navConfig, adminNavConfig, isLoading: navLoading, savePreferences, defaultLandingRoute } = useNavPreferences();
  const { packages: customPackages } = useCustomPackages();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // User info for bottom section
  const [userEmail, setUserEmail] = useState<string>("");
  const [userInitials, setUserInitials] = useState<string>("U");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Fetch user info for bottom section
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUserEmail(authUser.email || "");
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url, account_avatar_url, full_name, account_full_name")
          .eq("id", authUser.id)
          .single();
        if (profile) {
          setAvatarUrl(profile.avatar_url || profile.account_avatar_url);
          const name = profile.full_name || profile.account_full_name;
          setUserInitials(name?.[0]?.toUpperCase() || authUser.email?.[0]?.toUpperCase() || "U");
        }
      }
    };
    fetchUser();
  }, []);
  
  const handleLogout = async () => {
    clearPortalStorage();
    await supabase.auth.signOut();
    navigate("/auth");
  };
  
  // Use permission-based navigation filtering for admin nav
  const { navigation: permissionFilteredNav, canAccessPath, isLoading: rbacLoading } = useRoleBasedNavigation();

  // CRITICAL: Determine if we're on an admin route based on URL path
  // This takes precedence over role loading state to prevent nav flicker
  const isAdminRoute = location.pathname.startsWith('/admin') || 
                       location.pathname.startsWith('/cfo') ||
                       location.pathname.startsWith('/helpdesk');
  
  // Use route-based admin detection OR role-based admin detection
  // This ensures admin nav shows on admin routes even during role loading
  const shouldShowAdminNav = isAdminRoute || isAdmin;

  // Handle logo click - navigate to default landing (My Day for creators, /admin for admins)
  const handleLogoClick = () => {
    const defaultRoute = shouldShowAdminNav ? '/admin' : '/my-day';
    navigate(defaultRoute);
  };
  
  // Use persisted sidebar state with localStorage
  const { openGroups, toggleGroup, isGroupOpen } = useSidebarState();

  // Listen for nav preference updates to force re-render
  useEffect(() => {
    const handleNavUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('navPreferencesUpdated', handleNavUpdate);
    return () => window.removeEventListener('navPreferencesUpdated', handleNavUpdate);
  }, []);

  // Show loading state only for non-admin routes OR if there's no user at all
  // On admin routes, we proceed to render navigation from config even during loading
  // to prevent the empty sidebar flash
  if (!user) {
    return null;
  }
  
  // For admin routes, don't wait for all loading states - use config directly
  // This prevents the empty sidebar issue when roles are still loading
  const isStillLoadingForNonAdmin = !isAdminRoute && (rolesLoading || navLoading);
  if (isStillLoadingForNonAdmin) {
    return null;
  }

  // Check if a nav item should be visible based on user preferences
  const isNavItemVisibleByNavConfig = (itemId: string): boolean => {
    if (navConfig.hidden.includes(itemId)) {
      return false;
    }
    return true;
  };

  // Check if a nav item should be visible based on module activation
  // Uses the moduleId from NAV_ITEMS or falls back to NAV_TO_MODULE_MAP
  const isModuleActivated = (item: typeof NAV_ITEMS[0]): boolean => {
    const requiredModule = item.moduleId || NAV_TO_MODULE_MAP[item.id];
    if (!requiredModule) return true; // No module requirement - always visible
    if (shouldShowAdminNav) return true; // Admins/admin routes see all
    return activatedModuleIds.includes(requiredModule);
  };

  // Build nav items from NAV_ITEMS respecting user config and module activation
  const userNavItems = NAV_ITEMS
    .filter(item => isNavItemVisibleByNavConfig(item.id) && isModuleActivated(item))
    .sort((a, b) => {
      const aIndex = navConfig.order.indexOf(a.id);
      const bIndex = navConfig.order.indexOf(b.id);
      // Items not in order go to the END (use a large number)
      const aSort = aIndex === -1 ? 9999 : aIndex;
      const bSort = bIndex === -1 ? 9999 : bIndex;
      return aSort - bSort;
    });

  // Helper to check if an admin nav group is hidden based on adminNavConfig
  // The modal generates IDs like: admin_group_${group.toLowerCase().replace(/[^a-z0-9]/g, '_')}
  const isAdminGroupHidden = (groupName: string): boolean => {
    const generatedId = `admin_group_${groupName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    return adminNavConfig.hidden.includes(generatedId);
  };

  // Use permission-filtered navigation for admin routes/users (combines role + permission checks)
  // On admin routes, if permission nav is empty (due to loading, no roles, or permission issues), 
  // use full config to prevent empty sidebar
  const adminNavFromConfig = shouldShowAdminNav && permissionFilteredNav.length === 0
    ? NAVIGATION_CONFIG.navigation.filter(g => g.collapsible)
    : permissionFilteredNav;
  
  // Apply adminNavConfig hidden preferences to filter out hidden groups
  const filteredByPreferences = adminNavFromConfig.filter(group => !isAdminGroupHidden(group.group));
  
  // Sort by adminNavConfig.order
  const sortedAdminNav = [...filteredByPreferences].sort((a, b) => {
    const aId = `admin_group_${a.group.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const bId = `admin_group_${b.group.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const aIndex = adminNavConfig.order.indexOf(aId);
    const bIndex = adminNavConfig.order.indexOf(bId);
    // Items not in order go to the end
    const aSort = aIndex === -1 ? 9999 : aIndex;
    const bSort = bIndex === -1 ? 9999 : bIndex;
    return aSort - bSort;
  });
  
  const filteredNavigation = shouldShowAdminNav ? sortedAdminNav : [];

  // Collect all admin nav items with their group info for pinning
  const allAdminNavItems = filteredNavigation.flatMap(group => 
    group.items.map(item => ({ ...item, groupName: group.group }))
  );

  // Get pinned items from adminNavConfig  
  const pinnedItemIds = adminNavConfig.pinned || [];
  const pinnedItems = pinnedItemIds
    .map(id => allAdminNavItems.find(item => item.id === id))
    .filter(Boolean) as (typeof allAdminNavItems[0])[];

  // Handle pin/unpin for admin nav items
  const handleTogglePin = async (itemId: string, itemLabel: string) => {
    const currentPinned = [...(adminNavConfig.pinned || [])];
    const isPinned = currentPinned.includes(itemId);
    
    let newPinned: string[];
    if (isPinned) {
      newPinned = currentPinned.filter(id => id !== itemId);
      toast.success(`Unpinned "${itemLabel}"`);
    } else {
      newPinned = [...currentPinned, itemId];
      toast.success(`Pinned "${itemLabel}" to top`);
    }
    
    const newConfig = {
      ...adminNavConfig,
      pinned: newPinned
    };
    
    await savePreferences(newConfig, defaultLandingRoute, true);
  };

  const isItemPinned = (itemId: string) => pinnedItemIds.includes(itemId);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3 bg-sidebar">
        <div className="flex items-center justify-between w-full gap-2">
          {!collapsed && (
            <button 
              onClick={handleLogoClick}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
              title="Go to Dashboard"
            >
              <SparkIcon variant="holiday" size={48} animated pose="waving" />
              <span className="text-sidebar-foreground text-2xl font-bold">Seeksy</span>
            </button>
          )}
          {collapsed && (
            <button 
              onClick={handleLogoClick}
              className="flex items-center justify-center flex-1 hover:opacity-80 transition-opacity cursor-pointer"
              title="Go to Dashboard"
            >
              <SparkIcon variant="holiday" size={32} animated pose="idle" />
            </button>
          )}
          <div className="flex items-center gap-1">
            {/* Customize Nav Icon Button */}
            {!collapsed && (
              <button
                onClick={() => window.dispatchEvent(new Event('openNavCustomization'))}
                className="p-2 rounded-lg bg-sidebar-accent hover:bg-sidebar-primary/20 text-sidebar-foreground/80 hover:text-sidebar-foreground transition-all duration-200 border border-sidebar-border shadow-sm"
                title="Customize Navigation"
              >
                <Sliders className="h-4 w-4" />
              </button>
            )}
            {/* Collapse Sidebar Button */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-all duration-200"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pb-6 bg-sidebar">
        {/* Creator nav items - ONLY for non-admin routes and non-admin users */}
        {/* All top-level items are flush-left with identical visual hierarchy */}
        {!shouldShowAdminNav && (
          <SidebarMenu className="px-2">
            {userNavItems.map((item) => {
              const Icon = ICON_MAP[item.id] || LayoutDashboard;
              const isPinned = navConfig.pinned.includes(item.id);
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isOpen = openGroups[item.id] ?? false;
              
              // My Workspaces - shows workspaces as sub-items (navigates to workspace dashboard)
              if (item.id === 'my_workspaces' && customPackages.length > 0) {
                return (
                  <div key={item.id}>
                    <Collapsible open={isOpen} onOpenChange={() => toggleGroup(item.id)}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuItem>
                          <SidebarMenuButton className="w-full justify-between hover:bg-sidebar-accent text-sidebar-foreground">
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4 shrink-0 text-sidebar-foreground" />
                              {!collapsed && <span className="font-medium text-sidebar-foreground">{item.label}</span>}
                            </div>
                            {!collapsed && (
                              <ChevronDown className={`h-4 w-4 shrink-0 text-sidebar-foreground/70 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 mt-1 space-y-0.5">
                          {customPackages.map((pkg) => (
                            <SidebarMenuItem key={pkg.id}>
                              <SidebarMenuButton asChild>
                                <NavLink
                                  to={`/workspace?id=${pkg.id}`}
                                  className="flex items-center justify-between text-sidebar-foreground/80 text-sm py-1.5"
                                  activeClassName="text-sidebar-foreground bg-sidebar-accent"
                                >
                                  <span className="truncate">{pkg.name}</span>
                                  {pkg.is_default && <span className="text-amber-400 text-xs">⭐</span>}
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              }
              
              // Hide My Workspaces if no workspaces exist
              if (item.id === 'my_workspaces' && customPackages.length === 0) {
                return null;
              }
              
              // Items WITH sub-items - collapsible with chevron
              if (hasSubItems) {
                const subItemConfigs = navConfig.subItems?.[item.id] || [];
                const visibleSubItems = item.subItems!.filter(sub => {
                  const config = subItemConfigs.find(c => c.id === sub.id);
                  return !config || config.visible !== false;
                });
                
                return (
                  <div key={item.id}>
                    <Collapsible open={isOpen} onOpenChange={() => toggleGroup(item.id)}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuItem>
                          <SidebarMenuButton className="w-full justify-between hover:bg-sidebar-accent text-sidebar-foreground">
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4 shrink-0 text-sidebar-foreground" />
                              {!collapsed && <span className="font-medium text-sidebar-foreground">{item.label}</span>}
                            </div>
                            {!collapsed && (
                              <ChevronDown className={`h-4 w-4 shrink-0 text-sidebar-foreground/70 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 mt-1 space-y-0.5">
                          {visibleSubItems.map((subItem) => (
                            <SidebarMenuItem key={subItem.id}>
                              <SidebarMenuButton asChild>
                                <NavLink
                                  to={subItem.path}
                                  className="text-sidebar-foreground/80 text-sm py-1.5"
                                  activeClassName="text-sidebar-foreground bg-sidebar-accent"
                                >
                                  <span className="truncate">{subItem.label}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              }
              
              // Items WITHOUT sub-items - simple top-level link (flush left, no chevron)
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.path}
                      className="flex items-center justify-between hover:bg-sidebar-accent text-sidebar-foreground"
                      activeClassName="bg-sidebar-primary/20 text-sidebar-foreground"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 shrink-0 text-sidebar-foreground" />
                        {!collapsed && <span className="font-medium text-sidebar-foreground">{item.label}</span>}
                      </div>
                      {!collapsed && isPinned && <span className="text-amber-400 text-xs">★</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        )}

        {/* Pinned Items Section - Admin only, sticky at top */}
        {shouldShowAdminNav && pinnedItems.length > 0 && (
          <div className="sticky top-0 z-10 bg-sidebar border-b border-sidebar-border pb-2 mb-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/60 font-medium text-xs px-3 py-1 uppercase tracking-wider">
                Pinned
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {pinnedItems.map((item) => {
                    const Icon = ICON_MAP[item.icon] || Grid3x3;
                    return (
                      <ContextMenu key={`pinned-${item.id}`}>
                        <ContextMenuTrigger asChild>
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip={collapsed ? item.label : undefined}>
                              <NavLink
                                to={item.path}
                                className="flex items-center gap-3 transition-all duration-150 text-sidebar-foreground hover:bg-sidebar-accent"
                                activeClassName="bg-sidebar-primary/15 text-sidebar-primary font-medium border-l-2 border-sidebar-primary"
                              >
                                <Icon className="h-4 w-4 shrink-0" />
                                {!collapsed && (
                                  <>
                                    <span className="truncate flex-1">{item.label}</span>
                                    <Pin className="h-3 w-3 text-amber-500 shrink-0" />
                                  </>
                                )}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="bg-popover border border-border shadow-lg z-50">
                          <ContextMenuItem 
                            onClick={() => handleTogglePin(item.id, item.label)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <PinOff className="h-4 w-4" />
                            Unpin from Top
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        )}

        {/* Admin-only collapsible sections */}
        {filteredNavigation.filter(g => g.collapsible).map((group) => {
          const isOpen = openGroups[group.group] ?? true;
          
          return (
            <Collapsible
              key={group.group}
              open={isOpen}
              onOpenChange={() => toggleGroup(group.group)}
            >
              <SidebarGroup>
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md transition-colors flex items-center justify-between text-sidebar-foreground font-semibold text-sm px-3 py-2 w-full">
                      <span className="truncate">{group.group}</span>
                      {!collapsed && (
                        <ChevronDown 
                          className={`h-4 w-4 shrink-0 text-sidebar-foreground/70 transition-transform duration-200 ml-auto ${
                            isOpen ? 'rotate-0' : '-rotate-90'
                          }`} 
                        />
                      )}
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const Icon = ICON_MAP[item.icon] || Grid3x3;
                        
                        // Special handling for Ask Seeksy - opens AI panel
                        if (item.path === '#ask-seeksy') {
                          return (
                            <SidebarMenuItem key={item.id}>
                              <SidebarMenuButton 
                                tooltip={collapsed ? item.label : undefined}
                                onClick={() => window.dispatchEvent(new Event('openSparkChat'))}
                                className="flex items-center gap-3 transition-all duration-150 cursor-pointer text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                              >
                                <Icon className="h-4 w-4 shrink-0 text-sidebar-foreground" />
                                {!collapsed && <span className="truncate">{item.label}</span>}
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        }
                        
                        const isPinnedItem = isItemPinned(item.id);
                        
                        return (
                          <ContextMenu key={item.id}>
                            <ContextMenuTrigger asChild>
                              <SidebarMenuItem className="group/item relative">
                                <SidebarMenuButton asChild tooltip={collapsed ? item.label : undefined}>
                                  <NavLink
                                    to={item.path}
                                    className="flex items-center gap-3 transition-all duration-150 text-sidebar-foreground hover:bg-sidebar-accent"
                                    activeClassName="bg-sidebar-primary/15 text-sidebar-primary font-medium border-l-2 border-sidebar-primary"
                                  >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {!collapsed && (
                                      <>
                                        <span className="truncate flex-1">{item.label}</span>
                                        {isPinnedItem && <Pin className="h-3 w-3 text-amber-500 shrink-0" />}
                                      </>
                                    )}
                                  </NavLink>
                                </SidebarMenuButton>
                                
                                {/* Hover dropdown menu - same as Creator sidebar */}
                                {!collapsed && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/30"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48 bg-popover border shadow-lg z-50">
                                        <DropdownMenuItem 
                                          onClick={() => handleTogglePin(item.id, item.label)}
                                          className="flex items-center gap-2 cursor-pointer"
                                        >
                                          {isPinnedItem ? (
                                            <>
                                              <PinOff className="h-4 w-4" />
                                              Unpin from Top
                                            </>
                                          ) : (
                                            <>
                                              <Star className="h-4 w-4" />
                                              Pin to top
                                            </>
                                          )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                          <ExternalLink className="h-4 w-4" />
                                          Make standalone
                                        </DropdownMenuItem>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer justify-between">
                                              <div className="flex items-center gap-2">
                                                <FolderInput className="h-4 w-4" />
                                                Move to...
                                              </div>
                                              <ChevronRight className="h-4 w-4" />
                                            </DropdownMenuItem>
                                          </DropdownMenuTrigger>
                                        </DropdownMenu>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
                                          <Trash2 className="h-4 w-4" />
                                          Remove from workspace
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}
                              </SidebarMenuItem>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="bg-popover border border-border shadow-lg z-50">
                              <ContextMenuItem 
                                onClick={() => handleTogglePin(item.id, item.label)}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                {isPinnedItem ? (
                                  <>
                                    <PinOff className="h-4 w-4" />
                                    Unpin from Top
                                  </>
                                ) : (
                                  <>
                                    <Pin className="h-4 w-4" />
                                    Pin to Top
                                  </>
                                )}
                              </ContextMenuItem>
                              <ContextMenuItem className="flex items-center gap-2 cursor-pointer">
                                <ExternalLink className="h-4 w-4" />
                                Make standalone
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4" />
                                Remove from workspace
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}

      </SidebarContent>
      
      {/* Bottom padding only - What's New moved to header */}
      <div className="mt-auto" />
    </Sidebar>
  );
}
