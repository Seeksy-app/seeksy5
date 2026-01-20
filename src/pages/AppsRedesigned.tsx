import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { 
  Search, Sparkles, Grid3X3, Layers, Package, 
  ChevronRight, Filter, SortAsc, ArrowRight,
  Mic, Scissors, Calendar, Megaphone, Users, Shield, 
  BrainCircuit, Check, Plus, X, Loader2
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// New components
import { SparkOnboardingGuide } from "@/components/apps/SparkOnboardingGuide";
import { AnimatedCollectionCard } from "@/components/apps/AnimatedCollectionCard";
import { ModuleRelationshipGraph } from "@/components/apps/ModuleRelationshipGraph";
import { IntentConfirmationModal } from "@/components/apps/IntentConfirmationModal";
import { CollectionPreviewModal } from "@/components/apps/CollectionPreviewModal";
import { WorkspaceSelectionDialog } from "@/components/apps/WorkspaceSelectionDialog";

// Data
import { SEEKSY_COLLECTIONS, SeeksyCollection } from "@/components/modules/collectionData";
import { SEEKSY_MODULES, SeeksyModule, MODULE_CATEGORIES } from "@/components/modules/moduleData";
import { UserIntent, getRequiredModules } from "@/config/moduleRelationships";

type ViewMode = "spark" | "collections" | "modules";

export default function AppsRedesigned() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    workspaces, 
    currentWorkspace, 
    workspaceModules, 
    createWorkspace, 
    setCurrentWorkspace, 
    addModule,
    isLoading: workspaceLoading,
    hasFetchedOnce
  } = useWorkspace();
  
  // Derive installed module IDs from workspace modules
  const installedModuleIds = workspaceModules.map(m => m.module_id);
  
  // Check URL params for mode hints
  const isExplicitOnboarding = searchParams.get('onboarding') === 'true';
  const isNewAppsFlow = searchParams.get('new_apps') === 'true';
  
  // Global onboarding state - persisted in user_preferences
  const [globalOnboardingCompleted, setGlobalOnboardingCompleted] = useState<boolean | null>(null);
  
  // Fetch global onboarding status
  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setGlobalOnboardingCompleted(false);
        return;
      }
      
      const { data } = await supabase
        .from('user_preferences')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();
      
      setGlobalOnboardingCompleted(data?.onboarding_completed ?? false);
    };
    
    fetchOnboardingStatus();
  }, []);
  
  // Determine if Spark onboarding should be blocked
  // Block if: has workspace AND has at least one installed Seeksy
  const hasWorkspaceWithSeeksy = workspaces.length > 0 && installedModuleIds.length > 0;
  const canShowOnboarding = !hasWorkspaceWithSeeksy && !globalOnboardingCompleted;
  
  // Determine initial view mode:
  // - If explicit onboarding AND allowed → spark
  // - Otherwise → modules (Individual Seekies as default)
  const getInitialViewMode = (): ViewMode => {
    if (isExplicitOnboarding && canShowOnboarding) return "spark";
    return "modules"; // Default to individual seekies catalog
  };
  
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  // sparkMessage removed - now using toast.success for workspace creation notifications
  
  // Modals
  const [selectedIntent, setSelectedIntent] = useState<UserIntent | null>(null);
  const [intentModalOpen, setIntentModalOpen] = useState(false);
  const [previewCollection, setPreviewCollection] = useState<SeeksyCollection | null>(null);
  
  // Workspace selection dialog state
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [pendingModuleId, setPendingModuleId] = useState<string | null>(null);
  const [pendingModuleName, setPendingModuleName] = useState<string>('');
  
  // If spark is blocked but URL requested it, redirect to modules view
  useEffect(() => {
    if (isExplicitOnboarding && !canShowOnboarding && viewMode === "spark") {
      setViewMode("modules");
    }
  }, [isExplicitOnboarding, canShowOnboarding, viewMode]);

  // Auto-create workspace if user has none - ONLY after fetch is complete
  useEffect(() => {
    const autoCreateWorkspace = async () => {
      // CRITICAL: Wait until we've actually fetched workspaces at least once
      // This prevents race conditions where we create a workspace before knowing if one exists
      if (!hasFetchedOnce) return;
      if (workspaceLoading) return;
      if (isCreatingWorkspace) return;
      if (workspaces.length > 0) return;
      
      console.log('[AppsRedesigned] No workspaces after fetch, creating "My Workspace"');
      setIsCreatingWorkspace(true);
      try {
        const newWorkspace = await createWorkspace("My Workspace");
        if (newWorkspace) {
          setCurrentWorkspace(newWorkspace);
          toast.success("Workspace created", {
            description: "I've set up \"My Workspace\" for you — you can rename it anytime!",
          });
        }
      } catch (error) {
        console.error("[AppsRedesigned] Failed to auto-create workspace:", error);
        toast.error("Failed to create workspace. Please try again.");
      } finally {
        setIsCreatingWorkspace(false);
      }
    };
    
    autoCreateWorkspace();
  }, [hasFetchedOnce, workspaceLoading, workspaces.length, createWorkspace, setCurrentWorkspace, isCreatingWorkspace]);

  // Filter modules based on search and category
  const filteredModules = useMemo(() => {
    return SEEKSY_MODULES.filter(module => {
      const matchesSearch = !searchQuery || 
        module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || module.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Filter collections based on search
  const filteredCollections = useMemo(() => {
    return SEEKSY_COLLECTIONS.filter(collection => {
      return !searchQuery || 
        collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collection.description.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery]);

  // Mark global onboarding as complete
  const markOnboardingComplete = async () => {
    if (globalOnboardingCompleted) return; // Already done
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase
      .from('user_preferences')
      .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    
    setGlobalOnboardingCompleted(true);
  };

  const handleIntentSelect = (intent: UserIntent) => {
    // Guardrail: Block if no workspace
    if (!currentWorkspace) {
      toast.error("No workspace available. Please wait while we set one up.");
      return;
    }
    setSelectedIntent(intent);
    setIntentModalOpen(true);
  };


  const handleInstallModule = async (moduleId: string) => {
    // Guardrail: Block if no workspace - offer to create one
    if (!currentWorkspace) {
      // Open workspace selection dialog
      const module = SEEKSY_MODULES.find(m => m.id === moduleId);
      setPendingModuleId(moduleId);
      setPendingModuleName(module?.name || 'App');
      setWorkspaceDialogOpen(true);
      return;
    }
    
    await installModuleToWorkspace(moduleId, currentWorkspace.id);
  };

  // Actual install logic - shared between direct and dialog install
  const installModuleToWorkspace = async (moduleId: string, workspaceId: string) => {
    // Check for required dependencies
    const required = getRequiredModules(moduleId);
    const missingRequired = required.filter(r => !installedModuleIds.includes(r.moduleId));
    
    try {
      // Install required first
      for (const req of missingRequired) {
        await addModule(req.moduleId);
      }
      
      // Then install the module
      await addModule(moduleId);
      
      // Mark onboarding as complete after first install
      await markOnboardingComplete();
      
      // Show success confirmation with workspace name
      const module = SEEKSY_MODULES.find(m => m.id === moduleId);
      toast.success("App added!", {
        description: `${module?.name || 'App'} added to ${currentWorkspace?.name || 'your workspace'} — now visible in sidebar & My Day.`,
      });
    } catch (error) {
      console.error('[AppsRedesigned] Install error:', error);
      toast.error("Failed to add app", {
        description: "Please try again.",
      });
    }
  };

  const handleInstallCollection = async (collection: SeeksyCollection) => {
    // Guardrail: Block if no workspace
    if (!currentWorkspace) {
      toast.error("No workspace available. Please create a workspace first.");
      return;
    }
    
    try {
      const newlyInstalled: string[] = [];
      for (const moduleId of collection.includedApps) {
        if (!installedModuleIds.includes(moduleId)) {
          await addModule(moduleId);
          newlyInstalled.push(moduleId);
        }
      }
      
      if (newlyInstalled.length > 0) {
        toast.success(`${collection.name} added!`, {
          description: `${newlyInstalled.length} apps added to ${currentWorkspace.name} — now visible in sidebar & My Day.`,
        });
      }
    } catch (error) {
      toast.error("Failed to add collection", {
        description: "Please try again.",
      });
    }
  };

  const isCollectionInstalled = (collection: SeeksyCollection) => {
    return collection.includedApps.every(id => installedModuleIds.includes(id));
  };

  // Show loading state while workspace is being fetched or created
  // IMPORTANT: Only show loading if we haven't fetched yet, or if actively creating
  if (!hasFetchedOnce || isCreatingWorkspace) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">
            {isCreatingWorkspace ? "Setting up your workspace..." : "Loading your apps..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header section - always constrained */}
      <div className="px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Workspace creation notifications now use toast.success */}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {currentWorkspace 
                ? `Add Seekies to: ${currentWorkspace.name}`
                : "Add Seekies to your workspace"
              }
            </h1>
            <p className="text-muted-foreground">
              Build your perfect creator toolkit with AI-powered modules
            </p>
          </motion.div>

          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <TabsList className="bg-muted/50">
                {/* Tab order: All Modules (default), App Bundles, AI Guide (conditional) */}
                <TabsTrigger value="modules" className="gap-2">
                  <Grid3X3 className="w-4 h-4" />
                  All Modules
                </TabsTrigger>
                <TabsTrigger value="collections" className="gap-2">
                  <Layers className="w-4 h-4" />
                  App Bundles
                </TabsTrigger>
                {/* Only show AI Guide tab if onboarding is allowed */}
                {canShowOnboarding && (
                  <TabsTrigger value="spark" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Guide
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Search - only show for collections/modules */}
              {viewMode !== "spark" && (
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search modules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Spark AI Guide - constrained width */}
            <TabsContent value="spark" className="mt-8">
              <Card className="p-8 bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-rose-50/50 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-rose-950/20 border-amber-200/50 dark:border-amber-800/30">
                <SparkOnboardingGuide
                  onSelectIntent={handleIntentSelect}
                  onSkip={() => setViewMode("modules")}
                  installedModuleIds={installedModuleIds}
                />
              </Card>
            </TabsContent>

            {/* App Bundles - constrained width */}
            <TabsContent value="collections" className="mt-8">
              <div className="mb-6">
                <p className="text-muted-foreground text-sm">
                  Pre-built groups of Seekies for common workflows.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCollections.map((collection, index) => (
                  <motion.div
                    key={collection.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <AnimatedCollectionCard
                      collection={collection}
                      isInstalled={isCollectionInstalled(collection)}
                      onPreview={() => setPreviewCollection(collection)}
                    />
                  </motion.div>
                ))}
              </div>

              {filteredCollections.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold text-foreground mb-2">No app bundles found</h3>
                  <p className="text-muted-foreground text-sm">
                    Try a different search term
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* All Modules - full width layout, outside container */}
      {viewMode === "modules" && (
        <div className="px-4 pb-8 w-full">
          <div className="flex gap-6 w-full">
            {/* Module Grid */}
            <div className="flex-1 min-w-0">
              {/* Category Filter */}
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                >
                  All
                </Button>
                {MODULE_CATEGORIES.map(category => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap"
                  >
                    {category.name}
                    {category.isNew && (
                      <Badge variant="secondary" className="ml-2 text-xs">New</Badge>
                    )}
                  </Button>
                ))}
              </div>

              {/* Module Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredModules.map((module, index) => {
                  const Icon = module.icon;
                  const isInstalled = installedModuleIds.includes(module.id);
                  const isSelected = selectedModuleId === module.id;

                  return (
                    <motion.div
                      key={module.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card
                        className={cn(
                          "p-4 cursor-pointer transition-all duration-200",
                          "border-2 hover:shadow-md",
                          isSelected 
                            ? "border-primary bg-primary/5" 
                            : "border-border/50 hover:border-primary/50",
                          isInstalled && "ring-2 ring-emerald-500/20"
                        )}
                        onClick={() => setSelectedModuleId(module.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                            module.bgGradient || "bg-muted"
                          )}>
                            <Icon className={cn("w-6 h-6", module.iconColor || "text-foreground")} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-foreground">{module.name}</span>
                              {isInstalled && (
                                <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                                  <Check className="w-3 h-3 mr-1" /> Installed
                                </Badge>
                              )}
                              {module.isNew && (
                                <Badge className="text-xs">New</Badge>
                              )}
                              {module.isAIPowered && (
                                <Badge className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                                  <Sparkles className="w-3 h-3 mr-1" /> AI
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {module.description}
                            </p>
                          </div>

                          {!isInstalled && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInstallModule(module.id);
                              }}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {filteredModules.length === 0 && (
                <div className="text-center py-12">
                  <Grid3X3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold text-foreground mb-2">No modules found</h3>
                  <p className="text-muted-foreground text-sm">
                    Try a different search or category
                  </p>
                </div>
              )}
            </div>

            {/* Relationship Graph Sidebar */}
            <div className="hidden xl:block w-72 shrink-0">
              <div className="sticky top-4">
                <ModuleRelationshipGraph
                  selectedModuleId={selectedModuleId}
                  installedModuleIds={installedModuleIds}
                  onSelectModule={setSelectedModuleId}
                  onInstallModule={handleInstallModule}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Installed Count Footer */}
      {installedModuleIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <Card className="px-6 py-3 shadow-xl border-primary/20 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                <span className="font-medium text-foreground">
                  {installedModuleIds.length} module{installedModuleIds.length !== 1 ? 's' : ''} installed
                </span>
              </div>
              <Button onClick={() => navigate("/my-day")} className="gap-2">
                Go to My Day
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Modals */}
      <IntentConfirmationModal
        isOpen={intentModalOpen}
        onClose={() => {
          setIntentModalOpen(false);
          setSelectedIntent(null);
        }}
        intent={selectedIntent}
        installedModuleIds={installedModuleIds}
        workspaceName={currentWorkspace?.name || null}
        workspaceId={currentWorkspace?.id || null}
        onInstallComplete={() => {
          // After onboarding install, redirect straight to My Day
          setSelectedIntent(null);
          setIntentModalOpen(false);
          navigate("/my-day");
        }}
      />

      {previewCollection && (
        <CollectionPreviewModal
          open={!!previewCollection}
          onOpenChange={(open) => !open && setPreviewCollection(null)}
          collectionId={previewCollection.id}
          onInstallComplete={() => setPreviewCollection(null)}
        />
      )}

      {/* Workspace Selection Dialog */}
      <WorkspaceSelectionDialog
        isOpen={workspaceDialogOpen}
        onClose={() => {
          setWorkspaceDialogOpen(false);
          setPendingModuleId(null);
        }}
        moduleId={pendingModuleId || ''}
        moduleName={pendingModuleName}
        onInstall={async (workspaceId) => {
          if (pendingModuleId) {
            await installModuleToWorkspace(pendingModuleId, workspaceId);
          }
        }}
      />
    </div>
  );
}
