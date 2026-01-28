import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Video, Music, Upload, CheckCircle, X, FileVideo, FileAudio, Image as ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CreateAdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function CreateAdDialog({ open, onOpenChange, onSuccess }: CreateAdDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedAssetUrl, setUploadedAssetUrl] = useState<string | null>(null);
  const [uploadedAssetName, setUploadedAssetName] = useState<string | null>(null);
  const [uploadedThumbUrl, setUploadedThumbUrl] = useState<string | null>(null);
  const [uploadedThumbName, setUploadedThumbName] = useState<string | null>(null);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const assetInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'video' as 'video' | 'audio',
    asset_url: '',
    duration_seconds: '',
    thumbnail_url: '',
    click_url: '',
    notes: '',
    status: 'active'
  });

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'video',
      asset_url: '',
      duration_seconds: '',
      thumbnail_url: '',
      click_url: '',
      notes: '',
      status: 'active'
    });
    setUploadedAssetUrl(null);
    setUploadedAssetName(null);
    setUploadedThumbUrl(null);
    setUploadedThumbName(null);
    setUploadProgress(0);
    setShowAdvanced(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMediaDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const element = file.type.startsWith('video/') 
        ? document.createElement('video')
        : document.createElement('audio');
      
      element.preload = 'metadata';
      element.onloadedmetadata = () => {
        URL.revokeObjectURL(element.src);
        resolve(Math.round(element.duration));
      };
      element.onerror = () => {
        URL.revokeObjectURL(element.src);
        resolve(0);
      };
      element.src = URL.createObjectURL(file);
    });
  };

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isVideo = VIDEO_TYPES.includes(file.type);
    const isAudio = AUDIO_TYPES.includes(file.type);
    
    if (!isVideo && !isAudio) {
      toast.error('Please upload a video (mp4, mov, webm) or audio (mp3, wav, m4a) file');
      return;
    }

    // Auto-set type based on file
    setFormData(prev => ({ ...prev, type: isVideo ? 'video' : 'audio' }));

    setUploading(true);
    setUploadProgress(0);

    try {
      // Get duration from media
      const duration = await getMediaDuration(file);
      if (duration > 0) {
        setFormData(prev => ({ ...prev, duration_seconds: String(duration) }));
      }

      // Generate unique filename
      const ext = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;
      
      // Simulate progress (Supabase storage doesn't provide progress events easily)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.storage
        .from('seeksy-tv-ads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('seeksy-tv-ads')
        .getPublicUrl(fileName);

      setUploadProgress(100);
      setUploadedAssetUrl(urlData.publicUrl);
      setUploadedAssetName(`${file.name} (${formatFileSize(file.size)})`);
      
      toast.success('Asset uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload asset');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error('Please upload an image (jpg, png, webp)');
      return;
    }

    setThumbUploading(true);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;

      const { data, error } = await supabase.storage
        .from('seeksy-tv-ad-thumbs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('seeksy-tv-ad-thumbs')
        .getPublicUrl(fileName);

      setUploadedThumbUrl(urlData.publicUrl);
      setUploadedThumbName(`${file.name} (${formatFileSize(file.size)})`);
      
      toast.success('Thumbnail uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload thumbnail');
    } finally {
      setThumbUploading(false);
    }
  };

  const clearAsset = () => {
    setUploadedAssetUrl(null);
    setUploadedAssetName(null);
    setUploadProgress(0);
    setFormData(prev => ({ ...prev, duration_seconds: '' }));
    if (assetInputRef.current) assetInputRef.current.value = '';
  };

  const clearThumb = () => {
    setUploadedThumbUrl(null);
    setUploadedThumbName(null);
    if (thumbInputRef.current) thumbInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalAssetUrl = uploadedAssetUrl || formData.asset_url;
    
    if (!formData.title || !finalAssetUrl || !formData.duration_seconds) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate type matches asset if uploaded
    if (uploadedAssetUrl) {
      const ext = uploadedAssetUrl.split('.').pop()?.toLowerCase();
      const isVideoExt = ['mp4', 'mov', 'webm'].includes(ext || '');
      const isAudioExt = ['mp3', 'wav', 'm4a'].includes(ext || '');
      
      if (formData.type === 'video' && !isVideoExt) {
        toast.error('Type must match uploaded file. Please select Audio.');
        return;
      }
      if (formData.type === 'audio' && !isAudioExt) {
        toast.error('Type must match uploaded file. Please select Video.');
        return;
      }
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const result = await (supabase as any)
        .from('seeksy_tv_ads')
        .insert({
          title: formData.title,
          type: formData.type,
          asset_url: finalAssetUrl,
          duration_seconds: parseInt(formData.duration_seconds),
          thumbnail_url: uploadedThumbUrl || formData.thumbnail_url || null,
          click_url: formData.click_url || null,
          notes: formData.notes || null,
          status: formData.status,
          created_by: user?.id
        });

      if (result.error) throw result.error;

      toast.success('Ad created successfully');
      resetForm();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create ad');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = formData.title && 
    (uploadedAssetUrl || formData.asset_url) && 
    formData.duration_seconds && 
    !uploading;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Ad
          </DialogTitle>
          <DialogDescription>
            Upload a video or audio ad to your inventory
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Summer Sale 30s"
            />
          </div>

          {/* Asset Upload */}
          <div className="space-y-2">
            <Label>Upload Asset *</Label>
            <input
              ref={assetInputRef}
              type="file"
              accept=".mp4,.mov,.webm,.mp3,.wav,.m4a"
              onChange={handleAssetUpload}
              className="hidden"
            />
            
            {!uploadedAssetUrl ? (
              <div 
                onClick={() => !uploading && assetInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  uploading ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                {uploading ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Uploading...</div>
                    <Progress value={uploadProgress} className="h-2" />
                    <div className="text-xs text-muted-foreground">{uploadProgress}%</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-center gap-2">
                      <FileVideo className="h-8 w-8 text-muted-foreground" />
                      <FileAudio className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">MP4, MOV, WebM, MP3, WAV, M4A</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadedAssetName}</p>
                  <p className="text-xs text-green-600">Upload complete</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={clearAsset}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Type and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'video' | 'audio') => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video
                    </div>
                  </SelectItem>
                  <SelectItem value="audio">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      Audio
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_seconds}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_seconds: e.target.value }))}
                placeholder="30"
                min="1"
              />
              {uploadedAssetUrl && formData.duration_seconds && (
                <p className="text-xs text-muted-foreground">Auto-detected from file</p>
              )}
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label>Thumbnail (optional)</Label>
            <input
              ref={thumbInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleThumbUpload}
              className="hidden"
            />
            
            {!uploadedThumbUrl ? (
              <div 
                onClick={() => !thumbUploading && thumbInputRef.current?.click()}
                className={`border border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  thumbUploading ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'
                }`}
              >
                {thumbUploading ? (
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload thumbnail</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <img src={uploadedThumbUrl} alt="Thumbnail" className="w-16 h-10 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{uploadedThumbName}</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={clearThumb}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Click-through URL */}
          <div className="space-y-2">
            <Label htmlFor="click_url">Click-through URL</Label>
            <Input
              id="click_url"
              value={formData.click_url}
              onChange={(e) => setFormData(prev => ({ ...prev, click_url: e.target.value }))}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">Where users go when they click the ad</p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Internal notes about this ad..."
              rows={2}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced: Paste URL */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground">
                {showAdvanced ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                Advanced: Paste URL instead
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              <Label htmlFor="asset_url">Asset URL</Label>
              <Input
                id="asset_url"
                value={formData.asset_url}
                onChange={(e) => setFormData(prev => ({ ...prev, asset_url: e.target.value }))}
                placeholder="https://..."
                disabled={!!uploadedAssetUrl}
              />
              <p className="text-xs text-muted-foreground">
                {uploadedAssetUrl ? 'Clear uploaded asset to use URL instead' : 'Direct URL to the video or audio file'}
              </p>
              
              <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
              <Input
                id="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                placeholder="https://..."
                disabled={!!uploadedThumbUrl}
              />
            </CollapsibleContent>
          </Collapsible>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Creating...' : 'Create Ad'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
