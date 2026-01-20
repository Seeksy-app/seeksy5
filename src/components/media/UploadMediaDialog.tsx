import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, FileVideo, Music, Image as ImageIcon } from "lucide-react";
import * as tus from "tus-js-client";

interface UploadMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
  folderId?: string | null;
}

export function UploadMediaDialog({
  open,
  onOpenChange,
  onUploadComplete,
  folderId,
}: UploadMediaDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("video/")) {
      return <FileVideo className="h-5 w-5" />;
    }
    if (file.type.startsWith("audio/")) {
      return <Music className="h-5 w-5" />;
    }
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5" />;
    }
    return <FileVideo className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + " KB";
    }
    if (bytes < 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const totalFiles = selectedFiles.length;
    let uploaded = 0;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const user = session.user;

      for (const file of selectedFiles) {
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        
        // Use TUS for files larger than 6MB (Supabase standard upload limit)
        if (file.size > 6 * 1024 * 1024) {
          // Use resumable upload (TUS) for large files
          const projectId = "taxqcioheqdqtlmjeaht";
          
          await new Promise<void>((resolve, reject) => {
            const upload = new tus.Upload(file, {
              endpoint: `https://${projectId}.supabase.co/storage/v1/upload/resumable`,
              retryDelays: [0, 3000, 5000, 10000, 20000],
              headers: {
                authorization: `Bearer ${session.access_token}`,
                "x-upsert": "false",
              },
              uploadDataDuringCreation: true,
              removeFingerprintOnSuccess: true,
              metadata: {
                bucketName: "media-vault",
                objectName: filePath,
                contentType: file.type,
                cacheControl: "3600",
              },
              chunkSize: 6 * 1024 * 1024, // 6MB chunks
              onError: (error) => {
                console.error("TUS upload error:", error);
                reject(error);
              },
              onProgress: (bytesUploaded, bytesTotal) => {
                const fileProgress = (bytesUploaded / bytesTotal) * 100;
                setProgress(((uploaded + fileProgress / 100) / totalFiles) * 100);
              },
              onSuccess: () => {
                resolve();
              },
            });

            upload.findPreviousUploads().then((previousUploads) => {
              if (previousUploads.length) {
                upload.resumeFromPreviousUpload(previousUploads[0]);
              }
              upload.start();
            });
          });
        } else {
          // Use standard upload for smaller files
          const { error: uploadError } = await supabase.storage
            .from("media-vault")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) throw uploadError;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("media-vault").getPublicUrl(filePath);

        // Determine file type
        let fileType = 'other';
        if (file.type.startsWith('video/')) fileType = 'video';
        else if (file.type.startsWith('audio/')) fileType = 'audio';
        else if (file.type.startsWith('image/')) fileType = 'image';

        // Create media_files record
        const { error: insertError } = await supabase.from("media_files").insert({
          user_id: user.id,
          file_url: publicUrl,
          file_type: fileType,
          file_name: file.name,
          file_size_bytes: file.size,
          folder_id: folderId,
          source: "upload",
        });

        if (insertError) throw insertError;

        uploaded++;
        setProgress((uploaded / totalFiles) * 100);
      }

      toast.success(`Successfully uploaded ${totalFiles} file(s)`);
      onUploadComplete();
      setSelectedFiles([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription>
            Upload videos, audio, or images to your media library
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 hover:border-primary/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*,audio/*,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop files here or
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Choose Files
            </Button>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Uploading... {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedFiles([]);
              onOpenChange(false);
            }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
          >
            Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
