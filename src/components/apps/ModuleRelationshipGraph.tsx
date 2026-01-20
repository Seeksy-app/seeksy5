import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Link2, Sparkles, Plus, Check, ArrowRight, 
  Lock, Zap
} from "lucide-react";
import { SEEKSY_MODULES } from "@/components/modules/moduleData";
import { 
  getRequiredModules, 
  getEnhancingModules,
  hasDependencies,
  hasEnhancements
} from "@/config/moduleRelationships";
import { cn } from "@/lib/utils";

interface ModuleRelationshipGraphProps {
  selectedModuleId: string | null;
  installedModuleIds: string[];
  onSelectModule: (moduleId: string) => void;
  onInstallModule: (moduleId: string) => void;
}

export function ModuleRelationshipGraph({
  selectedModuleId,
  installedModuleIds,
  onSelectModule,
  onInstallModule,
}: ModuleRelationshipGraphProps) {
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  const selectedModule = useMemo(() => {
    if (!selectedModuleId) return null;
    return SEEKSY_MODULES.find(m => m.id === selectedModuleId);
  }, [selectedModuleId]);

  const requiredModules = useMemo(() => {
    if (!selectedModuleId) return [];
    return getRequiredModules(selectedModuleId);
  }, [selectedModuleId]);

  const enhancingModules = useMemo(() => {
    if (!selectedModuleId) return [];
    return getEnhancingModules(selectedModuleId);
  }, [selectedModuleId]);

  const getModuleData = (moduleId: string) => {
    return SEEKSY_MODULES.find(m => m.id === moduleId);
  };

  const isInstalled = (moduleId: string) => installedModuleIds.includes(moduleId);

  if (!selectedModule) {
    return (
      <Card className="p-8 text-center border-dashed">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
          <Link2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">Select a Seeksy</h3>
        <p className="text-sm text-muted-foreground">
          Click on any module to see how it connects with others
        </p>
      </Card>
    );
  }

  const Icon = selectedModule.icon;

  return (
    <Card className="p-6 overflow-hidden">
      {/* Selected Module - Center */}
      <div className="flex flex-col items-center mb-8">
        <motion.div
          layoutId={`module-${selectedModuleId}`}
          className="relative mb-4"
        >
          <div className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center",
            selectedModule.bgGradient || "bg-gradient-to-br from-primary/20 to-primary/10"
          )}>
            <Icon className={cn("w-10 h-10", selectedModule.iconColor || "text-primary")} />
          </div>
          {isInstalled(selectedModuleId!) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
            >
              <Check className="w-4 h-4 text-white" />
            </motion.div>
          )}
        </motion.div>
        
        <h3 className="text-lg font-semibold text-foreground">{selectedModule.name}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {selectedModule.description}
        </p>
        
        {!isInstalled(selectedModuleId!) && (
          <Button
            className="mt-4 gap-2"
            onClick={() => onInstallModule(selectedModuleId!)}
          >
            <Plus className="w-4 h-4" />
            Add to Workspace
          </Button>
        )}
      </div>

      {/* Required Modules */}
      {requiredModules.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-medium text-foreground">Required</span>
            <Badge variant="destructive" className="text-xs">Must have</Badge>
          </div>
          
          <div className="grid gap-3">
            {requiredModules.map(({ moduleId, reason }) => {
              const module = getModuleData(moduleId);
              if (!module) return null;
              const ModIcon = module.icon;
              const installed = isInstalled(moduleId);
              
              return (
                <motion.div
                  key={moduleId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer",
                    installed 
                      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                      : "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30 hover:border-rose-300"
                  )}
                  onClick={() => onSelectModule(moduleId)}
                  onMouseEnter={() => setHoveredModule(moduleId)}
                  onMouseLeave={() => setHoveredModule(null)}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    module.bgGradient || "bg-muted"
                  )}>
                    <ModIcon className={cn("w-6 h-6", module.iconColor || "text-foreground")} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{module.name}</span>
                      {installed && (
                        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                          <Check className="w-3 h-3 mr-1" /> Installed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{reason}</p>
                  </div>
                  
                  {!installed && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInstallModule(moduleId);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enhancing Modules */}
      {enhancingModules.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-foreground">Enhanced by</span>
            <Badge variant="secondary" className="text-xs">Recommended</Badge>
          </div>
          
          <div className="grid gap-3">
            {enhancingModules.map(({ moduleId, reason }) => {
              const module = getModuleData(moduleId);
              if (!module) return null;
              const ModIcon = module.icon;
              const installed = isInstalled(moduleId);
              
              return (
                <motion.div
                  key={moduleId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                    installed 
                      ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                      : "border-border bg-card hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                  )}
                  onClick={() => onSelectModule(moduleId)}
                  onMouseEnter={() => setHoveredModule(moduleId)}
                  onMouseLeave={() => setHoveredModule(null)}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    module.bgGradient || "bg-muted"
                  )}>
                    <ModIcon className={cn("w-6 h-6", module.iconColor || "text-foreground")} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{module.name}</span>
                      {installed && (
                        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                          <Check className="w-3 h-3 mr-1" /> Installed
                        </Badge>
                      )}
                      {module.isAIPowered && (
                        <Badge className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                          <Sparkles className="w-3 h-3 mr-1" /> AI
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{reason}</p>
                  </div>
                  
                  {!installed && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="shrink-0 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInstallModule(moduleId);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* No relationships */}
      {requiredModules.length === 0 && enhancingModules.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">This is a standalone Seeksy</p>
          <p className="text-xs">It works great on its own!</p>
        </div>
      )}
    </Card>
  );
}
