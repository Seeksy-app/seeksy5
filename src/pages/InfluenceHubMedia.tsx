import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Image, Video, FileText, Info, Sparkles, Loader2, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { VideoProcessingDialog } from "@/components/media/VideoProcessingDialog";
import { VideoComparisonView } from "@/components/media/VideoComparisonView";

interface MediaFile {
  id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  edit_status: string;
  created_at: string;
  edit_transcript?: any;
}

export default function InfluenceHubMedia() {
  const navigate = useNavigate();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiEditsDialogOpen, setAiEditsDialogOpen] = useState(false);
  const [selectedFileForEdits, setSelectedFileForEdits] = useState<MediaFile | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [processingDialogOpen, setProcessingDialogOpen] = useState(false);
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [selectedMediaFile, setSelectedMediaFile] = useState<MediaFile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMediaFiles();
  }, []);

  const fetchMediaFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: files, error } = await supabase
        .from("media_files")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMediaFiles(files || []);
    } catch (error) {
      console.error("Error fetching media:", error);
      toast({
        title: "Error",
        description: "Failed to load media files",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessWithAI = async (file: MediaFile) => {
    // Open processing dialog and start AI analysis
    setSelectedMediaFile(file);
    setProcessingDialogOpen(true);
  };

  const handleProcessingComplete = (analysis: any) => {
    setCurrentAnalysis(analysis);
    setProcessingDialogOpen(false);
    setComparisonDialogOpen(true);
    
    toast({
      title: "AI Analysis Complete",
      description: "Review the suggested improvements for your video",
    });
  };

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Loading media library...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Media Library</h1>
          <p className="text-muted-foreground">
            Upload and manage your content assets
          </p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Media
        </Button>
      </div>

      {mediaFiles.length === 0 ? (
        <>
          {/* Empty State */}
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex gap-4 mb-6">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <Image className="h-8 w-8 text-primary" />
                </div>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <Video className="h-8 w-8 text-primary" />
                </div>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">No media uploaded yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Upload images, videos, and other content to use in your social media posts
              </p>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First File
              </Button>
            </CardContent>
          </Card>

          {/* Coming Soon Features */}
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Drag & Drop</h3>
                <p className="text-sm text-muted-foreground">
                  Easily upload files by dragging them into the library
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Collections</h3>
                <p className="text-sm text-muted-foreground">
                  Organize media into folders and collections
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Tags</h3>
                <p className="text-sm text-muted-foreground">
                  Tag and search your media for quick access
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mediaFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">{file.file_name}</TableCell>
                  <TableCell>
                    {file.file_type.startsWith("video") ? (
                      <Badge variant="secondary">
                        <Video className="h-3 w-3 mr-1" />
                        Video
                      </Badge>
                    ) : file.file_type.startsWith("audio") ? (
                      <Badge variant="secondary">
                        <FileText className="h-3 w-3 mr-1" />
                        Audio
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Image className="h-3 w-3 mr-1" />
                        Image
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {file.edit_status === "edited" ? (
                        <Badge variant="default">Edited</Badge>
                      ) : file.edit_status === "processing" ? (
                        <Badge variant="outline">Processing...</Badge>
                      ) : (
                        <Badge variant="outline">Unprocessed</Badge>
                      )}
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
                    {format(new Date(file.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {file.file_size_bytes ? `${(file.file_size_bytes / 1024 / 1024).toFixed(1)} MB` : '-'}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider delayDuration={0}>
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
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* AI Edits Details Dialog */}
      <Dialog open={aiEditsDialogOpen} onOpenChange={setAiEditsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Editing Details</DialogTitle>
            <DialogDescription>
              Changes made by AI to optimize your content
            </DialogDescription>
          </DialogHeader>
          {selectedFileForEdits?.edit_transcript && (
            <div className="space-y-4">
              {selectedFileForEdits.edit_transcript.summary && (
                <div>
                  <h4 className="font-semibold mb-2">Summary</h4>
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
                  <h4 className="font-semibold mb-2">Specific Changes</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedFileForEdits.edit_transcript.changes.map((change: any, index: number) => (
                      <div key={index} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <Badge variant="outline" className="mb-1">
                              {change.type}
                            </Badge>
                            <p className="text-sm">{change.description}</p>
                          </div>
                          {change.timestamp && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {change.timestamp}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFileForEdits.edit_transcript.original_duration && selectedFileForEdits.edit_transcript.new_duration && (
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-semibold mb-3">Duration Comparison</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Original</div>
                      <div className="text-lg font-semibold">
                        {Math.floor(selectedFileForEdits.edit_transcript.original_duration / 60)}:
                        {String(selectedFileForEdits.edit_transcript.original_duration % 60).padStart(2, '0')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">After AI</div>
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

      {/* Video Processing Dialog */}
      <VideoProcessingDialog
        open={processingDialogOpen}
        onOpenChange={setProcessingDialogOpen}
        jobType="ai_edit"
        onComplete={handleProcessingComplete}
      />

      {/* Video Comparison View */}
      {selectedMediaFile && currentAnalysis && (
        <VideoComparisonView
          open={comparisonDialogOpen}
          onOpenChange={setComparisonDialogOpen}
          mediaFile={selectedMediaFile}
          analysis={currentAnalysis}
        />
      )}
    </div>
  );
}
