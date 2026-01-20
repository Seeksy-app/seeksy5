import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, ChevronRight, Plus, Search, 
  LayoutDashboard, Mic, Play, BarChart3, Megaphone, 
  Users, DollarSign, Video, Calendar, Settings,
  Pin, Clock, Sparkles, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore, SeeksyApp } from "@/stores/workspaceStore";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Mic, Play, BarChart3, Megaphone,
  Users, DollarSign, Video, Calendar, Settings,
};

interface AppRailProps {
  className?: string;
}

export function AppRail({ className }: AppRailProps) {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const {
    appRailExpanded,
    toggleAppRail,
    activeSeeksyId,
    setActiveSeeksy,
    installedSeekies,
    pinnedSeekies,
    recentSeekies,
    workspaceName,
  } = useWorkspaceStore();

  const pinnedApps = installedSeekies.filter(app => pinnedSeekies.includes(app.id));
  const recentApps = installedSeekies.filter(app => 
    recentSeekies.includes(app.id) && !pinnedSeekies.includes(app.id)
  ).slice(0, 3);
  const otherApps = installedSeekies.filter(app => 
    !pinnedSeekies.includes(app.id) && !recentSeekies.includes(app.id)
  );

  const filteredApps = searchQuery 
    ? installedSeekies.filter(app => 
        app.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const renderAppItem = (app: SeeksyApp, showLabel: boolean = true) => {
    const Icon = ICON_MAP[app.icon] || LayoutDashboard;
    const isActive = activeSeeksyId === app.id;
    
    const content = (
      <Link
        to={app.route}
        onClick={() => setActiveSeeksy(app.id)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
          "hover:bg-accent/80 group relative",
          isActive && "bg-primary/10 text-primary border border-primary/20",
          !isActive && "text-muted-foreground hover:text-foreground"
        )}
      >
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
          isActive ? "bg-primary/20" : "bg-muted group-hover:bg-accent",
          app.color
        )}>
          <Icon className="w-4 h-4" />
        </div>
        
        <AnimatePresence>
          {showLabel && appRailExpanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="text-sm font-medium truncate"
            >
              {app.name}
            </motion.span>
          )}
        </AnimatePresence>
        
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
          />
        )}
      </Link>
    );

    if (!appRailExpanded) {
      return (
        <TooltipProvider key={app.id}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {app.name}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <div key={app.id}>{content}</div>;
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: appRailExpanded ? 240 : 72 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={cn(
        "h-full flex flex-col border-r bg-card/50 backdrop-blur-sm",
        "relative z-20",
        className
      )}
    >
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b">
        <AnimatePresence>
          {appRailExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{workspaceName}</p>
                <p className="text-xs text-muted-foreground">Workspace</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleAppRail}
          className="h-8 w-8 shrink-0"
        >
          {appRailExpanded ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Search */}
      <AnimatePresence>
        {appRailExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-2"
          >
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search Seekies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 bg-muted/50"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apps List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filteredApps ? (
          // Search results
          <div className="space-y-1">
            {filteredApps.map(app => renderAppItem(app))}
            {filteredApps.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No Seekies found
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Pinned Section */}
            {pinnedApps.length > 0 && (
              <div className="space-y-1">
                {appRailExpanded && (
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <Pin className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Pinned
                    </span>
                  </div>
                )}
                {pinnedApps.map(app => renderAppItem(app))}
              </div>
            )}

            {/* Recent Section */}
            {recentApps.length > 0 && (
              <>
                <Separator className="my-2" />
                <div className="space-y-1">
                  {appRailExpanded && (
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Recent
                      </span>
                    </div>
                  )}
                  {recentApps.map(app => renderAppItem(app))}
                </div>
              </>
            )}

            {/* Other Apps */}
            {otherApps.length > 0 && (
              <>
                <Separator className="my-2" />
                <div className="space-y-1">
                  {appRailExpanded && (
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <Sparkles className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        All Seekies
                      </span>
                    </div>
                  )}
                  {otherApps.map(app => renderAppItem(app))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Add Seeksy CTA */}
      <div className="p-3 border-t">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-center gap-2",
                  !appRailExpanded && "px-0"
                )}
              >
                <Plus className="w-4 h-4" />
                {appRailExpanded && <span>Add Seeksy</span>}
              </Button>
            </TooltipTrigger>
            {!appRailExpanded && (
              <TooltipContent side="right">Add Seeksy</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.aside>
  );
}
