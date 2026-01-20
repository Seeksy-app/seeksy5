import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Video, X, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import * as tus from 'tus-js-client';

interface VideoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: () => void;
}

export function VideoUploadDialog({ open, onOpenChange, onUploadComplete }: VideoUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [seriesName, setSeriesName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<tus.Upload | null>(null);
  const uploadStartTime = useRef<number>(0);
  const lastProgressUpdate = useRef<{ time: number; bytes: number }>({ time: 0, bytes: 0 });
  const { toast } = useToast();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return 'calculating...';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('video/')) {
        toast({ title: 'Please select a video file', variant: 'destructive' });
        return;
      }
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: 'Please select a video file', variant: 'destructive' });
      return;
    }

    if (!title.trim()) {
      toast({ title: 'Please enter a title', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    uploadStartTime.current = Date.now();
    lastProgressUpdate.current = { time: Date.now(), bytes: 0 };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const user = session.user;
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = `tv-videos/${user.id}/${fileName}`;
      const bucketName = 'studio-recordings';
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

      // Use TUS resumable upload for large files
      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: `https://${projectId}.supabase.co/storage/v1/upload/resumable`,
          retryDelays: [0, 1000, 3000, 5000, 10000],
          chunkSize: 6 * 1024 * 1024, // 6MB chunks
          headers: {
            authorization: `Bearer ${session.access_token}`,
            'x-upsert': 'false',
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: bucketName,
            objectName: filePath,
            contentType: file.type,
            cacheControl: '3600',
          },
          onError: (error) => {
            console.error('TUS upload error:', error);
            reject(error);
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const now = Date.now();
            const progress = Math.round((bytesUploaded / bytesTotal) * 100);
            setUploadProgress(progress);

            // Calculate speed and ETA
            const timeDiff = (now - lastProgressUpdate.current.time) / 1000;
            if (timeDiff > 0.5) {
              const bytesDiff = bytesUploaded - lastProgressUpdate.current.bytes;
              const speed = bytesDiff / timeDiff;
              const remaining = bytesTotal - bytesUploaded;
              const eta = remaining / speed;

              setUploadSpeed(`${formatBytes(speed)}/s`);
              setTimeRemaining(formatTime(eta));
              lastProgressUpdate.current = { time: now, bytes: bytesUploaded };
            }
          },
          onSuccess: () => {
            console.log('TUS upload complete');
            resolve();
          },
        });

        uploadRef.current = upload;
        upload.findPreviousUploads().then((previousUploads) => {
          if (previousUploads.length) {
            upload.resumeFromPreviousUpload(previousUploads[0]);
          }
          upload.start();
        });
      });

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      // Create tv_content record
      const { error: dbError } = await supabase
        .from('tv_content')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          video_url: publicUrl,
          series_name: seriesName.trim() || null,
          is_published: false,
          user_id: user.id,
          content_type: 'video'
        });

      if (dbError) throw dbError;

      setUploadProgress(100);

      toast({ title: 'Video uploaded successfully!' });
      
      // Reset form
      setFile(null);
      setTitle("");
      setDescription("");
      setSeriesName("");
      setUploadProgress(0);
      setUploadSpeed("");
      setTimeRemaining("");
      
      onOpenChange(false);
      onUploadComplete?.();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ 
        title: 'Upload failed', 
        description: error.message || 'Could not upload video',
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
      uploadRef.current = null;
    }
  };

  const handleCancel = () => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      uploadRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
    setUploadSpeed("");
    setTimeRemaining("");
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isLargeFile = file && file.size > 500 * 1024 * 1024; // > 500MB

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isUploading) onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Video
          </DialogTitle>
          <DialogDescription>
            Upload a video to your Seeksy TV library
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label>Video File</Label>
            {file ? (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Video className="h-8 w-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={clearFile} disabled={isUploading}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Video className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to select a video</p>
                <p className="text-xs text-muted-foreground mt-1">MP4, MOV, WebM supported</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Large file warning */}
          {isLargeFile && !isUploading && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-700">
                <p className="font-medium">Large file detected ({(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB)</p>
                <p>Upload may take a while. The upload is resumable if interrupted.</p>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
            />
          </div>

          {/* Series Name */}
          <div className="space-y-2">
            <Label htmlFor="series">Series Name (optional)</Label>
            <Input
              id="series"
              placeholder="e.g., American Warrior"
              value={seriesName}
              onChange={(e) => setSeriesName(e.target.value)}
              disabled={isUploading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter video description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isUploading}
            />
          </div>

          {/* Progress */}
          {isUploading && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{uploadProgress}%</span>
                {uploadSpeed && <span>{uploadSpeed}</span>}
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Uploading...</span>
                {timeRemaining && <span>~{timeRemaining} remaining</span>}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={isUploading ? handleCancel : () => onOpenChange(false)}
            >
              {isUploading ? 'Cancel Upload' : 'Cancel'}
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || !file}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Video
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
