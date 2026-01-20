import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { usePortal } from "@/contexts/PortalContext";
import { trackModuleOpened } from "@/utils/gtm";
import { WorkspaceSelector } from "./WorkspaceSelector";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";
import { ModuleCenterModal, SEEKSY_MODULES } from "@/components/modules";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SparkIcon } from "@/components/spark/SparkIcon";
import { 
  CalendarDays, 
  Clock, 
  Plus,
  Settings,
  MoreHorizontal,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Star,
  FolderOpen,
  CheckSquare,
  Sliders,
  Store,
  // Module icons
  Mic,
  Podcast,
  Scissors,
  FileText,
  Megaphone,
  Zap,
  Users,
  Calendar,
  Trophy,
  FormInput,
  Vote,
  Image,
  Shield,
  Layout,
  Wand2,
  BrainCircuit,
  MessageCircle,
  DollarSign,
  Clapperboard,
  PieChart,
  BarChart3,
  Instagram,
  Bot,
  CalendarClock,
  Newspaper,
  Building2,
  Copy,
  Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceInstalledModules } from "@/hooks/useWorkspaceInstalledModules";
import { useWorkspaceSidebarState } from "@/hooks/useWorkspaceSidebarState";
import { logSidebarModules } from "@/utils/onboardingDebug";

// Icon mapping for modules - ensure correct icons for each module
const MODULE_ICONS: Record<string, React.ElementType> = {
  'studio': Mic,
  'podcasts': Podcast,
  'clips': Scissors,
  'ai-clips': Scissors,
  'ai-post-production': Wand2,
  'spark-ai': BrainCircuit,
  'ai-agent': BrainCircuit,
  'blog': Newspaper,
  'newsletters': Mail,
  'newsletter': Mail,
  'campaigns': Megaphone,
  'email-signatures': Mail,
  'signatures': Mail,
  'automations': Zap,
  'ai-automation': Bot,
  'crm': Building2,
  'contacts': Users,
  'segments': FileText,
  'tasks': CheckSquare,
  'projects': FolderOpen,
  'project-management': FolderOpen,
  'meetings': CalendarClock,
  'events': Calendar,
  'awards': Trophy,
  'proposals': FileText,
  'deals': DollarSign,
  'forms': FormInput,
  'polls': Vote,
  'media-library': Image,
  'video-editor': Clapperboard,
  'email': Mail,
  'sms': MessageCircle,
  'identity': Shield,
  'identity-verification': Shield,
  'my-page': Layout,
  'settings': Settings,
  'social-analytics': PieChart,
  'audience-insights': BarChart3,
  'social-connect': Instagram,
  'cloning': Copy,
  'podcast-rss': Podcast,
  'podcast-hosting': Podcast,
  'podcast-agent': Bot,
};

interface ModuleRegistryItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  scope: string;
  route: string;
  display_order: number;
}

export function WorkspaceSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, toggleSidebar, setOpen } = useSidebar();
  const { portal } = usePortal();
  const { currentWorkspace, workspaceModules, removeModule, togglePinned } = useWorkspace();
  const { installedModuleIds } = useWorkspaceInstalledModules();
  const [moduleRegistry, setModuleRegistry] = useState<ModuleRegistryItem[]>([]);
  const [showModuleCenter, setShowModuleCenter] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [moduleCenterDefaultToApps, setModuleCenterDefaultToApps] = useState(false);
  const [removingModule, setRemovingModule] = useState<string | null>(null);
  const [, setForceUpdate] = useState(0);

  // Workspace-scoped sidebar state
  const workspaceSidebarState = useWorkspaceSidebarState(currentWorkspace?.id || null);

  // Effect to re-render when sidebar collapses/expands
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [state]);

  // Sync sidebar state with workspace-scoped persistence
  useEffect(() => {
    if (currentWorkspace?.id) {
      // If the persisted state says expanded but sidebar is collapsed, expand it
      if (workspaceSidebarState.isExpanded && state === 'collapsed') {
        setOpen(true);
      }
    }
  }, [currentWorkspace?.id, workspaceSidebarState.isExpanded, state, setOpen]);

  // Recovery: if sidebar is stuck collapsed with no visible toggle, auto-reset
  useEffect(() => {
    const handleStuckState = () => {
      // If collapsed and we detect a stuck state (e.g., no toggle visible), reset
      if (state === 'collapsed') {
        // The toggle is always visible in our implementation, but add safety
        const sidebarElement = document.querySelector('[data-sidebar="sidebar"]');
        if (sidebarElement && sidebarElement.clientWidth < 40) {
          // Stuck in an unusable state, reset
          workspaceSidebarState.resetToDefault();
          setOpen(true);
        }
      }
    };

    // Check on mount and after a short delay
    const timeout = setTimeout(handleStuckState, 500);
    return () => clearTimeout(timeout);
  }, [state, workspaceSidebarState, setOpen]);

  // Fetch module registry from database and merge with SEEKSY_MODULES
  useEffect(() => {
    const fetchModuleRegistry = async () => {
      try {
        const { data, error } = await supabase
          .from('modules')
          .select('name, display_name, description, icon, route, is_active')
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching module registry:', error);
        }

        // Start with SEEKSY_MODULES as the comprehensive base
        const moduleDataRegistry: ModuleRegistryItem[] = SEEKSY_MODULES.map((m, idx) => ({
          id: m.id,
          name: m.name,
          description: m.description || '',
          icon: m.icon?.name || 'default',
          category: m.category || 'general',
          scope: 'workspace',
          route: m.route || `/${m.id}`,
          display_order: idx,
        }));

        // Merge with DB data (DB takes precedence for name/description/route)
        if (data && data.length > 0) {
          const dbModuleMap = new Map(data.map(m => [m.name, m]));
          
          const mergedRegistry = moduleDataRegistry.map(module => {
            const dbModule = dbModuleMap.get(module.id);
            if (dbModule) {
              return {
                ...module,
                name: dbModule.display_name || module.name,
                description: dbModule.description || module.description,
                route: dbModule.route || module.route,
                icon: dbModule.icon || module.icon,
              };
            }
            return module;
          });

          // Add any DB modules not in SEEKSY_MODULES
          data.forEach(m => {
            if (!mergedRegistry.find(mr => mr.id === m.name)) {
              mergedRegistry.push({
                id: m.name,
                name: m.display_name || m.name,
                description: m.description || '',
                icon: m.icon || 'default',
                category: 'general',
                scope: 'workspace',
                route: m.route || `/${m.name}`,
                display_order: mergedRegistry.length,
              });
            }
          });

          setModuleRegistry(mergedRegistry);
        } else {
          setModuleRegistry(moduleDataRegistry);
        }
      } catch (err) {
        console.error('Error in fetchModuleRegistry:', err);
      }
    };

    fetchModuleRegistry();
  }, []);

  const isCollapsed = state === 'collapsed';

  // Get FLAT list of installed modules for current workspace - NO GROUPING
  const { installedModules, pinnedModules } = useMemo(() => {
    const modules = workspaceModules
      .sort((a, b) => {
        // Pinned first, then alphabetical
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        // Then by position
        return a.position - b.position;
      })
      .map(wm => ({
        ...moduleRegistry.find(mr => mr.id === wm.module_id),
        is_pinned: wm.is_pinned,
      }))
      .filter(m => m.id) as (ModuleRegistryItem & { is_pinned: boolean })[];

    const pinned: (ModuleRegistryItem & { is_pinned: boolean })[] = [];
    const regular: (ModuleRegistryItem & { is_pinned: boolean })[] = [];

    for (const module of modules) {
      if (module.is_pinned) {
        pinned.push(module);
      } else {
        regular.push(module);
      }
    }

    // Sort regular modules alphabetically
    regular.sort((a, b) => a.name.localeCompare(b.name));

    // Log sidebar state for debugging
    logSidebarModules({
      flatList: [...pinned, ...regular].map(m => m.name),
      hasGroupedParents: false, // We removed grouping
      collapsedState: state === 'collapsed',
    });

    return { installedModules: regular, pinnedModules: pinned };
  }, [workspaceModules, moduleRegistry]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleRemoveModule = async (moduleId: string, moduleName: string) => {
    setRemovingModule(moduleId);
    try {
      await removeModule(moduleId);
      toast.success("Module removed", {
        description: `${moduleName} has been removed from this workspace.`,
      });
    } catch (error) {
      toast.error("Failed to remove module");
    } finally {
      setRemovingModule(null);
    }
  };

  const handleToggleSidebar = () => {
    const newState = !isCollapsed;
    workspaceSidebarState.setExpanded(newState);
    toggleSidebar();
  };

  const renderModuleItem = (module: ModuleRegistryItem & { is_pinned?: boolean }) => {
    const Icon = MODULE_ICONS[module.id] || FolderOpen;
    const isPinned = module.is_pinned || false;
    
    return (
      <SidebarMenuItem key={module.id} className="group/item relative">
        <SidebarMenuButton
          onClick={() => {
            if (module.route) {
              trackModuleOpened(module.id, portal);
              navigate(module.route);
            }
          }}
          isActive={module.route ? isActive(module.route) : false}
          tooltip={module.name}
          className="text-sidebar-foreground hover:bg-sidebar-accent pr-8"
        >
          <Icon className="h-4 w-4" />
          {!isCollapsed && <span>{module.name}</span>}
        </SidebarMenuButton>
        
        {/* Module overflow menu */}
        {!isCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover/item:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover border shadow-lg z-50">
              {/* Pin option */}
              <DropdownMenuItem
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await togglePinned(module.id);
                    toast.success(
                      isPinned ? "Unpinned" : "Pinned to top",
                      { description: isPinned 
                        ? `${module.name} removed from pinned.`
                        : `${module.name} is now pinned to the top.` 
                      }
                    );
                  } catch (err) {
                    toast.error("Failed to update module");
                  }
                }}
              >
                <Star className={cn("h-4 w-4 mr-2", isPinned && "fill-amber-500 text-amber-500")} />
                {isPinned ? "Unpin" : "Pin to top"}
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveModule(module.id, module.name);
                }}
                className="text-destructive focus:text-destructive"
                disabled={removingModule === module.id}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove from workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <Sidebar 
        className="border-r border-sidebar-border" 
        collapsible="icon"
      >
        <SidebarHeader className="border-b border-sidebar-border px-4 py-3 bg-sidebar">
          <div className="flex items-center justify-between w-full gap-2">
            {!isCollapsed && (
              <button 
                onClick={() => navigate('/my-day')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                title="Go to Dashboard"
              >
                <img 
                  src="/spark/holiday/seeksy-logo-santa.png" 
                  alt="Seeksy" 
                  className="h-10 w-10"
                />
                <span className="text-sidebar-foreground text-2xl font-bold">Seeksy</span>
              </button>
            )}
            {isCollapsed && (
              <button 
                onClick={() => navigate('/my-day')}
                className="flex items-center justify-center flex-1 hover:opacity-80 transition-opacity cursor-pointer"
                title="Go to Dashboard"
              >
                <img 
                  src="/spark/holiday/seeksy-logo-santa.png" 
                  alt="Seeksy" 
                  className="h-8 w-8"
                />
              </button>
            )}
            <div className="flex items-center gap-1">
              {/* Customize Nav Icon Button */}
              {!isCollapsed && (
                <button
                  onClick={() => setShowModuleCenter(true)}
                  className="p-2 rounded-lg bg-sidebar-accent hover:bg-sidebar-primary/20 text-sidebar-foreground/80 hover:text-sidebar-foreground transition-all duration-200 border border-sidebar-border shadow-sm"
                  title="Customize Navigation"
                >
                  <Sliders className="h-4 w-4" />
                </button>
              )}
              {/* Collapse Sidebar Button - ALWAYS VISIBLE */}
              <button
                onClick={handleToggleSidebar}
                className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-all duration-200"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* Global Navigation - My Day, My Work, Recents */}
          <SidebarMenu className="pl-4 pt-4">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/my-day')}
                isActive={isActive('/my-day')}
                tooltip="My Day"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <CalendarDays className="h-4 w-4" />
                {!isCollapsed && <span>My Day</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/my-work')}
                isActive={isActive('/my-work')}
                tooltip="My Work"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <CheckSquare className="h-4 w-4" />
                {!isCollapsed && <span>My Work</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/recents')}
                isActive={isActive('/recents')}
                tooltip="Recents"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Clock className="h-4 w-4" />
                {!isCollapsed && <span>Recents</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* Favorites Section - Right under Recents */}
          {pinnedModules.length > 0 && (
            <>
              <Separator className="my-2 bg-sidebar-border" />
              {!isCollapsed && (
                <span className="text-xs font-medium text-sidebar-foreground/70 px-4 mb-1 block">
                  Favorites
                </span>
              )}
              <SidebarMenu className="pl-2">
                {pinnedModules.map(module => {
                  const Icon = MODULE_ICONS[module.id] || FolderOpen;
                  return (
                    <SidebarMenuItem key={`fav-${module.id}`} className="group/item relative">
                      <SidebarMenuButton
                        onClick={() => module.route && navigate(module.route)}
                        isActive={module.route ? isActive(module.route) : false}
                        tooltip={module.name}
                        className="text-sidebar-foreground hover:bg-sidebar-accent pr-8"
                      >
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {!isCollapsed && <span>{module.name}</span>}
                      </SidebarMenuButton>
                      
                      {/* Quick unpin button */}
                      {!isCollapsed && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover/item:opacity-100 transition-opacity"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await togglePinned(module.id);
                                toast.success("Removed from favorites");
                              }}
                            >
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">Unpin</TooltipContent>
                        </Tooltip>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </>
          )}

          <Separator className="my-2 bg-sidebar-border" />

          {/* Workspaces Section */}
          <div className="px-3 py-2">
            {!isCollapsed && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-sidebar-foreground/70">
                  Workspaces
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => setShowCreateWorkspace(true)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            <WorkspaceSelector />
          </div>

          <Separator className="my-2 bg-sidebar-border" />

          <ScrollArea className="flex-1">
            {/* Installed Seekies Section Header */}
            <div className="px-3 py-2">
              {!isCollapsed && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-sidebar-foreground/70">
                    Installed Seekies
                  </span>
                </div>
              )}
            </div>

            {/* Workspace Modules - FLAT LIST, NO GROUPING */}
            {currentWorkspace && (
              <div className="px-3 py-1">
                <SidebarMenu>
                  {/* Flat list of installed modules (non-pinned) */}
                  {installedModules.map(module => renderModuleItem(module))}
                  
                  {/* Empty state when no modules installed */}
                  {installedModules.length === 0 && pinnedModules.length === 0 && !isCollapsed && (
                    <div className="px-2 py-4 text-center">
                      <p className="text-sm text-sidebar-foreground/60 mb-2">
                        No Seekies installed yet
                      </p>
                    </div>
                  )}
                  
                  {/* Add Seeksy Button - ALWAYS VISIBLE, PROMINENT */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => navigate('/apps?view=modules')}
                      tooltip="Add Seeksy"
                      className="text-primary hover:text-primary hover:bg-primary/10 font-medium"
                    >
                      <Store className="h-4 w-4" />
                      {!isCollapsed && <span>Add Seeksy</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            )}
          </ScrollArea>
        </SidebarContent>

        {/* Sticky Footer - Ask Spark + Settings */}
        <SidebarFooter className="p-3 pt-2 border-t border-sidebar-border bg-sidebar mt-auto">
          <SidebarMenu>
            {/* Ask Spark - Above Settings */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/my-day')}
                tooltip="Ask Spark"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <SparkIcon size={16} pose="idle" />
                {!isCollapsed && <span>Ask Spark</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            {/* Settings */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/settings')}
                isActive={isActive('/settings')}
                tooltip="Settings"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Settings className="h-4 w-4" />
                {!isCollapsed && <span>Settings</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      
      {/* Module Center Modal */}
      <ModuleCenterModal 
        isOpen={showModuleCenter} 
        onClose={() => {
          setShowModuleCenter(false);
          setModuleCenterDefaultToApps(false);
        }}
        defaultToApps={moduleCenterDefaultToApps}
      />

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={showCreateWorkspace}
        onClose={() => setShowCreateWorkspace(false)}
        onOpenModuleCenter={() => {
          setModuleCenterDefaultToApps(true);
          setShowModuleCenter(true);
        }}
      />
    </>
  );
}
