import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// TUS removed - R2 doesn't support TUS protocol
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Video, 
  Sparkles, 
  FileAudio, 
  AlertCircle, 
  CheckCircle2, 
  Upload as UploadIcon, 
  Film, 
  Download, 
  Save, 
  Trash2, 
  Play, 
  Edit3,
  Filter,
  Globe,
  ArrowUpDown,
  MoreVertical,
  Loader2,
  DollarSign,
  Scissors,
  Info
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import VideoUploader from "@/components/VideoUploader";
import { AdInsertionDialog } from "@/components/media/AdInsertionDialog";
import { useVideoProcessing } from "@/hooks/useVideoProcessing";
import { VideoMarkerPanel } from "@/components/media/VideoMarkerPanel";
import { VideoEditingControls } from "@/components/media/VideoEditingControls";
import { BRollManager } from "@/components/media/BRollManager";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ClipsGallery } from "@/components/media/ClipsGallery";
import { VideoOrientationBadge } from "@/components/media/VideoOrientationBadge";
import { loadVideoMetadata, VideoOrientation } from "@/utils/videoOrientation";
import { AIEditBadge } from "@/components/media/AIEditBadge";
import { AIJobsDebugPanel } from "@/components/admin/AIJobsDebugPanel";

interface Recording {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  edit_status: string;
  converted_to_episode_id: string | null;
  created_at: string;
  source: string;
  edit_transcript?: any;
  orientation?: VideoOrientation;
}

interface MediaFile {
  id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  edit_status: string;
  converted_to_episode_id: string | null;
  created_at: string;
  edit_transcript?: any;
  source: string;
  markers?: any[];
  orientation?: VideoOrientation;
}

interface Marker {
  id: string;
  type: 'camera_focus' | 'cut' | 'ad_placement' | 'lower_third' | 'broll' | 'clip_suggestion';
  timestamp: number;
}

const getMarkerIcon = (type: string) => {
  switch (type) {
    case 'ad_placement':
      return { icon: DollarSign, color: 'text-yellow-500 bg-yellow-500/10', label: 'Ads' };
    case 'camera_focus':
      return { icon: Video, color: 'text-blue-500 bg-blue-500/10', label: 'Camera Focus' };
    case 'cut':
      return { icon: Scissors, color: 'text-red-500 bg-red-500/10', label: 'Cuts/Trims' };
    case 'lower_third':
      return { icon: Edit3, color: 'text-green-500 bg-green-500/10', label: 'Lower Thirds' };
    case 'broll':
      return { icon: Film, color: 'text-purple-500 bg-purple-500/10', label: 'B-roll' };
    case 'clip_suggestion':
      return { icon: Sparkles, color: 'text-orange-500 bg-orange-500/10', label: 'Clip Suggestions' };
    default:
      return { icon: Video, color: 'text-gray-500 bg-gray-500/10', label: type };
  }
};

interface Podcast {
  id: string;
  title: string;
}

export default function MediaLibrary() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [selectedMediaFile, setSelectedMediaFile] = useState<MediaFile | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<{ original: string; edited?: string; name: string; fileType: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [renameItemId, setRenameItemId] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [isTranscribing, setIsTranscribing] = useState<string | null>(null);
  const [isGeneratingBlog, setIsGeneratingBlog] = useState<string | null>(null);
  const [isGeneratingClips, setIsGeneratingClips] = useState<string | null>(null);
  const [convertForm, setConvertForm] = useState({
    podcastId: "",
    title: "",
    description: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentTab, setCurrentTab] = useState('videos');
  const [adInsertionDialogOpen, setAdInsertionDialogOpen] = useState(false);
  const [selectedMediaForAds, setSelectedMediaForAds] = useState<MediaFile | null>(null);
  const [availableAds, setAvailableAds] = useState<any[]>([]);
  const [expandedMarkerFileId, setExpandedMarkerFileId] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [aiEditsDialogOpen, setAiEditsDialogOpen] = useState(false);
  const [selectedFileForEdits, setSelectedFileForEdits] = useState<MediaFile | Recording | null>(null);
  const [showAdminDebug, setShowAdminDebug] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const { processVideo, isProcessing: isVideoProcessing } = useVideoProcessing();
  const { toast } = useToast();
  const navigate = useNavigate();

  const toggleFileSelection = (id: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedFiles(newSelection);
  };

  const toggleAllFiles = () => {
    if (selectedFiles.size === mediaFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(mediaFiles.map(f => f.id)));
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const sortedMediaFiles = [...mediaFiles]
    .filter(file => !filterSource || file.source === filterSource)
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  const sortedRecordings = [...recordings]
    .filter(recording => !filterSource || recording.source === filterSource)
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  useEffect(() => {
    fetchData();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    
    setIsAdmin(roles?.role === "admin" || roles?.role === "super_admin");
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user is admin and in personal view mode
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      
      const isAdmin = roles?.role === "admin" || roles?.role === "super_admin";

      // Fetch studio recordings from media_files
      const { data: recordingsData, error: recordingsError } = await supabase
        .from("media_files")
        .select("*")
        .eq("user_id", user.id)
        .eq("source", "studio")
        .order("created_at", { ascending: false });

      if (recordingsError) throw recordingsError;

      // Fetch uploaded media files (exclude studio recordings)
      const { data: mediaFilesData, error: mediaFilesError } = await supabase
        .from("media_files")
        .select("*")
        .eq("user_id", user.id)
        .eq("source", "upload")
        .order("created_at", { ascending: false });

      if (mediaFilesError) throw mediaFilesError;

      // Fetch markers for AI-edited files (non-blocking)
      try {
        const aiEditedIds = [...(recordingsData || []), ...(mediaFilesData || [])]
          .filter(f => f.edit_status === 'edited')
          .map(f => f.id);

        if (aiEditedIds.length > 0) {
          const { data: editsData, error: editsError } = await supabase
            .from("video_post_production_edits")
            .select("media_file_id, markers")
            .in("media_file_id", aiEditedIds);

          if (!editsError && editsData) {
            // Merge markers into files
            const editsMap = new Map(editsData.map(e => [e.media_file_id, e.markers]));
            
            if (recordingsData) {
              recordingsData.forEach((r: any) => {
                if (editsMap.has(r.id)) {
                  r.markers = editsMap.get(r.id);
                }
              });
            }
            
            if (mediaFilesData) {
              mediaFilesData.forEach((f: any) => {
                if (editsMap.has(f.id)) {
                  f.markers = editsMap.get(f.id);
                }
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching markers:", error);
        // Continue without markers - don't break the entire page
      }

      // Fetch podcasts
      const { data: podcastsData, error: podcastsError } = await supabase
        .from("podcasts")
        .select("id, title")
        .eq("user_id", user.id);

      if (podcastsError) throw podcastsError;

      setRecordings(recordingsData || []);
      setMediaFiles(mediaFilesData || []);
      setPodcasts(podcastsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load media library",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video or audio file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50GB limit)
    const maxSizeBytes = 50 * 1024 * 1024 * 1024; // 50GB
    const fileSizeMB = file.size / (1024 * 1024);
    const fileSizeGB = file.size / (1024 * 1024 * 1024);
    
    if (file.size > maxSizeBytes) {
      toast({
        title: "File too large",
        description: `File size must be under 50GB. Your file is ${fileSizeGB.toFixed(2)}GB`,
        variant: "destructive",
      });
      return;
    }
    
    
    // For large files, the progress dialog will show status
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(file.name);

    toast({
      title: "Upload started",
      description: "You can navigate away - the upload will continue in the background",
      duration: 5000,
    });

    try {
      console.log(`Starting upload for ${file.name} (${fileSizeMB.toFixed(2)}MB)`);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Get presigned URL for direct R2 upload (bypasses all worker/nginx/body limits)
      const { data: urlData, error: urlError } = await supabase.functions.invoke('r2-presigned-url', {
        body: {
          fileName: file.name,
          fileType: file.type,
          userId: session.user.id,
          fileSize: file.size
        }
      });

      if (urlError || !urlData?.presignedUrl) {
        throw new Error('Failed to get upload URL');
      }

      console.log('Uploading directly to R2...');

      // Use XMLHttpRequest for all file sizes with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('R2 upload completed successfully');
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', (e) => {
          console.error('XHR error:', e);
          reject(new Error('Network error during upload. Please check your connection and try again.'));
        });

        xhr.addEventListener('timeout', () => {
          reject(new Error('Upload timed out. Please try again with a stable connection.'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        xhr.open('PUT', urlData.presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        // 2 hour timeout for very large files
        xhr.timeout = 7200000;
        xhr.send(file);
      });

      console.log('R2 upload complete, creating database record...');

      // Create database record
      const { error: dbError } = await supabase
        .from('media_files')
        .insert({
          user_id: session.user.id,
          file_name: file.name,
          file_url: urlData.fileUrl,
          file_type: file.type.startsWith('video') ? 'video' : 'audio',
          file_size_bytes: file.size,
          source: 'upload',
        });

      if (dbError) throw dbError;

      toast({
        title: "Upload complete!",
        description: `${file.name} has been uploaded successfully`,
      });

      await fetchData();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadingFileName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePostProduction = async (item: Recording | MediaFile, isMediaFile = false) => {
    const url = (item as MediaFile).file_url;
    
    if (!url) {
      toast({
        title: "Error",
        description: "File not ready yet",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(item.id);

    try {
      const { data, error } = await supabase.functions.invoke("ai-post-production", {
        body: {
          recordingId: item.id,
          audioUrl: url,
          isMediaFile,
        },
      });

      if (error) throw error;

      toast({
        title: "Post-production complete!",
        description: data.summary || "File has been optimized",
        duration: 3000,
      });

      await fetchData();
    } catch (error) {
      console.error("Post-production error:", error);
      toast({
        title: "Error",
        description: "Failed to process file",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: "Your file is downloading",
    });
  };

  const handleRename = async (itemId: string, isMediaFile: boolean) => {
    if (!newFileName.trim()) {
      toast({
        title: "Invalid name",
        description: "Please enter a valid file name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('media_files')
        .update({ file_name: newFileName.trim() })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Renamed successfully",
        description: "Media file has been renamed",
      });

      await fetchData();
      setRenameItemId(null);
      setNewFileName("");
    } catch (error) {
      console.error("Rename error:", error);
      toast({
        title: "Rename failed",
        description: "Could not rename the file",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (itemId: string, isMediaFile: boolean) => {
    try {
      const { error } = await supabase
        .from('media_files')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Deleted successfully",
        description: "Media file has been removed",
      });

      await fetchData();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: "Could not delete the file",
        variant: "destructive",
      });
    } finally {
      setDeleteItemId(null);
    }
  };

  const handleTranscribe = async (media: MediaFile | Recording) => {
    setIsTranscribing(media.id);
    try {
      // Use ElevenLabs transcription
      const { data, error } = await supabase.functions.invoke("elevenlabs-transcribe", {
        body: { audioUrl: media.file_url },
      });

      if (error) throw error;

      if (!data?.transcript) {
        throw new Error("No transcript returned");
      }

      // Download transcript as text file
      const blob = new Blob([data.transcript], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${media.file_name.replace(/\.[^/.]+$/, "")}_transcript.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Transcript downloaded successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to transcribe media",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(null);
    }
  };

  const handleGenerateBlog = async (media: MediaFile | Recording) => {
    setIsGeneratingBlog(media.id);
    try {
      // First check if transcript exists
      let transcript = media.edit_transcript?.transcript;

      if (!transcript) {
        toast({
          title: "Transcribing...",
          description: "Generating transcript first...",
        });

        // Generate transcript first
        const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke("transcribe-media", {
          body: { mediaId: media.id, audioUrl: media.file_url },
        });

        if (transcriptError) throw transcriptError;
        transcript = transcriptData.transcript;
      }

      toast({
        title: "Generating...",
        description: "Creating blog post from transcript...",
      });

      const { data, error } = await supabase.functions.invoke("generate-blog-from-media", {
        body: { 
          mediaId: media.id, 
          transcript: transcript,
          title: media.file_name.replace(/\.[^/.]+$/, "")
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog post created! Redirecting...",
      });

      // Redirect to blog post
      setTimeout(() => {
        navigate("/my-blog");
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate blog",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBlog(null);
    }
  };

  const handleGenerateClips = async (media: MediaFile | Recording) => {
    setIsGeneratingClips(media.id);
    try {
      toast({
        title: "Analyzing video...",
        description: "AI is identifying viral-worthy clips",
      });

      const { data, error } = await supabase.functions.invoke("analyze-clips", {
        body: {
          mediaId: media.id,
          fileUrl: media.file_url,
          duration: media.duration_seconds,
          transcript: media.edit_transcript?.transcript || null,
        },
      });

      if (error) throw error;

      toast({
        title: "Clips generated!",
        description: `AI identified ${data.clipsCreated} viral-worthy clips`,
      });

      // Navigate to clips tab
      setCurrentTab('clips');
      fetchData();
    } catch (error: any) {
      toast({
        title: "Failed to generate clips",
        description: error.message || "Could not analyze video for clips",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingClips(null);
    }
  };

  const fetchAvailableAds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch available audio ads for the user
      const { data: ads, error } = await supabase
        .from("audio_ads")
        .select("id, script, audio_url, duration_seconds, campaign_name")
        .eq("status", "active")
        .not("audio_url", "is", null);

      if (error) throw error;
      setAvailableAds(ads || []);
    } catch (error) {
      console.error("Error fetching ads:", error);
    }
  };

  const handleInsertAds = (file: MediaFile) => {
    setSelectedMediaForAds(file);
    fetchAvailableAds();
    setAdInsertionDialogOpen(true);
  };

  const handleProcessWithAds = async (adSlots: any[]) => {
    if (!selectedMediaForAds) return;

    try {
      await processVideo(
        selectedMediaForAds.id,
        'ad_insertion',
        { adSlots }
      );

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error("Error processing video with ads:", error);
    }
  };

  const handleConvertToEpisode = async (isMediaFile = false) => {
    const item = isMediaFile ? selectedMediaFile : selectedRecording;
    
    if (!item || !convertForm.podcastId || !convertForm.title) {
      toast({
        title: "Missing information",
        description: "Please select a podcast and enter a title",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);

    try {
      const { data, error } = await supabase.functions.invoke("convert-to-episode", {
        body: {
          recordingId: item.id,
          podcastId: convertForm.podcastId,
          title: convertForm.title,
          description: convertForm.description,
          isMediaFile,
        },
      });

      if (error) throw error;

      toast({
        title: "Episode created!",
        description: data.adsEnabled
          ? `Episode created with ${data.adSlotsCreated} ad slots`
          : "Episode created successfully",
        duration: 3000,
      });

      setSelectedRecording(null);
      setSelectedMediaFile(null);
      setConvertForm({ podcastId: "", title: "", description: "" });
      await fetchData();
    } catch (error) {
      console.error("Conversion error:", error);
      toast({
        title: "Error",
        description: "Failed to convert to episode",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const getStatusBadge = (item: Recording | MediaFile) => {
    if (item.converted_to_episode_id) {
      return <Badge variant="secondary">In Podcast</Badge>;
    }

    switch (item.edit_status) {
      case "edited":
        return <Badge variant="default">Edited</Badge>;
      case "processing":
        return <Badge variant="outline">Processing...</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unprocessed</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading media library...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Title */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Channel content</h1>
              <p className="text-sm text-muted-foreground">
                Manage and organize your media content
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <UploadIcon className="h-4 w-4 mr-2" />
                {isUploading ? `Uploading ${uploadProgress.toFixed(0)}%` : "Upload Media"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Progress Dialog */}
      <Dialog open={isUploading}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Uploading File</DialogTitle>
            <DialogDescription>
              {uploadingFileName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              This may take several minutes for large files. Please don't close this window.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="bg-transparent h-auto p-0 w-full justify-start gap-8 border-b-0">
              <TabsTrigger 
                value="videos" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
              >
                Uploads
              </TabsTrigger>
              <TabsTrigger 
                value="ai-edited" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                AI Edited
              </TabsTrigger>
              <TabsTrigger 
                value="studio" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
              >
                Studio Recordings
              </TabsTrigger>
              <TabsTrigger 
                value="shorts" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
              >
                Shorts
              </TabsTrigger>
              <TabsTrigger 
                value="live" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
              >
                Live
              </TabsTrigger>
              <TabsTrigger 
                value="podcasts" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
              >
                Podcasts
              </TabsTrigger>
              <TabsTrigger 
                value="clips" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
              >
                <Scissors className="h-4 w-4 mr-1.5" />
                Clips
              </TabsTrigger>
            </TabsList>

            {/* Filter Button */}
            <div className="py-4 flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                    {filterSource && (
                      <Badge variant="secondary" className="ml-2 capitalize">
                        {filterSource}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => setFilterSource(null)}>
                    <span>All Sources</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterSource('studio')}>
                    <span>Studio</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterSource('upload')}>
                    <span>Upload</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {filterSource && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilterSource(null)}
                  className="h-8"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Videos Tab */}
            <TabsContent value="videos" className="mt-0 space-y-6">
              {/* Upload Section */}
              <div className="py-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <VideoUploader onUploadComplete={fetchData} />
                <BRollManager />
              </div>

              {sortedMediaFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Film className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload your first video using the uploader above
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={selectedFiles.size === sortedMediaFiles.length}
                          onCheckedChange={toggleAllFiles}
                        />
                      </TableHead>
                      <TableHead className="w-96">Video</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                        <div className="flex items-center gap-1">
                          Date
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Actions</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                   </TableHeader>
                   <TableBody>
                     {sortedMediaFiles.map((file) => (
                       <>
                         <TableRow key={file.id}>
                           <TableCell>
                             <Checkbox
                               checked={selectedFiles.has(file.id)}
                               onCheckedChange={() => toggleFileSelection(file.id)}
                             />
                           </TableCell>
                         <TableCell>
                           <div className="flex items-center gap-3">
                             <div className="relative w-32 h-20 bg-black rounded overflow-hidden flex-shrink-0">
                             {file.file_type === 'video' ? (
                                  <>
                                    <video
                                      src={file.file_url}
                                      className="w-full h-full object-cover"
                                      muted
                                      preload="metadata"
                                      onLoadedData={(e) => {
                                        // Seek to 1 second for thumbnail
                                        e.currentTarget.currentTime = 1;
                                      }}
                                      onLoadedMetadata={async (e) => {
                                       const video = e.currentTarget;
                                       try {
                                         const metadata = await loadVideoMetadata(file.file_url);
                                         // Update file with orientation info
                                         setMediaFiles(prev => prev.map(f => 
                                           f.id === file.id ? { ...f, orientation: metadata.orientation } : f
                                         ));
                                       } catch (error) {
                                         console.error("Error loading video metadata:", error);
                                       }
                                     }}
                                   />
                                   {file.orientation && (
                                     <div className="absolute top-1 left-1">
                                       <VideoOrientationBadge 
                                         orientation={file.orientation} 
                                         className="text-[10px] py-0 px-1.5 h-4"
                                       />
                                     </div>
                                   )}
                                 </>
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center">
                                   <FileAudio className="h-8 w-8 text-muted-foreground" />
                                 </div>
                               )}
                               {file.duration_seconds && (
                                 <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                   {Math.floor(file.duration_seconds / 60)}:{String(file.duration_seconds % 60).padStart(2, '0')}
                                 </div>
                               )}
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="font-medium truncate" title={file.file_name.replace(/\.[^/.]+$/, "")}>
                                 {file.file_name.replace(/\.[^/.]+$/, "").slice(0, Math.ceil(file.file_name.replace(/\.[^/.]+$/, "").length / 2))}
                                 {file.file_name.replace(/\.[^/.]+$/, "").length > 10 && '...'}
                               </p>
                               {file.edit_transcript?.summary && (
                                 <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                   {file.edit_transcript.summary.slice(0, Math.ceil(file.edit_transcript.summary.length / 2))}
                                   {file.edit_transcript.summary.length > 20 && '...'}
                                 </p>
                               )}
                             </div>
                           </div>
                         </TableCell>
                         <TableCell>
                           <div className="flex items-center gap-2">
                             {getStatusBadge(file)}
                             {file.edit_status === "edited" && file.edit_transcript && (
                               <TooltipProvider delayDuration={0}>
                                 <Tooltip>
                                   <TooltipTrigger asChild>
                                     <Button
                                       size="sm"
                                       variant="ghost"
                                       className="h-7 w-7 p-0"
                                       onClick={() => {
                                         setSelectedFileForEdits(file);
                                         setAiEditsDialogOpen(true);
                                       }}
                                     >
                                       <Info className="h-3.5 w-3.5 text-primary" />
                                     </Button>
                                   </TooltipTrigger>
                                   <TooltipContent>
                                     <p>View AI Edits</p>
                                   </TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>
                             )}
                            {file.edit_status === "unprocessed" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => navigate(`/post-production-studio?id=${file.id}`)}
                                title="Open in Post Production Studio"
                              >
                                <Sparkles className="h-3 w-3" />
                                <span className="text-xs font-medium">AI</span>
                              </Button>
                           )}
                          </div>
                         </TableCell>
                         <TableCell className="text-sm">
                           {formatDuration(file.duration_seconds)}
                         </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {formatDate(file.created_at)}
                          </TableCell>
                        <TableCell className="text-sm">
                          {file.file_size_bytes ? `${(file.file_size_bytes / 1024 / 1024).toFixed(1)} MB` : '-'}
                        </TableCell>
                        <TableCell>
                          <TooltipProvider delayDuration={0}>
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleTranscribe(file)}
                                    disabled={isTranscribing === file.id}
                                  >
                                    {isTranscribing === file.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <FileAudio className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Transcribe</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleInsertAds(file)}
                                  >
                                    <DollarSign className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Insert Ads</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setExpandedMarkerFileId(expandedMarkerFileId === file.id ? null : file.id)}
                                  >
                                    <Scissors className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Manage Markers</p>
                                </TooltipContent>
                              </Tooltip>
                              {file.edit_status === "edited" && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => setPreviewItem({ 
                                        original: file.file_url, 
                                        name: file.file_name,
                                        fileType: file.file_type 
                                      })}
                                    >
                                      <Play className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Preview</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleDownload(file.file_url, file.file_name)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Download</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleGenerateBlog(file)}
                                    disabled={isGeneratingBlog === file.id}
                                  >
                                    {isGeneratingBlog === file.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Sparkles className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Generate Blog</p>
                                </TooltipContent>
                               </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleGenerateClips(file)}
                                    disabled={isGeneratingClips === file.id || file.file_type !== 'video'}
                                  >
                                    {isGeneratingClips === file.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Film className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Generate Clips</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      setRenameItemId(file.id);
                                      setNewFileName(file.file_name);
                                    }}
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Rename</p>
                                </TooltipContent>
                              </Tooltip>
                              {file.edit_status === "edited" && !file.converted_to_episode_id && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => {
                                        setSelectedMediaFile(file);
                                        setConvertForm({
                                          podcastId: "",
                                          title: file.file_name.replace(/\.[^/.]+$/, ""),
                                          description: "",
                                        });
                                      }}
                                    >
                                      <Film className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Add to Episode</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    onClick={() => setDeleteItemId(file.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                         </TableRow>
                         
                         {/* Expandable Marker Panel */}
                         {expandedMarkerFileId === file.id && (
                           <TableRow>
                             <TableCell colSpan={7} className="bg-muted/30 p-0">
                               <div className="p-4">
                                 <VideoMarkerPanel 
                                   mediaFileId={file.id} 
                                   videoDuration={file.duration_seconds || undefined}
                                 />
                               </div>
                             </TableCell>
                           </TableRow>
                         )}
                       </>
                     ))}
                   </TableBody>
                 </Table>
               )}
            </TabsContent>

            {/* Studio Recordings Tab */}
            <TabsContent value="studio" className="mt-0">
              {sortedRecordings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Video className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No studio recordings yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start a studio session to create your first recording
                  </p>
                  <Button onClick={() => navigate("/studio")}>Go to Studio</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12">
                        <Checkbox />
                      </TableHead>
                      <TableHead className="w-96">Recording</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                        <div className="flex items-center gap-1">
                          Date
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRecordings.map((recording) => (
                      <TableRow key={recording.id}>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                         <TableCell>
                           <div className="flex items-center gap-3">
                             <div className="relative w-32 h-20 bg-black rounded overflow-hidden flex-shrink-0">
                               {recording.file_type === 'video/webm' ? (
                                 <>
                                   <video
                                     src={recording.file_url}
                                     className="w-full h-full object-cover"
                                     muted
                                     onLoadedMetadata={async (e) => {
                                       const video = e.currentTarget;
                                       try {
                                         const metadata = await loadVideoMetadata(recording.file_url);
                                         // Update recording with orientation info
                                         setRecordings(prev => prev.map(r => 
                                           r.id === recording.id ? { ...r, orientation: metadata.orientation } : r
                                         ));
                                       } catch (error) {
                                         console.error("Error loading video metadata:", error);
                                       }
                                     }}
                                   />
                                   {recording.orientation && (
                                     <div className="absolute top-1 left-1">
                                       <VideoOrientationBadge 
                                         orientation={recording.orientation} 
                                         className="text-[10px] py-0 px-1.5 h-4"
                                       />
                                     </div>
                                   )}
                                 </>
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center">
                                   <FileAudio className="h-8 w-8 text-muted-foreground" />
                                 </div>
                               )}
                               {recording.duration_seconds && (
                                 <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                   {Math.floor(recording.duration_seconds / 60)}:{String(recording.duration_seconds % 60).padStart(2, '0')}
                                 </div>
                               )}
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="font-medium truncate">{recording.file_name.replace(/\.[^/.]+$/, "")}</p>
                               {recording.edit_transcript?.summary && (
                                 <p className="text-xs text-muted-foreground truncate mt-0.5">
                                   {recording.edit_transcript.summary}
                                 </p>
                               )}
                             </div>
                           </div>
                         </TableCell>
                         <TableCell>
                           <div className="flex items-center gap-2">
                             {getStatusBadge(recording)}
                             {recording.edit_status === "edited" && recording.edit_transcript && (
                               <TooltipProvider delayDuration={0}>
                                 <Tooltip>
                                   <TooltipTrigger asChild>
                                     <Button
                                       size="sm"
                                       variant="ghost"
                                       className="h-7 w-7 p-0"
                                       onClick={() => {
                                         setSelectedFileForEdits(recording);
                                         setAiEditsDialogOpen(true);
                                       }}
                                     >
                                       <Info className="h-3.5 w-3.5 text-primary" />
                                     </Button>
                                   </TooltipTrigger>
                                   <TooltipContent>
                                     <p>View AI Edits</p>
                                   </TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>
                             )}
                            {recording.edit_status === "unprocessed" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => navigate(`/post-production-studio?id=${recording.id}`)}
                                title="Open in Post Production Studio"
                              >
                                <Sparkles className="h-3 w-3" />
                                <span className="text-xs font-medium">AI</span>
                              </Button>
                           )}
                           </div>
                         </TableCell>
                         <TableCell className="text-sm">
                           {formatDuration(recording.duration_seconds)}
                         </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {formatDate(recording.created_at)}
                          </TableCell>
                        <TableCell className="text-sm">
                          {recording.file_size_bytes ? `${(recording.file_size_bytes / 1024 / 1024).toFixed(1)} MB` : '-'}
                        </TableCell>
                         <TableCell>
                           <TooltipProvider delayDuration={0}>
                             <div className="flex items-center gap-1">
                               {recording.edit_status === "edited" && (
                                 <Tooltip>
                                   <TooltipTrigger asChild>
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       className="h-8 w-8 p-0"
                                       onClick={() => setPreviewItem({ 
                                         original: recording.file_url, 
                                         name: recording.file_name,
                                         fileType: recording.file_type 
                                       })}
                                     >
                                       <Play className="h-4 w-4" />
                                     </Button>
                                   </TooltipTrigger>
                                   <TooltipContent>
                                     <p>Preview</p>
                                   </TooltipContent>
                                 </Tooltip>
                               )}
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     className="h-8 w-8 p-0"
                                     onClick={() => {
                                       setRenameItemId(recording.id);
                                       setNewFileName(recording.file_name);
                                     }}
                                   >
                                     <Edit3 className="h-4 w-4" />
                                   </Button>
                                 </TooltipTrigger>
                                 <TooltipContent>
                                   <p>Rename</p>
                                 </TooltipContent>
                               </Tooltip>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     className="h-8 w-8 p-0"
                                     onClick={() => handleDownload(recording.file_url, recording.file_name)}
                                   >
                                     <Download className="h-4 w-4" />
                                   </Button>
                                 </TooltipTrigger>
                                 <TooltipContent>
                                   <p>Download</p>
                                 </TooltipContent>
                               </Tooltip>
                               {recording.edit_status === "edited" && !recording.converted_to_episode_id && (
                                 <Tooltip>
                                   <TooltipTrigger asChild>
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       className="h-8 w-8 p-0"
                                       onClick={() => {
                                         setSelectedRecording(recording);
                                         setConvertForm({
                                           podcastId: "",
                                           title: recording.file_name.replace(/\.[^/.]+$/, ""),
                                           description: "",
                                         });
                                       }}
                                     >
                                       <Film className="h-4 w-4" />
                                     </Button>
                                   </TooltipTrigger>
                                   <TooltipContent>
                                     <p>Add to Episode</p>
                                   </TooltipContent>
                                 </Tooltip>
                               )}
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                     onClick={() => setDeleteItemId(recording.id)}
                                   >
                                     <Trash2 className="h-4 w-4" />
                                   </Button>
                                 </TooltipTrigger>
                                 <TooltipContent>
                                   <p>Delete</p>
                                 </TooltipContent>
                               </Tooltip>
                             </div>
                           </TooltipProvider>
                         </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Placeholder tabs */}
            <TabsContent value="shorts" className="mt-0">
              <div className="flex flex-col items-center justify-center py-16">
                <Film className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Shorts coming soon</h3>
                <p className="text-muted-foreground">
                  Short-form video content will be available here
                </p>
              </div>
            </TabsContent>

            <TabsContent value="live" className="mt-0">
              <div className="flex flex-col items-center justify-center py-16">
                <Video className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Live streaming coming soon</h3>
                <p className="text-muted-foreground">
                  Live stream management will be available here
                </p>
              </div>
            </TabsContent>

            <TabsContent value="podcasts" className="mt-0">
              <div className="flex flex-col items-center justify-center py-16">
                <FileAudio className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Your podcasts</h3>
                <p className="text-muted-foreground mb-4">
                  Manage your podcast episodes
                </p>
                <Button onClick={() => navigate("/podcasts")}>View Podcasts</Button>
              </div>
            </TabsContent>

            <TabsContent value="clips" className="mt-0 py-6">
              <ClipsGallery />
            </TabsContent>

            <TabsContent value="ai-edited" className="mt-0">
              <div className="py-4">
                <div className="mb-4 flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">AI Edited Videos</p>
                    <p className="text-sm text-muted-foreground">Videos processed with tracked AI enhancements</p>
                  </div>
                </div>

                {sortedMediaFiles.filter(f => f.edit_status === 'edited').length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Sparkles className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No AI edited videos yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Run Full AI Enhancement on any video to track edits
                    </p>
                    <Button onClick={() => navigate("/media-library")}>
                      Go to Media Library
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-96">Video</TableHead>
                        <TableHead>AI Edits</TableHead>
                        <TableHead>Date Edited</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedMediaFiles.filter(f => f.edit_status === 'edited').map((file) => (
                        <TableRow key={file.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="relative w-32 h-20 bg-black rounded overflow-hidden flex-shrink-0">
                                <video
                                  src={file.file_url}
                                  className="w-full h-full object-cover"
                                  muted
                                />
                                <div className="absolute top-1 left-1">
                                  <Badge className="text-[10px] bg-primary/90">
                                    <Sparkles className="h-2.5 w-2.5 mr-1" />
                                    AI
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{file.file_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {file.duration_seconds && `${Math.floor(file.duration_seconds / 60)}:${String(file.duration_seconds % 60).padStart(2, '0')}`}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                           <TableCell>
                            <AIEditBadge 
                              mediaId={file.id}
                              onRunAIEnhancement={() => {
                                setSelectedMediaForAds(file);
                                navigate(`/post-production-studio?id=${file.id}`);
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(file.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setPreviewItem({ 
                                  original: file.file_url, 
                                  name: file.file_name,
                                  fileType: file.file_type 
                                })}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/post-production-studio?id=${file.id}`)}
                              >
                                <Edit3 className="h-4 w-4 mr-1" />
                                Edit More
                              </Button>
                              {isAdmin && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedFileForEdits(file);
                                    setShowAdminDebug(true);
                                  }}
                                >
                                  <Info className="h-4 w-4 mr-1" />
                                  Debug
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownload(file.file_url, file.file_name)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteItemId(file.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Convert to Episode Dialog */}
      <Dialog open={!!(selectedRecording || selectedMediaFile)} onOpenChange={() => {
        setSelectedRecording(null);
        setSelectedMediaFile(null);
        setConvertForm({ podcastId: "", title: "", description: "" });
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Podcast Episode</DialogTitle>
            <DialogDescription>
              This will create a new episode in your selected podcast.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="podcast">Podcast</Label>
              <Select
                value={convertForm.podcastId}
                onValueChange={(value) =>
                  setConvertForm({ ...convertForm, podcastId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a podcast" />
                </SelectTrigger>
                <SelectContent>
                  {podcasts.map((podcast) => (
                    <SelectItem key={podcast.id} value={podcast.id}>
                      {podcast.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Episode Title</Label>
              <Input
                id="title"
                value={convertForm.title}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, title: e.target.value })
                }
                placeholder="Episode title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={convertForm.description}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, description: e.target.value })
                }
                placeholder="Episode description"
                rows={4}
              />
            </div>

            <Button
              onClick={() => handleConvertToEpisode(!!selectedMediaFile)}
              disabled={isConverting}
              className="w-full"
            >
              {isConverting ? "Converting..." : "Create Episode"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this media file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItemId && handleDelete(deleteItemId, true)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview: {previewItem?.name}</DialogTitle>
            <DialogDescription>
              Compare the original and AI-improved versions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Original</h3>
              {(previewItem?.fileType === 'video' || previewItem?.fileType.startsWith('video/')) ? (
                <video
                  src={previewItem.original}
                  controls
                  className="w-full rounded-lg bg-black"
                />
              ) : (
                <audio
                  src={previewItem?.original}
                  controls
                  className="w-full"
                />
              )}
            </div>
            {previewItem?.edited && (
              <div>
                <h3 className="font-semibold mb-2">AI Improved</h3>
                {(previewItem.fileType === 'video' || previewItem.fileType.startsWith('video/')) ? (
                  <video
                    src={previewItem.edited}
                    controls
                    className="w-full rounded-lg bg-black"
                  />
                ) : (
                  <audio
                    src={previewItem.edited}
                    controls
                    className="w-full"
                  />
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameItemId} onOpenChange={() => {
        setRenameItemId(null);
        setNewFileName("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Media File</DialogTitle>
            <DialogDescription>
              Enter a new name for this media file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newFileName">File Name</Label>
              <Input
                id="newFileName"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Enter new file name"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRenameItemId(null);
                  setNewFileName("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => renameItemId && handleRename(renameItemId, true)}
              >
                Rename
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ad Insertion Dialog */}
      {selectedMediaForAds && (
        <AdInsertionDialog
          open={adInsertionDialogOpen}
          onOpenChange={setAdInsertionDialogOpen}
          mediaFile={{
            id: selectedMediaForAds.id,
            title: selectedMediaForAds.file_name,
            duration_seconds: selectedMediaForAds.duration_seconds || 0,
          }}
          availableAds={availableAds}
          onInsertAds={handleProcessWithAds}
        />
      )}

      {/* AI Edits Details Dialog */}
      <Dialog open={aiEditsDialogOpen} onOpenChange={setAiEditsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Editing Details</DialogTitle>
            <DialogDescription>
              Review the changes made by AI post-production
            </DialogDescription>
          </DialogHeader>
          {selectedFileForEdits?.edit_transcript && (
            <div className="space-y-4">
              {selectedFileForEdits.edit_transcript.summary && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedFileForEdits.edit_transcript.summary}
                  </p>
                </div>
              )}
              
              {selectedFileForEdits.edit_transcript.filler_words_removed && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <div className="text-2xl font-bold text-primary">
                      {selectedFileForEdits.edit_transcript.filler_words_removed}
                    </div>
                    <div className="text-sm text-muted-foreground">Filler Words Removed</div>
                  </div>
                  {selectedFileForEdits.edit_transcript.duration_removed_seconds && (
                    <div className="rounded-lg border p-4">
                      <div className="text-2xl font-bold text-primary">
                        {selectedFileForEdits.edit_transcript.duration_removed_seconds}s
                      </div>
                      <div className="text-sm text-muted-foreground">Time Saved</div>
                    </div>
                  )}
                </div>
              )}

              {selectedFileForEdits.edit_transcript.changes && selectedFileForEdits.edit_transcript.changes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Changes Made</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedFileForEdits.edit_transcript.changes.map((change: any, index: number) => (
                      <div key={index} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{change.type || 'Edit'}</div>
                            {change.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {change.description}
                              </div>
                            )}
                          </div>
                          {change.timestamp && (
                            <Badge variant="secondary" className="text-xs">
                              {change.timestamp}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFileForEdits.edit_transcript.original_duration && selectedFileForEdits.edit_transcript.new_duration && (
                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Original Duration</div>
                      <div className="text-lg font-semibold">
                        {Math.floor(selectedFileForEdits.edit_transcript.original_duration / 60)}:
                        {String(selectedFileForEdits.edit_transcript.original_duration % 60).padStart(2, '0')}
                      </div>
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div>
                      <div className="text-sm text-muted-foreground">New Duration</div>
                      <div className="text-lg font-semibold text-primary">
                        {Math.floor(selectedFileForEdits.edit_transcript.new_duration / 60)}:
                        {String(selectedFileForEdits.edit_transcript.new_duration % 60).padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setAiEditsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Debug Panel Dialog */}
      <Dialog open={showAdminDebug} onOpenChange={setShowAdminDebug}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Jobs Debug Panel</DialogTitle>
            <DialogDescription>
              Admin-only view of AI processing jobs for this media file
            </DialogDescription>
          </DialogHeader>
          {selectedFileForEdits && (
            <AIJobsDebugPanel mediaId={selectedFileForEdits.id} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}