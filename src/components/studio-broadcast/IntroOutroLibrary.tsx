import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudioIntroOutroPanel } from "@/components/studio/StudioIntroOutroPanel";
import { Play, Trash2, Download, FileAudio, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface IntroOutroLibraryProps {
  sessionId: string;
  onSelect: (item: any) => void;
}

export function IntroOutroLibrary({ sessionId, onSelect }: IntroOutroLibraryProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<'intro' | 'outro'>('intro');

  // Don't fetch if no sessionId
  if (!sessionId) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <FileAudio className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Session not initialized</p>
            <p className="text-xs mt-1">Please start a broadcast session first</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fetch intro/outro library items
  const { data: libraryItems, isLoading, refetch } = useQuery({
    queryKey: ['intro-outro-library', sessionId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('studio_intro_outro_library')
        .select(`
          *,
          media_file:media_files(id, file_name, duration_seconds)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const intros = libraryItems?.filter(item => item.type === 'intro') || [];
  const outros = libraryItems?.filter(item => item.type === 'outro') || [];

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('studio_intro_outro_library')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Deleted successfully");
      refetch();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error("Failed to delete");
    }
  };

  const handleSelect = (item: any) => {
    onSelect(item);
    toast.success(`${item.type === 'intro' ? 'Intro' : 'Outro'} selected`);
  };

  const renderLibraryItems = (items: any[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <FileAudio className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No items in library</p>
          <p className="text-xs mt-1">Create your first branded {createType}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <Card 
            key={item.id}
            className="p-4 hover:bg-accent/50 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-sm truncate">{item.title || 'Untitled'}</h4>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {item.is_ai_generated ? 'AI' : 'Branded'}
                  </Badge>
                </div>
                
                {item.audio_url && (
                  <audio controls className="w-full h-8 mb-2">
                    <source src={item.audio_url} type="audio/mpeg" />
                  </audio>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                  {item.media_file && (
                    <span className="flex items-center gap-1">
                      <FileAudio className="h-3 w-3" />
                      Linked to recording
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSelect(item)}
                  className="h-8 w-8 p-0"
                >
                  <Play className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(item.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
  };

  const handleSuccessfulCreate = () => {
    refetch();
    setShowCreateDialog(false);
  };

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Intro/Outro Library</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Manage your branded intros and outros
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setCreateType('intro');
                setShowCreateDialog(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading library...
            </div>
          ) : (
            <Tabs defaultValue="intros" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="intros">
                  Intros ({intros.length})
                </TabsTrigger>
                <TabsTrigger value="outros">
                  Outros ({outros.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="intros" className="mt-4">
                <ScrollArea className="h-[300px] pr-4">
                  {renderLibraryItems(intros)}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="outros" className="mt-4">
                <ScrollArea className="h-[300px] pr-4">
                  {renderLibraryItems(outros)}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      {showCreateDialog && (
        <Dialog open={showCreateDialog} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create {createType === 'intro' ? 'Intro' : 'Outro'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <Tabs value={createType} onValueChange={(v) => setCreateType(v as 'intro' | 'outro')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="intro">Intro</TabsTrigger>
                  <TabsTrigger value="outro">Outro</TabsTrigger>
                </TabsList>

                <TabsContent value="intro" className="mt-4">
                  {createType === 'intro' && (
                    <StudioIntroOutroPanel 
                      type="intro" 
                      sessionId={sessionId}
                      onSuccess={handleSuccessfulCreate}
                    />
                  )}
                </TabsContent>

                <TabsContent value="outro" className="mt-4">
                  {createType === 'outro' && (
                    <StudioIntroOutroPanel 
                      type="outro" 
                      sessionId={sessionId}
                      onSuccess={handleSuccessfulCreate}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}