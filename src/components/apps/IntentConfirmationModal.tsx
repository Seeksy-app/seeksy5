import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowRight, Check, Sparkles, Lock, Zap, 
  ChevronDown, ChevronUp, Loader2, PartyPopper, Folder, AlertTriangle
} from "lucide-react";
import { UserIntent, getRequiredModules, getEnhancingModules } from "@/config/moduleRelationships";
import { SEEKSY_MODULES } from "@/components/modules/moduleData";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface IntentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  intent: UserIntent | null;
  installedModuleIds: string[];
  workspaceName: string | null;
  workspaceId: string | null;
  onInstallComplete?: () => void;
}

export function IntentConfirmationModal({
  isOpen,
  onClose,
  intent,
  installedModuleIds,
  workspaceName,
  workspaceId,
  onInstallComplete,
}: IntentConfirmationModalProps) {
  const navigate = useNavigate();
  const { addModule, currentWorkspace } = useWorkspace();
  
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);
  const [installState, setInstallState] = useState<"idle" | "installing" | "complete" | "error">("idle");
  const [installedCount, setInstalledCount] = useState(0);
  const [installError, setInstallError] = useState<string | null>(null);

  // Reset state when modal opens with new intent
  useEffect(() => {
    if (isOpen && intent) {
      const initial = new Set<string>();
      
      // Add all suggested modules that aren't installed
      intent.suggestedModules.forEach(id => {
        if (!installedModuleIds.includes(id)) {
          initial.add(id);
        }
      });
      
      // Add required modules
      intent.suggestedModules.forEach(moduleId => {
        getRequiredModules(moduleId).forEach(r => {
          if (!installedModuleIds.includes(r.moduleId)) {
            initial.add(r.moduleId);
          }
        });
      });
      
      setSelectedModules(initial);
      setInstallState("idle");
      setInstalledCount(0);
      setInstallError(null);
    }
  }, [isOpen, intent, installedModuleIds]);

  // Guard: no workspace = can't install
  if (!intent) return null;
  
  // Only allow install if workspace is ready AND we have a valid ID
  const canInstall = !!workspaceId && !!currentWorkspace;

  const Icon = intent.icon;

  // Get all modules for this intent
  const suggestedModules = intent.suggestedModules
    .map(id => SEEKSY_MODULES.find(m => m.id === id))
    .filter(Boolean);

  // Calculate required modules
  const allRequiredIds = new Set<string>();
  intent.suggestedModules.forEach(moduleId => {
    getRequiredModules(moduleId).forEach(r => allRequiredIds.add(r.moduleId));
  });

  const isModuleRequired = (moduleId: string) => allRequiredIds.has(moduleId);
  const isModuleInstalled = (moduleId: string) => installedModuleIds.includes(moduleId);

  const toggleModule = (moduleId: string) => {
    if (isModuleRequired(moduleId)) return; // Can't unselect required
    
    setSelectedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    // Guardrail: Prevent install without workspace
    if (!canInstall || !currentWorkspace) {
      setInstallError("Workspace not ready. Please wait a moment and try again.");
      return;
    }
    
    const toInstall = Array.from(selectedModules).filter(id => !isModuleInstalled(id));
    
    if (toInstall.length === 0) {
      markOnboardingComplete();
      setInstallState("complete");
      return;
    }
    
    setInstallState("installing");
    setInstallError(null);
    
    let successCount = 0;
    let lastError: string | null = null;
    
    // Install modules one by one with progress using workspace's addModule
    for (let i = 0; i < toInstall.length; i++) {
      try {
        await addModule(toInstall[i]);
        successCount++;
        setInstalledCount(i + 1);
      } catch (error: any) {
        console.error(`Failed to install module ${toInstall[i]}:`, error);
        lastError = error?.message || "Failed to install module";
      }
      
      // Small delay between installs for visual feedback
      await new Promise(r => setTimeout(r, 200));
    }
    
    // Only show success if ALL modules installed successfully
    if (successCount === toInstall.length) {
      markOnboardingComplete();
      setInstallState("complete");
      onInstallComplete?.();
    } else {
      setInstallError(lastError || "Some modules failed to install");
      setInstallState("error");
      toast.error("Some modules failed to install. Please try again.");
    }
  };

  // Mark onboarding as complete in database to prevent re-showing AI Guide
  const markOnboardingComplete = async () => {
    if (workspaceId) {
      // Also update database for persistence
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_preferences')
          .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }
    }
  };

  const handleGoToMyDay = () => {
    onClose();
    navigate("/my-day");
  };

  const newModulesCount = Array.from(selectedModules).filter(id => !isModuleInstalled(id)).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && installState !== "installing" && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {/* Installation Complete State */}
        <AnimatePresence mode="wait">
          {installState === "complete" ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
              >
                <PartyPopper className="w-10 h-10 text-white" />
              </motion.div>
              
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-foreground mb-2"
              >
                You're all set!
              </motion.h3>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground mb-6"
              >
                Your workspace is ready for <span className="font-medium text-foreground">{intent.label.toLowerCase()}</span>
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={handleGoToMyDay}
                  size="lg"
                  className={cn("gap-2 bg-gradient-to-r", intent.color)}
                >
                  <Sparkles className="w-5 h-5" />
                  Go to My Day
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <div className="flex items-center gap-4 mb-2">
                  <motion.div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center",
                      `bg-gradient-to-br ${intent.color}`
                    )}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <div>
                    <DialogTitle className="text-xl">{intent.label}</DialogTitle>
                    <DialogDescription>{intent.description}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Workspace destination */}
              {workspaceName && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Folder className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Installing to:</span>
                    <span className="font-medium text-foreground">{workspaceName}</span>
                    <span className="text-xs text-muted-foreground">(editable later)</span>
                  </div>
                </div>
              )}

              {/* No workspace warning */}
              {!canInstall && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <span>No workspace available. Please wait while we set one up.</span>
                  </div>
                </div>
              )}

              {/* Workflow Preview */}
              <div className="p-4 rounded-xl bg-muted/50 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">Your workflow</span>
                </div>
                <p className="text-sm text-foreground">{intent.workflow}</p>
              </div>

              {/* Module Selection */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Modules to install ({newModulesCount} new)
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs"
                  >
                    {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showDetails ? "Less" : "More"} details
                  </Button>
                </div>

                {suggestedModules.map((module, index) => {
                  if (!module) return null;
                  const ModIcon = module.icon;
                  const isRequired = isModuleRequired(module.id);
                  const isInstalled = isModuleInstalled(module.id);
                  const isSelected = selectedModules.has(module.id) || isInstalled;

                  return (
                    <motion.div
                      key={module.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                        isInstalled 
                          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                          : isSelected
                            ? "bg-primary/5 border-primary/30"
                            : "bg-card border-border hover:border-primary/50"
                      )}
                      onClick={() => !isInstalled && !isRequired && toggleModule(module.id)}
                    >
                      <div className="pt-0.5">
                        {isInstalled ? (
                          <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <Checkbox
                            checked={isSelected}
                            disabled={isRequired}
                            onCheckedChange={() => toggleModule(module.id)}
                          />
                        )}
                      </div>

                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        module.bgGradient || "bg-muted"
                      )}>
                        <ModIcon className={cn("w-5 h-5", module.iconColor)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{module.name}</span>
                          {isInstalled && (
                            <Badge variant="outline" className="text-xs text-emerald-600">
                              Already installed
                            </Badge>
                          )}
                          {isRequired && !isInstalled && (
                            <Badge variant="destructive" className="text-xs">
                              <Lock className="w-3 h-3 mr-1" />
                              Required
                            </Badge>
                          )}
                          {module.isAIPowered && (
                            <Badge className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                        
                        <AnimatePresence>
                          {showDetails && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-sm text-muted-foreground mt-1"
                            >
                              {module.description}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Installing Progress */}
              <AnimatePresence>
                {installState === "installing" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20"
                  >
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          Installing modules...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {installedCount} of {newModulesCount} complete
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(installedCount / newModulesCount) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <Button 
                  variant="ghost" 
                  onClick={onClose}
                  disabled={installState === "installing"}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!canInstall || newModulesCount === 0 || installState === "installing"}
                  className={cn("gap-2 bg-gradient-to-r", intent.color)}
                >
                  {!canInstall ? (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      No Workspace
                    </>
                  ) : installState === "installing" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Installing...
                    </>
                  ) : newModulesCount > 0 ? (
                    <>
                      Install {newModulesCount} module{newModulesCount !== 1 ? 's' : ''}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      All installed
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
