import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Search, Pin, Archive, Trash2, Copy, Check, 
  FileText, PinOff, ArchiveRestore 
} from 'lucide-react';
import { useAdminNotes, useCreateNote, useUpdateNote, useDeleteNote, type AdminNote } from '@/hooks/useAdminNotes';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { AdminNotesUrlFetcher } from '@/components/admin/AdminNotesUrlFetcher';
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

export default function AdminNotes() {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const { data: activeNotes = [], isLoading: loadingActive } = useAdminNotes(false);
  const { data: allNotes = [], isLoading: loadingAll } = useAdminNotes(true);
  
  const archivedNotes = allNotes.filter(n => n.is_archived);
  const notes = activeTab === 'active' ? activeNotes : archivedNotes;
  const isLoading = activeTab === 'active' ? loadingActive : loadingAll;

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
    setActiveTab('active');
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Notes</h1>
          <p className="text-muted-foreground">Save prompts, snippets, and thoughts</p>
        </div>
        <div className="flex gap-2">
          <AdminNotesUrlFetcher onContentFetched={async (title, content) => {
            const result = await createNote.mutateAsync({ title, content, tags: ['imported'] });
            selectNote(result);
          }} />
          <Button onClick={handleNewNote} disabled={createNote.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 min-h-[600px]">
        {/* Notes List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'archived')} className="mt-3">
              <TabsList className="w-full">
                <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
                <TabsTrigger value="archived" className="flex-1">Archived</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-2 space-y-1">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground p-2">Loading...</p>
                ) : sortedNotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">
                    {activeTab === 'active' ? 'No notes yet' : 'No archived notes'}
                  </p>
                ) : (
                  sortedNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => selectNote(note)}
                      className={cn(
                        "w-full text-left p-3 rounded-md hover:bg-muted transition-colors",
                        selectedNote?.id === note.id && "bg-muted"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {note.is_pinned && <Pin className="h-3 w-3 text-primary shrink-0 mt-1" />}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{note.title || 'Untitled'}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                          </p>
                          {note.tags.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {note.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {note.tags.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{note.tags.length - 3}</span>
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
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedNote ? (
            <>
              <CardHeader className="pb-3 flex-shrink-0">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Note title"
                  className="text-xl font-semibold border-0 px-0 focus-visible:ring-0"
                />
                <div className="flex flex-wrap gap-1 items-center mt-2">
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
                    placeholder="Add tag (Enter)..."
                    className="w-32 h-7 text-sm border-dashed"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pb-3">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Write your notes here..."
                  className="flex-1 min-h-[300px] resize-none"
                />
              </CardContent>
              <div className="px-6 py-3 border-t flex items-center gap-2 flex-shrink-0">
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
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Select a note or create a new one</p>
                <p className="text-sm mt-1">Use ⌘K to quickly access notes from anywhere</p>
              </div>
            </div>
          )}
        </Card>
      </div>

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
    </div>
  );
}
