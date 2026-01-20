import { useState } from "react";
import { X, Layers, Puzzle, Sparkles, FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (workspaceId: string) => void;
  onOpenModuleCenter?: () => void;
}

type Step = "name" | "choose";

export function CreateWorkspaceModal({ isOpen, onClose, onCreated, onOpenModuleCenter }: CreateWorkspaceModalProps) {
  const { createWorkspace, setCurrentWorkspace } = useWorkspace();
  const [step, setStep] = useState<Step>("name");
  const [workspaceName, setWorkspaceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const resetState = () => {
    setStep("name");
    setWorkspaceName("");
    setIsCreating(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleNext = () => {
    if (step === "name") {
      if (!workspaceName.trim()) {
        toast.error("Please enter a workspace name");
        return;
      }
      setStep("choose");
    }
  };

  const handleBack = () => {
    if (step === "choose") setStep("name");
  };

  const handleCreateBlank = async () => {
    if (!workspaceName.trim()) return;

    setIsCreating(true);
    try {
      const workspace = await createWorkspace(workspaceName, []);
      if (workspace) {
        setCurrentWorkspace(workspace);
        toast.success(`Workspace "${workspaceName}" created!`);
        onCreated?.(workspace.id);
        handleClose();
      }
    } catch (error) {
      toast.error("Failed to create workspace");
    } finally {
      setIsCreating(false);
    }
  };

  const handleChooseApps = async () => {
    if (!workspaceName.trim()) return;

    setIsCreating(true);
    try {
      // Create workspace first, then open module center
      const workspace = await createWorkspace(workspaceName, []);
      if (workspace) {
        setCurrentWorkspace(workspace);
        toast.success(`Workspace "${workspaceName}" created!`);
        onCreated?.(workspace.id);
        handleClose();
        // Open module center to add apps
        onOpenModuleCenter?.();
      }
    } catch (error) {
      toast.error("Failed to create workspace");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative w-full max-w-2xl bg-background rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Create New Workspace</h2>
              <p className="text-xs text-muted-foreground">
                {step === "name" ? "Give your workspace a name" : "Choose how to start"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Step: Name */}
        {step === "name" && (
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Workspace Name</label>
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="My Podcast Studio"
                className="mt-2"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
              />
            </div>
          </div>
        )}

        {/* Step: Choose - Blank or Collections/Apps */}
        {step === "choose" && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleCreateBlank}
                disabled={isCreating}
                className="p-6 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center mb-4">
                  <FileX className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">Blank Workspace</h3>
                <p className="text-sm text-muted-foreground">
                  Start empty and add apps later
                </p>
              </button>

              <button
                onClick={handleChooseApps}
                disabled={isCreating}
                className="p-6 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
                  <Puzzle className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">Choose from Collections/Apps</h3>
                <p className="text-sm text-muted-foreground">
                  Browse and select apps for your workspace
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/30">
          <Button
            variant="ghost"
            onClick={step === "name" ? handleClose : handleBack}
          >
            {step === "name" ? "Cancel" : "Back"}
          </Button>
          
          {step === "name" && (
            <Button onClick={handleNext}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
