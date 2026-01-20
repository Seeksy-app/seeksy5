import { useState, useEffect, useCallback, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, Plus, Search, Pin, Archive, Trash2, Copy, Check, 
  FileText, PinOff, ArchiveRestore 
} from 'lucide-react';
import { useAdminNotes, useCreateNote, useUpdateNote, useDeleteNote, type AdminNote } from '@/hooks/useAdminNotes';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AdminNotesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminNotesDrawer({ open, onOpenChange }: AdminNotesDrawerProps) {
  const { data: notes = [], isLoading } = useAdminNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<AdminNote | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Filter notes based on search
  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  // Sort: pinned first, then by updated_at
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  // Load note into editor
  const selectNote = useCallback((note: AdminNote) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags);
  }, []);

  // Auto-save after 800ms idle
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = setTimeout(() => {
      if (selectedNote) {
        updateNote.mutate({
          id: selectedNote.id,
          title: editTitle,
          content: editContent,
          tags: editTags,
        });
      }
    }, 800);
  }, [selectedNote, editTitle, editContent, editTags, updateNote]);

  useEffect(() => {
    if (selectedNote) {
      triggerAutoSave();
    }
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [editTitle, editContent, editTags, triggerAutoSave, selectedNote]);

  // Create new note
  const handleNewNote = async () => {
    const result = await createNote.mutateAsync({
      title: 'Untitled Note',
      content: '',
      tags: [],
    });
    selectNote(result);
  };

  // Copy content
  const handleCopy = () => {
    navigator.clipboard.writeText(editContent);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Toggle pin
  const handleTogglePin = () => {
    if (selectedNote) {
      updateNote.mutate({
        id: selectedNote.id,
        is_pinned: !selectedNote.is_pinned,
      });
      setSelectedNote({ ...selectedNote, is_pinned: !selectedNote.is_pinned });
    }
  };

  // Toggle archive
  const handleToggleArchive = () => {
    if (selectedNote) {
      updateNote.mutate({
        id: selectedNote.id,
        is_archived: !selectedNote.is_archived,
      });
      setSelectedNote(null);
      toast.success(selectedNote.is_archived ? 'Note restored' : 'Note archived');
    }
  };

  // Delete note
  const handleDelete = () => {
    if (selectedNote) {
      deleteNote.mutate(selectedNote.id);
      setSelectedNote(null);
      setDeleteDialogOpen(false);
    }
  };

  // Add tag
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!editTags.includes(tagInput.trim())) {
        setEditTags([...editTags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tag: string) => {
    setEditTags(editTags.filter(t => t !== tag));
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
          <SheetHeader className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Admin Notes
              </SheetTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleNewNote} disabled={createNote.isPending}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Note
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </SheetHeader>

          <div className="flex flex-1 min-h-0">
            {/* Notes List */}
            <div className="w-1/3 border-r flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground p-2">Loading...</p>
                  ) : sortedNotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">No notes yet</p>
                  ) : (
                    sortedNotes.map((note) => (
                      <button
                        key={note.id}
                        onClick={() => selectNote(note)}
                        className={cn(
                          "w-full text-left p-2 rounded-md hover:bg-muted transition-colors",
                          selectedNote?.id === note.id && "bg-muted"
                        )}
                      >
                        <div className="flex items-start gap-1">
                          {note.is_pinned && <Pin className="h-3 w-3 text-primary shrink-0 mt-0.5" />}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {note.title || 'Untitled'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                            </p>
                            {note.tags.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {note.tags.slice(0, 2).map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0">
                                    {tag}
                                  </Badge>
                                ))}
                                {note.tags.length > 2 && (
                                  <span className="text-[10px] text-muted-foreground">+{note.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Editor */}
            <div className="flex-1 flex flex-col min-w-0">
              {selectedNote ? (
                <>
                  <div className="p-4 space-y-3 flex-1 overflow-auto">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Note title"
                      className="text-lg font-semibold border-0 px-0 focus-visible:ring-0"
                    />
                    
                    <div className="flex flex-wrap gap-1 items-center">
                      {editTags.map(tag => (
                        <Badge 
                          key={tag} 
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Add tag..."
                        className="w-24 h-6 text-xs border-dashed"
                      />
                    </div>

                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Write your notes here..."
                      className="flex-1 min-h-[300px] resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="p-3 border-t flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleTogglePin}>
                      {selectedNote.is_pinned ? (
                        <><PinOff className="h-4 w-4 mr-1" /> Unpin</>
                      ) : (
                        <><Pin className="h-4 w-4 mr-1" /> Pin</>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleToggleArchive}>
                      {selectedNote.is_archived ? (
                        <><ArchiveRestore className="h-4 w-4 mr-1" /> Restore</>
                      ) : (
                        <><Archive className="h-4 w-4 mr-1" /> Archive</>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                    {updateNote.isPending && (
                      <span className="text-xs text-muted-foreground ml-auto">Saving...</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Select a note or create a new one</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedNote?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
