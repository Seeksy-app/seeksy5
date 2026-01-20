import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Folder,
  FolderOpen,
  Plus,
  MoreVertical,
  Edit3,
  Trash2,
  FolderInput,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaFolder {
  id: string;
  name: string;
  color?: string;
  itemCount?: number;
}

interface FolderSidebarProps {
  folders: MediaFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  totalItems: number;
  unsortedItems: number;
}

export function FolderSidebar({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  totalItems,
  unsortedItems,
}: FolderSidebarProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!folderName.trim()) return;
    onCreateFolder(folderName);
    setFolderName("");
    setCreateDialogOpen(false);
  };

  const handleRename = () => {
    if (!folderName.trim() || !renamingFolderId) return;
    onRenameFolder(renamingFolderId, folderName);
    setFolderName("");
    setRenamingFolderId(null);
    setRenameDialogOpen(false);
  };

  const openRenameDialog = (folder: MediaFolder) => {
    setRenamingFolderId(folder.id);
    setFolderName(folder.name);
    setRenameDialogOpen(true);
  };

  return (
    <>
      <div className="w-64 border-r bg-card flex flex-col h-full">
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-3">Media Library</h3>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            size="sm"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {/* All Media */}
            <Button
              variant={selectedFolderId === null ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => onSelectFolder(null)}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              All Media
              <span className="ml-auto text-xs text-muted-foreground">
                {totalItems}
              </span>
            </Button>

            {/* Unsorted */}
            <Button
              variant={selectedFolderId === "unsorted" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => onSelectFolder("unsorted")}
            >
              <FolderInput className="h-4 w-4 mr-2" />
              Unsorted
              <span className="ml-auto text-xs text-muted-foreground">
                {unsortedItems}
              </span>
            </Button>

            <div className="h-px bg-border my-2" />

            {/* User Folders */}
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center group"
              >
                <Button
                  variant={selectedFolderId === folder.id ? "default" : "ghost"}
                  className="flex-1 justify-start"
                  onClick={() => onSelectFolder(folder.id)}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  {folder.name}
                  {folder.itemCount !== undefined && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {folder.itemCount}
                    </span>
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openRenameDialog(folder)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteFolder(folder.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Organize your media into folders
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g., Product Videos, Podcasts"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>Enter a new name for this folder</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rename-folder">Folder Name</Label>
              <Input
                id="rename-folder"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter new name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
