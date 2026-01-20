import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace, Workspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  ChevronDown, 
  Search, 
  Plus, 
  Check,
  Layers,
  MoreHorizontal,
  Pencil,
  Trash2,
  Star,
  Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";

export function WorkspaceSelector() {
  const navigate = useNavigate();
  const { 
    workspaces, 
    currentWorkspace, 
    workspaceModules,
    setCurrentWorkspace, 
    createWorkspace,
    updateWorkspace,
    deleteWorkspace 
  } = useWorkspace();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [workspaceToEdit, setWorkspaceToEdit] = useState<Workspace | null>(null);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);

  const filteredWorkspaces = workspaces.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRenameWorkspace = async () => {
    if (!workspaceToEdit || !newWorkspaceName.trim()) return;

    await updateWorkspace(workspaceToEdit.id, { name: newWorkspaceName });
    toast.success("Workspace renamed");
    setShowRenameDialog(false);
    setNewWorkspaceName("");
    setWorkspaceToEdit(null);
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceToEdit) return;

    const result = await deleteWorkspace(workspaceToEdit.id);
    setShowDeleteDialog(false);
    setWorkspaceToEdit(null);
    
    if (result.createdWorkspace) {
      // Show recovery dialog when workspace was auto-created
      setShowRecoveryDialog(true);
    } else if (result.navigateTo) {
      toast.success("Workspace deleted");
      navigate(result.navigateTo);
    }
  };

  const handleDuplicateWorkspace = async (workspace: Workspace) => {
    // Get current workspace's modules
    const moduleIds = workspaceModules
      .filter(wm => wm.workspace_id === workspace.id)
      .map(wm => wm.module_id);

    const newWorkspace = await createWorkspace(
      `${workspace.name} (Clone)`,
      moduleIds.length > 0 ? moduleIds : workspace.modules
    );

    if (newWorkspace) {
      setCurrentWorkspace(newWorkspace);
      toast.success("Workspace cloned", {
        description: `Created "${newWorkspace.name}"`,
      });
    }
    setIsOpen(false);
  };

  const handleSetDefault = async (workspace: Workspace) => {
    await updateWorkspace(workspace.id, { is_default: true });
    toast.success(`"${workspace.name}" is now your default workspace`);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between gap-2 px-3 py-2 h-10 bg-background border-border hover:bg-muted/50 text-foreground"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: currentWorkspace?.icon_color || '#10B981' }}
              >
                {currentWorkspace?.name?.charAt(0).toUpperCase() || 'W'}
              </div>
              <span className="font-medium truncate text-sm">
                {currentWorkspace?.name || 'Select Workspace'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="start" 
          className="w-72 bg-popover border shadow-lg z-50"
          sideOffset={4}
        >
          {/* Search */}
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a workspace"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Workspaces list */}
          <div className="max-h-64 overflow-y-auto py-1">
            <div className="px-2 py-1">
              <span className="text-xs font-medium text-muted-foreground">My workspaces</span>
            </div>
            
            {filteredWorkspaces.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No workspaces found
              </div>
            ) : (
              filteredWorkspaces.map((workspace) => (
                <div key={workspace.id} className="group relative">
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-2 px-2 py-2 cursor-pointer",
                      currentWorkspace?.id === workspace.id && "bg-primary/10"
                    )}
                    onClick={() => {
                      setCurrentWorkspace(workspace);
                      setIsOpen(false);
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: workspace.icon_color }}
                    >
                      {workspace.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 truncate">{workspace.name}</span>
                    {workspace.is_default && (
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    )}
                    {currentWorkspace?.id === workspace.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                  
                  {/* Workspace actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-popover border shadow-lg z-[60]">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setWorkspaceToEdit(workspace);
                          setNewWorkspaceName(workspace.name);
                          setShowRenameDialog(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateWorkspace(workspace);
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Clone Workspace
                      </DropdownMenuItem>
                      {!workspace.is_default && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(workspace);
                          }}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Set as default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWorkspaceToEdit(workspace);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Actions */}
          <DropdownMenuItem 
            onClick={() => {
              setShowCreateModal(true);
              setIsOpen(false);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add workspace
          </DropdownMenuItem>
          
          <DropdownMenuItem className="gap-2">
            <Layers className="h-4 w-4" />
            Browse all
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename workspace</DialogTitle>
          </DialogHeader>
          <Input
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            placeholder="Workspace name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameWorkspace}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the workspace layout for "{workspaceToEdit?.name}" but will <strong>not</strong> delete your actual data (clips, campaigns, contacts, etc.). You can always recreate the workspace later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkspace}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Workspace Recovery Dialog */}
      <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Workspace created</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-muted-foreground">
              We created a new workspace so you can keep working.
            </p>
            <p className="text-muted-foreground text-sm">
              Your data stays safe. Your studios, files, and settings remain saved — you can reinstall Seekies anytime to restore your workspace layout.
            </p>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => {
                setShowRecoveryDialog(false);
                navigate('/apps?view=modules');
              }}
            >
              Add Seekies
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
