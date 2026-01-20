import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { SEEKSY_MODULES, type SeeksyModule } from "@/components/modules/moduleData";
import { ModuleDetailDrawer } from "@/components/modules/ModuleDetailDrawer";
import { toast } from "sonner";

interface RecommendedModule {
  id: string;
  name: string;
  description: string;
}

const RECOMMENDED_MODULES: RecommendedModule[] = [
  { id: "podcasts", name: "Podcasting", description: "Host and distribute your podcast" },
  { id: "meetings", name: "Meetings", description: "Schedule and manage appointments" },
  { id: "events", name: "Events", description: "Create and sell event tickets" },
  { id: "identity-verification", name: "Identity Verification", description: "Verify your face and voice" },
  { id: "social-analytics", name: "Social Analytics", description: "Track your social media growth" },
  { id: "email", name: "Email Suite", description: "Manage your email communications" },
];

export const RecommendedSeeksiesBanner = () => {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem("recommended-seeksies-dismissed") === "true";
  });
  const [selectedModule, setSelectedModule] = useState<SeeksyModule | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const { currentWorkspace, workspaceModules, addModule } = useWorkspace();

  // Get active module IDs from workspace
  const activeModuleIds = useMemo(() => {
    const moduleIds = new Set<string>();
    workspaceModules.forEach(wm => moduleIds.add(wm.module_id.toLowerCase()));
    currentWorkspace?.modules?.forEach(m => moduleIds.add(m.toLowerCase()));
    return moduleIds;
  }, [workspaceModules, currentWorkspace]);

  // Find modules that are NOT activated
  const recommendedModules = useMemo(() => {
    return RECOMMENDED_MODULES.filter(mod => {
      return !activeModuleIds.has(mod.id) && 
        !Array.from(activeModuleIds).some(activeId => 
          activeId.includes(mod.id) || mod.id.includes(activeId)
        );
    }).slice(0, 3); // Show max 3 recommendations
  }, [activeModuleIds]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("recommended-seeksies-dismissed", "true");
  };

  const handleModuleClick = (moduleId: string) => {
    // Find the full module data from SEEKSY_MODULES
    const fullModule = SEEKSY_MODULES.find(m => m.id === moduleId);
    if (fullModule) {
      setSelectedModule(fullModule);
    }
  };

  const handleInstall = async () => {
    if (!selectedModule || !currentWorkspace) return;
    
    setIsInstalling(true);
    try {
      await addModule(selectedModule.id);
      toast.success("App added!", {
        description: `${selectedModule.name} has been added to ${currentWorkspace.name}.`,
      });
      setSelectedModule(null);
    } catch (error) {
      toast.error("Failed to add app");
    } finally {
      setIsInstalling(false);
    }
  };

  const handleOpenModule = () => {
    if (selectedModule?.route) {
      navigate(selectedModule.route);
    }
  };

  // Don't show if dismissed or no recommendations
  if (isDismissed || recommendedModules.length === 0) return null;

  const isModuleInstalled = selectedModule ? activeModuleIds.has(selectedModule.id) : false;

  return (
    <>
      <div className="w-full mb-6 relative">
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">Expand Your Toolkit</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  These Seeksies pair well with what you've already installed
                </p>
                <div className="flex flex-wrap gap-2">
                  {recommendedModules.map((mod) => (
                    <Button
                      key={mod.id}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 bg-background/80"
                      onClick={() => handleModuleClick(mod.id)}
                    >
                      {mod.name}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Module Detail Drawer */}
      <ModuleDetailDrawer
        module={selectedModule}
        isOpen={!!selectedModule}
        onClose={() => setSelectedModule(null)}
        isInstalled={isModuleInstalled}
        isInstalling={isInstalling}
        onInstall={handleInstall}
        onOpen={handleOpenModule}
      />
    </>
  );
};
