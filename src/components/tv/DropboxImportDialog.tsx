import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Folder, Film, ChevronRight, ArrowLeft, Upload, Check, CloudDownload } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DropboxFile {
  '.tag': 'file' | 'folder';
  id: string;
  name: string;
  path_display: string;
  path_lower: string;
  size?: number;
}

interface DropboxImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export function DropboxImportDialog({ open, onOpenChange, onImportComplete }: DropboxImportDialogProps) {
  const [step, setStep] = useState<'connect' | 'browse' | 'import'>('connect');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<DropboxFile[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<DropboxFile[]>([]);
  const [seriesName, setSeriesName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      checkConnection();
    }
  }, [open]);

  const checkConnection = async () => {
    try {
      const { data } = await (supabase
        .from('social_media_profiles') as any)
        .select('id')
        .eq('platform', 'dropbox')
        .single();
      
      if (data) {
        setIsConnected(true);
        setStep('browse');
        loadFiles('');
      }
    } catch (error) {
      setIsConnected(false);
    }
  };

  const connectDropbox = async () => {
    setIsLoading(true);
    try {
      const redirectUri = `${window.location.origin}/dropbox/callback`;
      
      const { data, error } = await supabase.functions.invoke('dropbox-auth', {
        body: { action: 'get_auth_url', redirectUri }
      });

      if (error) throw error;

      // Store redirect info and open popup
      localStorage.setItem('dropbox_redirect', window.location.pathname);
      window.open(data.authUrl, 'dropbox-auth', 'width=600,height=700');

      // Listen for callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'dropbox-callback' && event.data?.code) {
          window.removeEventListener('message', handleMessage);
          
          const { error: exchangeError } = await supabase.functions.invoke('dropbox-auth', {
            body: { action: 'exchange_code', code: event.data.code, redirectUri }
          });

          if (exchangeError) {
            toast({ title: 'Connection failed', variant: 'destructive' });
          } else {
            toast({ title: 'Dropbox connected successfully!' });
            setIsConnected(true);
            setStep('browse');
            loadFiles('');
          }
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('Dropbox connect error:', error);
      toast({ title: 'Failed to connect Dropbox', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFiles = async (path: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('dropbox-list-files', {
        body: { path }
      });

      if (error) throw error;
      setFiles(data.files || []);
      setCurrentPath(path);
    } catch (error) {
      console.error('Failed to load files:', error);
      toast({ title: 'Failed to load files', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToFolder = (folder: DropboxFile) => {
    setPathHistory([...pathHistory, currentPath]);
    loadFiles(folder.path_display);
  };

  const navigateBack = () => {
    const previousPath = pathHistory.pop() || '';
    setPathHistory([...pathHistory]);
    loadFiles(previousPath);
  };

  const toggleFileSelection = (file: DropboxFile) => {
    if (selectedFiles.some(f => f.id === file.id)) {
      setSelectedFiles(selectedFiles.filter(f => f.id !== file.id));
    } else {
      setSelectedFiles([...selectedFiles, file]);
    }
  };

  const selectAllVideos = () => {
    const videos = files.filter(f => f['.tag'] === 'file');
    setSelectedFiles(videos);
  };

  const startImport = async () => {
    if (selectedFiles.length === 0) {
      toast({ title: 'Please select files to import', variant: 'destructive' });
      return;
    }

    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('dropbox-import-videos', {
        body: { files: selectedFiles, seriesName: seriesName || 'Imported Videos' }
      });

      if (error) throw error;

      toast({
        title: 'Import started!',
        description: `Importing ${selectedFiles.length} videos. This may take a few minutes.`
      });

      onOpenChange(false);
      onImportComplete?.();
    } catch (error) {
      console.error('Import error:', error);
      toast({ title: 'Failed to start import', variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudDownload className="h-5 w-5 text-blue-500" />
            Import from Dropbox
          </DialogTitle>
        </DialogHeader>

        {step === 'connect' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/10 rounded-full flex items-center justify-center">
              <CloudDownload className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Connect Your Dropbox</h3>
            <p className="text-muted-foreground mb-6">
              Connect your Dropbox account to import videos directly to Seeksy TV
            </p>
            <Button onClick={connectDropbox} disabled={isLoading} className="gap-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />}
              Connect Dropbox
            </Button>
          </div>
        )}

        {step === 'browse' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentPath && (
                  <Button variant="ghost" size="sm" onClick={navigateBack}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <span className="text-sm text-muted-foreground">
                  {currentPath || 'Dropbox Root'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAllVideos}>
                  Select All Videos
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedFiles.length} selected
                </span>
              </div>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : files.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No video files found in this folder
                </div>
              ) : (
                <div className="divide-y">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => file['.tag'] === 'folder' ? navigateToFolder(file) : toggleFileSelection(file)}
                    >
                      {file['.tag'] === 'folder' ? (
                        <Folder className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Checkbox
                          checked={selectedFiles.some(f => f.id === file.id)}
                          className="mr-1"
                        />
                      )}
                      {file['.tag'] === 'file' && <Film className="h-5 w-5 text-purple-500" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        {file.size && (
                          <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                        )}
                      </div>
                      {file['.tag'] === 'folder' && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      {selectedFiles.some(f => f.id === file.id) && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {selectedFiles.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="seriesName">Series Name</Label>
                  <Input
                    id="seriesName"
                    placeholder="e.g., American Warrior"
                    value={seriesName}
                    onChange={(e) => setSeriesName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Videos will be organized under this series on Seeksy TV
                  </p>
                </div>
                <Button onClick={startImport} disabled={isImporting} className="w-full gap-2">
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Import {selectedFiles.length} Video{selectedFiles.length !== 1 ? 's' : ''}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
