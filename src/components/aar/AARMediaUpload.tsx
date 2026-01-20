import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Upload, Grid, List, Trash2, Image, Video, FileAudio, File, 
  X, Edit, Check, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { AARMedia } from '@/types/aar';
import { supabase } from '@/integrations/supabase/client';

interface AARMediaUploadProps {
  aarId: string;
  media: AARMedia[];
  onUpload: (file: File, section?: string) => Promise<any>;
  onDelete: (mediaId: string) => Promise<void>;
}

const PLATFORM_INTENTS = ['Web', 'LinkedIn', 'Press', 'Client PDF'];

export function AARMediaUpload({ aarId, media, onUpload, onDelete }: AARMediaUploadProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [editingMedia, setEditingMedia] = useState<AARMedia | null>(null);
  const [editForm, setEditForm] = useState({ caption: '', alt_text: '', platform_intent: [] as string[] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await uploadFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadFiles = async (files: File[]) => {
    if (!aarId) {
      toast.error('Please save the AAR first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await onUpload(file);
        setUploadProgress(((i + 1) / files.length) * 100);
      } catch (err) {
        console.error('Upload error:', err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    setUploadProgress(0);
  };

  const handleEditSave = async () => {
    if (!editingMedia) return;

    try {
      const { error } = await supabase
        .from('aar_media')
        .update({
          caption: editForm.caption,
          alt_text: editForm.alt_text,
          platform_intent: editForm.platform_intent,
        })
        .eq('id', editingMedia.id);

      if (error) throw error;
      toast.success('Media updated');
      setEditingMedia(null);
      // Refresh would happen through parent state
    } catch (err) {
      console.error('Error updating media:', err);
      toast.error('Failed to update');
    }
  };

  const openEdit = (item: AARMedia) => {
    setEditingMedia(item);
    setEditForm({
      caption: item.caption || '',
      alt_text: item.alt_text || '',
      platform_intent: item.platform_intent || [],
    });
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return FileAudio;
      default: return File;
    }
  };

  const togglePlatformIntent = (platform: string) => {
    setEditForm(prev => ({
      ...prev,
      platform_intent: prev.platform_intent.includes(platform)
        ? prev.platform_intent.filter(p => p !== platform)
        : [...prev.platform_intent, platform]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-1">Drag & drop files here</h3>
        <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Select Files'}
        </Button>

        {uploading && (
          <div className="mt-4 max-w-xs mx-auto">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{Math.round(uploadProgress)}% complete</p>
          </div>
        )}
      </div>

      {/* View Toggle */}
      {media.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{media.length} file{media.length !== 1 ? 's' : ''}</p>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Media Grid/List */}
      {media.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No media uploaded yet</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {media.map((item) => {
            const Icon = getMediaIcon(item.media_type);
            return (
              <Card key={item.id} className="overflow-hidden group relative">
                {item.media_type === 'image' ? (
                  <div className="aspect-video bg-muted">
                    <img src={item.storage_path} alt={item.alt_text || ''} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <Icon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">{item.file_name || 'Untitled'}</p>
                  {item.caption && <p className="text-xs text-muted-foreground truncate">{item.caption}</p>}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {item.platform_intent?.map(p => (
                      <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                </CardContent>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => openEdit(item)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => onDelete(item.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {media.map((item) => {
            const Icon = getMediaIcon(item.media_type);
            return (
              <Card key={item.id} className="flex items-center p-3 gap-4">
                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center shrink-0">
                  {item.media_type === 'image' ? (
                    <img src={item.storage_path} alt="" className="h-full w-full object-cover rounded" />
                  ) : (
                    <Icon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.file_name || 'Untitled'}</p>
                  <p className="text-sm text-muted-foreground truncate">{item.caption || 'No caption'}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingMedia} onOpenChange={() => setEditingMedia(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Caption</Label>
              <Textarea 
                value={editForm.caption} 
                onChange={e => setEditForm(f => ({ ...f, caption: e.target.value }))}
                placeholder="Describe this media..."
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Alt Text (Accessibility)</Label>
              <Input 
                value={editForm.alt_text} 
                onChange={e => setEditForm(f => ({ ...f, alt_text: e.target.value }))}
                placeholder="Brief description for screen readers"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Platform Intent</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PLATFORM_INTENTS.map(platform => (
                  <Badge
                    key={platform}
                    variant={editForm.platform_intent.includes(platform) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => togglePlatformIntent(platform)}
                  >
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingMedia(null)}>Cancel</Button>
              <Button onClick={handleEditSave}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
