import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, Plus, History, Star, Clock, Trash2, Loader2, Save } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export interface CFOStudioVersion {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
  assumptions: Record<string, any>;
  is_live?: boolean;
}

interface CFOVersionManagerProps {
  versions: CFOStudioVersion[];
  currentVersionId: string | null;
  onSelectVersion: (version: CFOStudioVersion | null) => void;
  onSaveVersion: (name: string, notes: string) => Promise<void>;
  onDeleteVersion: (id: string) => Promise<void>;
  isSaving: boolean;
  isLoading: boolean;
}

export function CFOVersionManager({
  versions,
  currentVersionId,
  onSelectVersion,
  onSaveVersion,
  onDeleteVersion,
  isSaving,
  isLoading,
}: CFOVersionManagerProps) {
  const [open, setOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [versionNotes, setVersionNotes] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const currentVersion = versions.find(v => v.id === currentVersionId);
  const liveVersion = versions.find(v => v.is_live);

  const formatRelative = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  };

  const handleSelect = (version: CFOStudioVersion | null) => {
    onSelectVersion(version);
    setOpen(false);
  };

  const handleSave = async () => {
    if (!versionName.trim()) return;
    await onSaveVersion(versionName.trim(), versionNotes.trim());
    setSaveDialogOpen(false);
    setVersionName('');
    setVersionNotes('');
  };

  const handleDelete = async (id: string) => {
    await onDeleteVersion(id);
    setDeleteId(null);
  };

  const openSaveDialog = () => {
    setVersionName(`Pro Forma - ${new Date().toLocaleDateString()}`);
    setVersionNotes('');
    setSaveDialogOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 min-w-[200px] justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" />
                {isLoading ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : currentVersion ? (
                  <span className="max-w-[150px] truncate">{currentVersion.name}</span>
                ) : (
                  <span className="text-muted-foreground">Unsaved Draft</span>
                )}
              </div>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80 bg-background border shadow-lg z-50">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Saved Versions</span>
              <Badge variant="secondary" className="text-xs">{versions.length}</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* New Draft Option */}
            <DropdownMenuItem
              onClick={() => handleSelect(null)}
              className={cn(
                'flex items-center justify-between py-2',
                !currentVersionId && 'bg-accent'
              )}
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span className="font-medium">New Draft</span>
              </div>
              {!currentVersionId && (
                <Badge variant="secondary" className="text-xs">Current</Badge>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Saved Versions */}
            {versions.length > 0 ? (
              versions.map((version) => (
                <DropdownMenuItem
                  key={version.id}
                  onClick={() => handleSelect(version)}
                  className={cn(
                    'flex items-start justify-between gap-2 py-2',
                    currentVersionId === version.id && 'bg-accent'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {version.is_live && (
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      )}
                      <span className="font-medium truncate">{version.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatRelative(version.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {version.is_live && (
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                        Live
                      </Badge>
                    )}
                    {currentVersionId === version.id && (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(version.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No saved versions yet.
                <br />
                Click "Save Version" to create one.
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          size="sm" 
          onClick={openSaveDialog}
          className="gap-2"
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Version
        </Button>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Pro Forma Version</DialogTitle>
            <DialogDescription>
              Save a snapshot of your current assumptions and forecasts. You can load this version later to compare or continue editing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="version-name">Version Name</Label>
              <Input
                id="version-name"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="Q1 2025 Forecast"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version-notes">Notes (optional)</Label>
              <Textarea
                id="version-notes"
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                placeholder="Add any notes about this version..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!versionName.trim() || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Version'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Version</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this version? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
