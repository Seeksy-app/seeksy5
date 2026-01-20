import { useState, useMemo, useEffect } from "react";
import { X, Search, Sparkles, ArrowUpDown, ChevronRight, Layers, Puzzle, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { MODULE_CATEGORIES, SEEKSY_MODULES, type SeeksyModule } from "./moduleData";
import { SEEKSY_COLLECTIONS, EXTERNAL_INTEGRATIONS, type SeeksyCollection } from "./collectionData";
import { ModuleCard } from "./ModuleCard";
import { CollectionCard } from "./CollectionCard";
import { IntegrationCard } from "./IntegrationCard";
import { ModuleDetailDrawer } from "./ModuleDetailDrawer";
import { CollectionDetailDrawer } from "./CollectionDetailDrawer";
import { toast } from "sonner";
import { trackModuleOpened } from "@/utils/gtm";
import { usePortal } from "@/contexts/PortalContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ModuleCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultToApps?: boolean;
}

type MainSection = "collections" | "apps" | "integrations";
type SortOption = "default" | "name" | "popular" | "newest";

const mainSections = [
  { id: "collections" as MainSection, label: "Collections", icon: Layers, description: "Pre-built app bundles" },
  { id: "apps" as MainSection, label: "Seeksy Apps", icon: Puzzle, description: "Individual modules" },
  { id: "integrations" as MainSection, label: "Integrations", icon: Link2, description: "Third-party connections" },
];

export function ModuleCenterModal({ isOpen, onClose, defaultToApps = false }: ModuleCenterModalProps) {
  const navigate = useNavigate();
  const { portal } = usePortal();
  const { currentWorkspace, workspaceModules, addModule } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<MainSection>(defaultToApps ? "apps" : "collections");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [installingModules, setInstallingModules] = useState<Set<string>>(new Set());
  const [installingCollections, setInstallingCollections] = useState<Set<string>>(new Set());
  
  // Detail drawers
  const [selectedModule, setSelectedModule] = useState<SeeksyModule | null>(null);
  const [showModuleDrawer, setShowModuleDrawer] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<SeeksyCollection | null>(null);
  const [showCollectionDrawer, setShowCollectionDrawer] = useState(false);

  // Get installed module IDs for current workspace
  const installedModuleIds = useMemo(() => {
    return new Set(workspaceModules.map(wm => wm.module_id));
  }, [workspaceModules]);

  // Set default section when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveSection(defaultToApps ? "apps" : "collections");
    }
  }, [isOpen, defaultToApps]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Filtered content based on active section
  const filteredCollections = useMemo(() => {
    if (activeSection !== "collections") return [];
    let result = [...SEEKSY_COLLECTIONS];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.description.toLowerCase().includes(query)
      );
    }
    return result;
  }, [activeSection, searchQuery]);

  const filteredModules = useMemo(() => {
    if (activeSection !== "apps") return [];
    let result = [...SEEKSY_MODULES];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        m => m.name.toLowerCase().includes(query) || 
             m.description.toLowerCase().includes(query)
      );
    }
    
    if (activeCategory) {
      result = result.filter(m => m.category === activeCategory);
    }
    
    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "popular") {
      result.sort((a, b) => {
        const aScore = (a.isAIPowered ? 2 : 0) + (a.isNew ? 1 : 0);
        const bScore = (b.isAIPowered ? 2 : 0) + (b.isNew ? 1 : 0);
        return bScore - aScore;
      });
    } else if (sortBy === "newest") {
      result = result.filter(m => m.isNew).concat(result.filter(m => !m.isNew));
    }
    
    return result;
  }, [activeSection, searchQuery, activeCategory, sortBy]);

  const filteredIntegrations = useMemo(() => {
    if (activeSection !== "integrations") return [];
    let result = [...EXTERNAL_INTEGRATIONS];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.name.toLowerCase().includes(query) || 
        i.description.toLowerCase().includes(query)
      );
    }
    return result;
  }, [activeSection, searchQuery]);

  const handleInstallModule = async (moduleId: string) => {
    if (!currentWorkspace) {
      toast.error("No workspace selected", {
        description: "Please select or create a workspace first.",
      });
      return;
    }

    // Allow re-adding modules that were previously removed
    // The installedModuleIds check is now only for UI display, not blocking

    setInstallingModules(prev => new Set(prev).add(moduleId));
    
    try {
      await addModule(moduleId);
      const module = SEEKSY_MODULES.find(m => m.id === moduleId);
      toast.success("App added!", {
        description: `${module?.name || 'App'} has been added to ${currentWorkspace.name}.`,
      });
    } catch (error) {
      toast.error("Failed to add app", {
        description: "Please try again.",
      });
    } finally {
      setInstallingModules(prev => {
        const next = new Set(prev);
        next.delete(moduleId);
        return next;
      });
    }
  };

  const handleInstallCollection = async (collection: SeeksyCollection) => {
    if (!currentWorkspace) {
      toast.error("No workspace selected", {
        description: "Please select or create a workspace first.",
      });
      return;
    }

    setInstallingCollections(prev => new Set(prev).add(collection.id));
    
    try {
      // Add all apps in the collection
      const appsToAdd = collection.includedApps.filter(id => !installedModuleIds.has(id));
      for (const moduleId of appsToAdd) {
        await addModule(moduleId);
      }
      toast.success("Collection added!", {
        description: `${collection.name} (${appsToAdd.length} apps) has been added to ${currentWorkspace.name}.`,
      });
    } catch (error) {
      toast.error("Failed to add collection", {
        description: "Please try again.",
      });
    } finally {
      setInstallingCollections(prev => {
        const next = new Set(prev);
        next.delete(collection.id);
        return next;
      });
    }
  };

  const handleOpenModule = (module: SeeksyModule) => {
    if (module.route) {
      trackModuleOpened(module.id, portal);
      navigate(module.route);
      onClose();
    }
  };

  const handleConnectIntegration = (integrationId: string) => {
    // Navigate to integrations page
    navigate('/integrations');
    onClose();
  };

  if (!isOpen) return null;

  const getSectionTitle = () => {
    switch (activeSection) {
      case "collections":
        return `${filteredCollections.length} collections`;
      case "apps":
        return activeCategory 
          ? `${filteredModules.length} apps in ${MODULE_CATEGORIES.find(c => c.id === activeCategory)?.name}`
          : `${filteredModules.length} apps`;
      case "integrations":
        return `${filteredIntegrations.length} integrations`;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-[96vw] h-[94vh] max-w-[1500px] bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Add to Workspace</h1>
              <p className="text-xs text-muted-foreground">
                {currentWorkspace ? `Adding to: ${currentWorkspace.name}` : 'Select a workspace first'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search collections, apps, integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border/50 focus:border-primary/50"
              />
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-muted h-10 w-10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-64 border-r border-border/50 flex flex-col bg-muted/20">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {/* Main Sections */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                    Add to workspace
                  </p>
                  {mainSections.map((section) => {
                    const SectionIcon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          setActiveSection(section.id);
                          setActiveCategory(null);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-3 text-sm rounded-lg transition-all flex items-center gap-3",
                          activeSection === section.id && !activeCategory
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <SectionIcon className="h-5 w-5" />
                        <div>
                          <div className="font-medium">{section.label}</div>
                          <div className="text-[10px] text-muted-foreground">{section.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {/* App Categories - only shown when on apps section */}
                {activeSection === "apps" && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                      Categories
                    </p>
                    <button
                      onClick={() => setActiveCategory(null)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded-lg transition-all",
                        !activeCategory
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      All Apps
                    </button>
                    {MODULE_CATEGORIES.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm rounded-lg transition-all flex items-center justify-between group",
                          activeCategory === category.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {category.name}
                          {category.isNew && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-0">
                              New
                            </Badge>
                          )}
                        </span>
                        <ChevronRight className={cn(
                          "h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity",
                          activeCategory === category.id && "opacity-100"
                        )} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Breadcrumb & Sort */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border/30 bg-background/50">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-primary capitalize">{activeSection}</span>
                {activeCategory && (
                  <>
                    <span className="text-muted-foreground">›</span>
                    <span className="text-muted-foreground capitalize">
                      {MODULE_CATEGORIES.find(c => c.id === activeCategory)?.name}
                    </span>
                  </>
                )}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {getSectionTitle()}
                </Badge>
              </div>
              
              {activeSection === "apps" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                      <ArrowUpDown className="h-4 w-4" />
                      Sort: {sortBy === "default" ? "Default" : sortBy === "name" ? "Name" : sortBy === "popular" ? "Popular" : "Newest"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border shadow-lg z-[110]">
                    <DropdownMenuItem onClick={() => setSortBy("default")}>Default</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("name")}>Name</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("popular")}>Most Popular</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("newest")}>Newest</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {/* Content Grid */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                {/* Collections Grid */}
                {activeSection === "collections" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredCollections.map((collection) => {
                      const allAppsInstalled = collection.includedApps.every(id => installedModuleIds.has(id));
                      return (
                        <CollectionCard 
                          key={collection.id}
                          collection={collection}
                          isInstalled={allAppsInstalled}
                          isInstalling={installingCollections.has(collection.id)}
                          onInstall={() => handleInstallCollection(collection)}
                          onClick={() => {
                            setSelectedCollection(collection);
                            setShowCollectionDrawer(true);
                          }}
                        />
                      );
                    })}
                  </div>
                )}
                
                {/* Apps Grid */}
                {activeSection === "apps" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                    {filteredModules.map((module) => (
                      <ModuleCard 
                        key={module.id} 
                        module={module}
                        isInstalled={installedModuleIds.has(module.id)}
                        isInstalling={installingModules.has(module.id)}
                        onInstall={() => handleInstallModule(module.id)}
                        onOpen={() => handleOpenModule(module)}
                        onBadgeClick={(integrationId) => {
                          const integrationModule = SEEKSY_MODULES.find(m => m.id === integrationId);
                          if (integrationModule) {
                            setSelectedModule(integrationModule);
                            setShowModuleDrawer(true);
                          }
                        }}
                        onCardClick={() => {
                          setSelectedModule(module);
                          setShowModuleDrawer(true);
                        }}
                      />
                    ))}
                  </div>
                )}
                
                {/* Integrations Grid */}
                {activeSection === "integrations" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredIntegrations.map((integration) => (
                      <IntegrationCard 
                        key={integration.id}
                        integration={integration}
                        isConnected={integration.isConnected}
                        onConnect={() => handleConnectIntegration(integration.id)}
                      />
                    ))}
                  </div>
                )}
                
                {/* Empty state */}
                {((activeSection === "collections" && filteredCollections.length === 0) ||
                  (activeSection === "apps" && filteredModules.length === 0) ||
                  (activeSection === "integrations" && filteredIntegrations.length === 0)) && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Search className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">No {activeSection} found</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your search</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
      
      {/* Module Detail Drawer */}
      <ModuleDetailDrawer
        module={selectedModule}
        isOpen={showModuleDrawer}
        onClose={() => {
          setShowModuleDrawer(false);
          setSelectedModule(null);
        }}
        isInstalled={selectedModule ? installedModuleIds.has(selectedModule.id) : false}
        isInstalling={selectedModule ? installingModules.has(selectedModule.id) : false}
        onInstall={() => {
          if (selectedModule) {
            handleInstallModule(selectedModule.id);
          }
        }}
        onOpen={() => {
          if (selectedModule) {
            handleOpenModule(selectedModule);
            setShowModuleDrawer(false);
          }
        }}
      />
      
      {/* Collection Detail Drawer */}
      <CollectionDetailDrawer
        collection={selectedCollection}
        isOpen={showCollectionDrawer}
        onClose={() => {
          setShowCollectionDrawer(false);
          setSelectedCollection(null);
        }}
        installedModuleIds={installedModuleIds}
        isInstalling={selectedCollection ? installingCollections.has(selectedCollection.id) : false}
        onInstallCollection={() => {
          if (selectedCollection) {
            handleInstallCollection(selectedCollection);
          }
        }}
        onInstallApp={handleInstallModule}
      />
    </div>
  );
}
