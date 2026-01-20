/**
 * WorkspaceSelectionDialog - Shown before installing a Seeksy
 * Allows user to choose which workspace to install into, or create a new one.
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sparkles, Plus, FolderOpen, Loader2 } from 'lucide-react';
import { useWorkspace, Workspace } from '@/contexts/WorkspaceContext';
import { toast } from 'sonner';

interface WorkspaceSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  moduleName: string;
  onInstall: (workspaceId: string) => Promise<void>;
  suggestNewWorkspace?: boolean;
  suggestedWorkspaceName?: string;
}

export function WorkspaceSelectionDialog({
  isOpen,
  onClose,
  moduleId,
  moduleName,
  onInstall,
  suggestNewWorkspace = false,
  suggestedWorkspaceName = 'New Workspace',
}: WorkspaceSelectionDialogProps) {
  const { workspaces, currentWorkspace, createWorkspace, setCurrentWorkspace } = useWorkspace();
  
  const [selection, setSelection] = useState<'current' | 'new'>(
    suggestNewWorkspace ? 'new' : 'current'
  );
  const [newWorkspaceName, setNewWorkspaceName] = useState(suggestedWorkspaceName);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      if (selection === 'new') {
        // Create new workspace first
        const workspace = await createWorkspace(newWorkspaceName.trim() || 'New Workspace');
        if (!workspace) {
          throw new Error('Failed to create workspace');
        }
        setCurrentWorkspace(workspace);
        await onInstall(workspace.id);
        toast.success(`Created "${workspace.name}" and added ${moduleName}`);
      } else {
        // Install to current workspace
        if (!currentWorkspace) {
          throw new Error('No workspace selected');
        }
        await onInstall(currentWorkspace.id);
        toast.success(`${moduleName} added to ${currentWorkspace.name}`);
      }
      onClose();
    } catch (error) {
      console.error('Install error:', error);
      toast.error('Failed to install. Please try again.');
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Add {moduleName}
          </DialogTitle>
          <DialogDescription>
            Choose where to add this Seeksy
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={selection} onValueChange={(v) => setSelection(v as 'current' | 'new')}>
            {/* Current workspace option */}
            {currentWorkspace && (
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors">
                <RadioGroupItem value="current" id="current" className="mt-0.5" />
                <Label htmlFor="current" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    Add to current workspace
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentWorkspace.name}
                  </p>
                </Label>
              </div>
            )}

            {/* New workspace option */}
            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors mt-2">
              <RadioGroupItem value="new" id="new" className="mt-0.5" />
              <Label htmlFor="new" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 font-medium">
                  <Plus className="h-4 w-4 text-primary" />
                  Create new workspace
                  {suggestNewWorkspace && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Suggested
                    </span>
                  )}
                </div>
                {selection === 'new' && (
                  <div className="mt-2">
                    <Input
                      placeholder="Workspace name"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      className="text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isInstalling}>
            Cancel
          </Button>
          <Button onClick={handleInstall} disabled={isInstalling}>
            {isInstalling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Seeksy'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
