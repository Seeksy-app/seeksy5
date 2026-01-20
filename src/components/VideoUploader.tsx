import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Check, AlertCircle, Video, FileAudio } from "lucide-react";
import { cn } from "@/lib/utils";
import * as tus from "tus-js-client";

interface VideoUploaderProps {
  onUploadComplete?: () => void;
  acceptVideo?: boolean;
  acceptAudio?: boolean;
}

export default function VideoUploader({ 
  onUploadComplete,
  acceptVideo = true,
  acceptAudio = true 
}: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadStartTime = useRef<number>(0);
  const { toast } = useToast();

  const acceptedTypes = [
    ...(acceptVideo ? ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'] : []),
    ...(acceptAudio ? ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-m4a'] : [])
  ].join(',');

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatBytes(bytesPerSecond)}/s`;
  };

  const extractDuration = (file: File): Promise<number | null> => {
    return new Promise((resolve) => {
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      
      if (!isVideo && !isAudio) {
        resolve(null);
        return;
      }

      const element = isVideo 
        ? document.createElement('video')
        : document.createElement('audio');
      
      element.preload = 'metadata';
      
      element.onloadedmetadata = () => {
        window.URL.revokeObjectURL(element.src);
        resolve(element.duration);
      };
      
      element.onerror = () => {
        window.URL.revokeObjectURL(element.src);
        resolve(null);
      };
      
      element.src = URL.createObjectURL(file);
    });
  };

  const validateFile = (file: File): boolean => {
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    
    if (!isVideo && !isAudio) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video or audio file",
        variant: "destructive",
      });
      return false;
    }

    if (!acceptVideo && isVideo) {
      toast({
        title: "Video not accepted",
        description: "Only audio files are accepted",
        variant: "destructive",
      });
      return false;
    }

    if (!acceptAudio && isAudio) {
      toast({
        title: "Audio not accepted",
        description: "Only video files are accepted",
        variant: "destructive",
      });
      return false;
    }

    // 5GB limit
    const maxSizeBytes = 5 * 1024 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        title: "File too large",
        description: `Maximum file size is 5GB. Your file is ${formatBytes(file.size)}`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const uploadViaEdgeFunction = async (file: File, session: any) => {
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Upload using XMLHttpRequest to track progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentage = (e.loaded / e.total) * 90;
          const elapsed = (Date.now() - uploadStartTime.current) / 1000;
          const speed = e.loaded / elapsed;
          
          setUploadProgress(percentage);
          setUploadSpeed(speed);
          console.log(`Upload progress: ${Math.round(percentage)}%`);
        }
      });

      xhr.addEventListener('load', () => {
        console.log('XHR Load - Status:', xhr.status, 'Response:', xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              setUploadProgress(100);
              resolve(response);
            } else {
              console.error('Upload failed:', response.error);
              reject(new Error(response.error || 'Upload failed'));
            }
          } catch (e) {
            console.error('Failed to parse response:', e, xhr.responseText);
            reject(new Error('Invalid response from server'));
          }
        } else {
          console.error('Upload failed with status:', xhr.status, xhr.statusText, xhr.responseText);
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', (e) => {
        console.error('XHR Error event:', e, 'Status:', xhr.status, 'ReadyState:', xhr.readyState);
        reject(new Error('Network error during upload - check console for details'));
      });
      xhr.addEventListener('abort', () => {
        console.error('XHR Abort event');
        reject(new Error('Upload cancelled'));
      });
      xhr.addEventListener('timeout', () => {
        console.error('XHR Timeout event');
        reject(new Error('Upload timed out'));
      });

      // Set longer timeout for large files (30 minutes)
      xhr.timeout = 1800000;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/upload-large-media`;
      
      console.log('Starting XHR upload to:', functionUrl);
      console.log('File size:', file.size, 'bytes');
      
      xhr.open('POST', functionUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
      xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
      
      console.log('Sending XHR request...');
      xhr.send(formData);
    });
  };

  const uploadSmallFile = async (file: File, session: any) => {
    console.log('📤 uploadSmallFile started');
    const timestamp = Date.now();
    // Sanitize filename: remove special chars, replace spaces with hyphens
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').replace(/--+/g, '-');
    const fileName = `${session.user.id}/${timestamp}-${sanitizedName}`;

    console.log('📝 Upload config:', {
      fileName,
      fileSize: file.size,
      fileType: file.type,
      bucket: 'episode-files'
    });

    // Simulate progress updates since Supabase SDK doesn't provide native progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        const elapsed = (Date.now() - uploadStartTime.current) / 1000;
        const estimatedSpeed = file.size / 10;
        const newProgress = Math.min(90, (elapsed / 10) * 100);
        setUploadSpeed(estimatedSpeed);
        return newProgress;
      });
    }, 500);

    // Upload to Supabase Storage
    console.log('Starting storage upload...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('episode-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    clearInterval(progressInterval);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('Upload successful:', uploadData);

    console.log('File uploaded to storage, creating database record...');
    setUploadProgress(95);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('episode-files')
      .getPublicUrl(fileName);

    // Extract duration
    const duration = await extractDuration(file);
    const durationInt = duration ? Math.floor(Number(duration)) : null;
    console.log('📊 Duration extracted:', { raw: duration, rounded: durationInt });

    // Create media file record
    const { error: dbError } = await supabase
      .from('media_files')
      .insert({
        user_id: session.user.id,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type.startsWith('video') ? 'video' : 'audio',
        file_size_bytes: file.size,
        duration_seconds: durationInt,
        source: 'upload',
      });

    if (dbError) throw dbError;
  };

  const uploadLargeFile = async (file: File, session: any) => {
    console.log('📦 uploadLargeFile started');
    // Sanitize filename: remove special chars, replace spaces with hyphens
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').replace(/--+/g, '-');
    const objectName = `${session.user.id}/${Date.now()}-${sanitizedName}`;
    
    console.log('🔄 Starting large file resumable upload:', {
      fileName: file.name,
      sanitizedName,
      fileSize: formatBytes(file.size),
      fileSizeBytes: file.size,
      objectName,
      endpoint: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/upload/resumable`
    });
    
    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/upload/resumable`,
        retryDelays: [0, 1000, 3000, 5000, 10000, 20000, 30000, 60000, 120000], // Aggressive retry with up to 2min delays
        headers: {
          authorization: `Bearer ${session.access_token}`,
          'x-upsert': 'false',
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: 'episode-files',
          objectName: objectName,
          contentType: file.type,
          cacheControl: '3600',
        },
        chunkSize: 100 * 1024 * 1024, // 100MB chunks for better performance with very large files
        parallelUploads: 1, // Sequential uploads for better reliability
        storeFingerprintForResuming: true, // Enable resume capability
        onError: (error) => {
          const errorDetails: any = {
            error,
            message: error.message,
            fileName: file.name,
            fileSize: file.size,
            uploadUrl: upload.url || 'none'
          };
          
          // Add TUS-specific error details if available
          if ('originalRequest' in error) {
            errorDetails.originalRequest = (error as any).originalRequest;
          }
          if ('originalResponse' in error) {
            const response = (error as any).originalResponse;
            errorDetails.originalResponse = {
              status: response?.getStatus(),
              body: response?.getBody(),
              headers: response?.getHeader ? {
                contentType: response.getHeader('content-type'),
                contentLength: response.getHeader('content-length')
              } : undefined
            };
          }
          
          console.error('TUS upload error details:', errorDetails);
          
          // Check if this is a final error (retries exhausted) or just a temporary error
          const isFinalError = error.message.toLowerCase().includes('aborted') || 
                              error.message.toLowerCase().includes('quota') ||
                              error.message.toLowerCase().includes('forbidden') ||
                              !upload.url; // No upload URL means we couldn't even start
          
          if (isFinalError) {
            let errorMessage = 'Upload failed: ';
            if (error.message.includes('quota') || error.message.includes('storage')) {
              errorMessage += 'Storage quota exceeded. Please free up space or contact support.';
            } else if (error.message.includes('forbidden') || error.message.includes('401') || error.message.includes('403')) {
              errorMessage += 'Permission denied. Please check your authentication.';
            } else {
              errorMessage += error.message || 'Unknown error occurred. Please try again.';
            }
            reject(new Error(errorMessage));
          } else {
            // Let tus retry for network errors
            console.log('TUS will retry this error automatically...');
          }
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = (bytesUploaded / bytesTotal) * 90; // Reserve 10% for DB work
          const elapsed = (Date.now() - uploadStartTime.current) / 1000;
          const speed = bytesUploaded / elapsed;
          const remaining = (bytesTotal - bytesUploaded) / speed;
          
          console.log(`Upload progress: ${Math.round(percentage)}% (${formatBytes(bytesUploaded)}/${formatBytes(bytesTotal)}) at ${formatSpeed(speed)} - ${Math.round(remaining)}s remaining`);
          
          setUploadProgress(percentage);
          setUploadSpeed(speed);
        },
        onSuccess: async () => {
          console.log('TUS upload complete, creating database record...');
          setUploadProgress(95);

          try {
            const { data: { publicUrl } } = supabase.storage
              .from('episode-files')
              .getPublicUrl(objectName);

            console.log('Creating media_files record with publicUrl:', publicUrl);

            // Extract duration
            const duration = await extractDuration(file);
            const durationInt = duration ? Math.floor(Number(duration)) : null;
            console.log('📊 Duration extracted:', { raw: duration, rounded: durationInt });

            const { error: dbError } = await supabase
              .from('media_files')
              .insert({
                user_id: session.user.id,
                file_name: file.name,
                file_url: publicUrl,
                file_type: file.type.startsWith('video') ? 'video' : 'audio',
                file_size_bytes: file.size,
                duration_seconds: durationInt,
                source: 'upload',
              });

            if (dbError) {
              console.error('Database insert error:', dbError);
              throw dbError;
            }
            
            console.log('Upload completed successfully!');
            resolve(true);
          } catch (error) {
            console.error('Error in onSuccess handler:', error);
            reject(error);
          }
        },
      });

      console.log('Checking for previous uploads to resume...');
      upload.findPreviousUploads().then((previousUploads) => {
        if (previousUploads.length) {
          console.log(`Found ${previousUploads.length} previous upload(s), resuming from last one...`);
          upload.resumeFromPreviousUpload(previousUploads[0]);
        } else {
          console.log('No previous uploads found, starting fresh...');
        }
        upload.start();
      }).catch((error) => {
        console.error('Error finding previous uploads:', error);
        console.log('Starting upload anyway...');
        upload.start();
      });
    });
  };

  const uploadFile = async (file: File) => {
    console.log('🎬 uploadFile called with:', { name: file.name, size: file.size, type: file.type });
    
    if (!validateFile(file)) {
      console.error('❌ File validation failed');
      return;
    }

    console.log('✅ File validation passed');
    setCurrentFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadSpeed(0);
    setUploadStatus('uploading');
    uploadStartTime.current = Date.now();

    // Set a timeout for the upload (30 minutes for large files)
    const uploadTimeout = setTimeout(() => {
      setUploadStatus('error');
      setIsUploading(false);
      toast({
        title: "Upload timed out",
        description: "The upload took too long. Please try again with a stable connection.",
        variant: "destructive",
      });
    }, 30 * 60 * 1000); // 30 minutes

    try {
      console.log('🔐 Getting auth session...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No session found');
        throw new Error('Not authenticated');
      }
      console.log('✅ Session valid, user ID:', session.user.id);

      const fileSizeMB = file.size / (1024 * 1024);
      console.log(`📊 File stats: ${file.name} (${formatBytes(file.size)} = ${fileSizeMB.toFixed(2)} MB)`);

      // Use resumable uploads for files larger than 50MB for better reliability
      if (fileSizeMB > 50) {
        console.log('🔄 Using resumable upload for large file...');
        await uploadLargeFile(file, session);
      } else {
        console.log('⚡ Using standard upload for small file...');
        await uploadSmallFile(file, session);
      }

      clearTimeout(uploadTimeout);
      console.log('Upload complete!');
      setUploadProgress(100);
      setUploadStatus('success');
      toast({
        title: "Upload complete!",
        description: `${file.name} uploaded successfully`,
      });

      setTimeout(() => {
        setCurrentFile(null);
        setUploadStatus('idle');
        setUploadProgress(0);
        setIsUploading(false);
        onUploadComplete?.();
      }, 2000);

    } catch (error) {
      clearTimeout(uploadTimeout);
      console.error("❌ UPLOAD ERROR CAUGHT:", error);
      console.error("Error name:", error instanceof Error ? error.name : typeof error);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack');
      console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      setUploadStatus('error');
      setIsUploading(false);
      
      const errorMsg = error instanceof Error ? error.message : "Failed to upload file";
      const errorType = errorMsg.includes('Network') || errorMsg.includes('network') ? 'network_error' : 
                       errorMsg.includes('timeout') ? 'timeout_error' :
                       errorMsg.includes('storage') || errorMsg.includes('quota') ? 'storage_error' :
                       errorMsg.includes('Database') ? 'database_error' : 'unknown_error';
      
      console.error("Classified error type:", errorType);
      console.error("Error message for user:", errorMsg);
      
      // Send failure alert to admins
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.functions.invoke('send-upload-failure-alert', {
            body: {
              userId: session.user.id,
              userEmail: session.user.email || 'unknown@email.com',
              userName: session.user.user_metadata?.full_name || session.user.email || 'Unknown User',
              fileName: file.name,
              fileSize: file.size,
              errorMessage: errorMsg,
              errorType: errorType,
              uploadProgress: Math.round(uploadProgress),
              userAgent: navigator.userAgent,
            },
          });
        }
      } catch (alertError) {
        console.error('Failed to send upload failure alert:', alertError);
      }
      
      toast({
        title: "Upload failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleCancel = () => {
    setCurrentFile(null);
    setIsUploading(false);
    setUploadStatus('idle');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
            isDragging && "border-primary bg-primary/5 scale-[1.02]",
            !isDragging && !isUploading && "border-border/50 hover:border-primary hover:bg-card",
            isUploading && "border-primary/50 cursor-not-allowed bg-card"
          )}
        >
          {uploadStatus === 'idle' && (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold mb-1">
                  Drop your {acceptVideo && acceptAudio ? 'video or audio' : acceptVideo ? 'video' : 'audio'} file here
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse (up to 5GB)
                </p>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                {acceptVideo && <Badge variant="outline"><Video className="h-3 w-3 mr-1" />Video</Badge>}
                {acceptAudio && <Badge variant="outline"><FileAudio className="h-3 w-3 mr-1" />Audio</Badge>}
              </div>
            </div>
          )}

          {(uploadStatus === 'uploading' || uploadStatus === 'success' || uploadStatus === 'error') && currentFile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentFile.type.startsWith('video') ? (
                    <Video className="h-8 w-8 text-primary" />
                  ) : (
                    <FileAudio className="h-8 w-8 text-primary" />
                  )}
                  <div className="text-left">
                    <p className="font-medium truncate max-w-xs">{currentFile.name}</p>
                    <p className="text-sm text-muted-foreground">{formatBytes(currentFile.size)}</p>
                  </div>
                </div>
                
                {uploadStatus === 'success' && (
                  <Check className="h-6 w-6 text-green-500" />
                )}
                {uploadStatus === 'error' && (
                  <AlertCircle className="h-6 w-6 text-destructive" />
                )}
                {uploadStatus === 'uploading' && (
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {uploadStatus === 'uploading' && (
                <>
                  <Progress value={uploadProgress} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{Math.round(uploadProgress)}%</span>
                    <span>{formatSpeed(uploadSpeed)}</span>
                  </div>
                </>
              )}

              {uploadStatus === 'success' && (
                <p className="text-sm text-green-600">Upload completed successfully!</p>
              )}

              {uploadStatus === 'error' && (
                <p className="text-sm text-destructive">Upload failed. Please try again.</p>
              )}
            </div>
          )}
        </div>

        {uploadStatus === 'idle' && (
          <p className="text-xs text-center text-muted-foreground mt-4">
            Secure cloud storage with support for files up to 5GB.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
