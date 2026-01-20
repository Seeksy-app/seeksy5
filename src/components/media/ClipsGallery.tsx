import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, Play, Trash2, Type, Clock, Calendar, Shield } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CertificationBadge } from "@/components/clips/CertificationBadge";
import { CertificationSection } from "@/components/clips/CertificationSection";
import { CertifyClipBanner } from "@/components/clips/CertifyClipBanner";
import { CreateClipDialog } from "@/components/clips/CreateClipDialog";
import { useNavigate } from "react-router-dom";

interface Clip {
  id: string;
  title: string | null;
  storage_path: string | null;
  vertical_url: string | null;
  thumbnail_url: string | null;
  error_message: string | null;
  start_seconds: number;
  end_seconds: number;
  duration_seconds: number;
  suggested_caption: string | null;
  virality_score: number | null;
  status: string;
  created_at: string;
  cert_status: string;
  cert_chain: string | null;
  cert_tx_hash: string | null;
  cert_explorer_url: string | null;
  cert_created_at: string | null;
  source_media: {
    file_name: string;
    file_url: string;
  } | null;
}

export function ClipsGallery() {
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  const { data: clips, isLoading, refetch } = useQuery({
    queryKey: ["clips"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("clips")
        .select(`
          *,
          vertical_url,
          thumbnail_url,
          error_message,
          cert_status,
          cert_chain,
          cert_tx_hash,
          cert_explorer_url,
          cert_created_at,
          source_media:source_media_id (
            file_name,
            file_url
          )
        `)
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Clip[];
    },
    refetchInterval: (query) => {
      // Poll every 2 seconds if there are any processing clips
      const hasProcessing = query.state.data?.some(clip => clip.status === 'processing');
      return hasProcessing ? 2000 : false;
    },
  });

  const createDemoClip = async (enableCertification: boolean) => {
    setIsCreatingDemo(true);
    try {
      toast.loading("Creating demo clip...", { 
        id: "demo-clip",
        description: enableCertification ? "With blockchain certification" : "Processing pipeline validation"
      });
      
      const { data, error } = await supabase.functions.invoke("create-demo-clip", {
        body: { enableCertification },
      });

      if (error) throw error;

      toast.success("Demo clip created!", {
        id: "demo-clip",
        description: enableCertification ? "Certification will be added when ready" : "Pipeline validated successfully",
      });

      // Start polling for updates
      refetch();
      setCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating demo:", error);
      toast.error("Failed to create demo clip", {
        id: "demo-clip",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsCreatingDemo(false);
    }
  };

  const handleDelete = async (clipId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Must be logged in to delete clips");
        return;
      }

      const { error } = await supabase
        .from("clips")
        .delete()
        .eq("id", clipId)
        .eq("user_id", user.id); // Explicitly check ownership

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      toast.success("Clip deleted");
      refetch();
    } catch (error) {
      console.error("Error deleting clip:", error);
      toast.error("Failed to delete clip: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleDownload = async (clip: Clip, format: 'vertical' | 'thumbnail') => {
    const clipUrl = format === 'vertical' ? clip.vertical_url : clip.thumbnail_url;
    
    if (!clipUrl) {
      toast.error(`${format === 'vertical' ? 'Vertical' : 'Thumbnail'} clip not ready yet`);
      return;
    }

    try {
      const response = await fetch(clipUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${clip.title || 'clip'}_${format}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${format === 'vertical' ? 'Vertical' : 'Thumbnail'} clip downloaded!`);
    } catch (error) {
      console.error("Error downloading clip:", error);
      toast.error("Failed to download clip");
    }
  };

  const handleCertifyClip = async (clipId: string) => {
    try {
      toast.loading("Requesting blockchain certification...", { id: "cert-clip" });
      
      const { data, error } = await supabase.functions.invoke("mint-clip-certificate", {
        body: { clipId },
      });

      if (error) throw error;

      toast.success("Certification initiated! This may take a few moments.", {
        id: "cert-clip",
      });
      
      refetch();
    } catch (error) {
      console.error("Certification error:", error);
      toast.error("Failed to certify clip", {
        id: "cert-clip",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!clips || clips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI-Generated Clips
          </CardTitle>
          <CardDescription>
            Create a demo clip to validate the complete pipeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center py-4">
            No clips yet. Create a demo clip to test the pipeline!
          </p>
          <Button 
            onClick={() => setCreateDialogOpen(true)} 
            disabled={isCreatingDemo}
            className="w-full"
            size="lg"
          >
            {isCreatingDemo ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                Creating Demo Clip...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Create Demo Clip
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Generated Clips ({clips.length})
          </h3>
          <Button 
            onClick={() => setCreateDialogOpen(true)} 
            disabled={isCreatingDemo}
            variant="outline"
            size="sm"
          >
            {isCreatingDemo ? (
              <>
                <Sparkles className="mr-2 h-3 w-3 animate-pulse" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-3 w-3" />
                Create Demo Clip
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clips.map((clip) => {
            const hasVertical = !!clip.vertical_url;
            const hasThumbnail = !!clip.thumbnail_url;
            const isProcessing = clip.status === 'processing';
            const hasFailed = clip.status === 'failed';
            
            return (
              <Card key={clip.id} className="overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  {/* Show thumbnail if available, otherwise vertical, otherwise source */}
                  {hasThumbnail ? (
                    <video
                      src={clip.thumbnail_url!}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : hasVertical ? (
                    <video
                      src={clip.vertical_url!}
                      className="w-full h-full object-contain bg-black"
                      muted
                    />
                  ) : clip.source_media?.file_url ? (
                    <video
                      src={`${clip.source_media.file_url}#t=${clip.start_seconds}`}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Play className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Status badges */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      <Badge variant="secondary">Generating clips...</Badge>
                      <p className="text-xs text-white/80">Auto-refreshing every 2s</p>
                    </div>
                  )}
                  
                  {hasFailed && (
                    <div className="absolute inset-0 bg-red-500/20 flex flex-col items-center justify-center gap-2 p-4">
                      <Badge variant="destructive">Failed</Badge>
                      {clip.error_message && (
                        <p className="text-xs text-white text-center">{clip.error_message}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Certification Badge - top right */}
                  {!isProcessing && !hasFailed && (
                    <div className="absolute top-2 right-2">
                      <CertificationBadge status={clip.cert_status as any} mini />
                    </div>
                  )}
                  
                  {/* Virality badge - top left if cert badge present, otherwise top right */}
                  {clip.virality_score && clip.virality_score > 70 && !isProcessing && (
                    <Badge className={`absolute top-2 ${clip.cert_status !== 'not_requested' ? 'left-2' : 'right-2'} bg-primary`} variant="default">
                      🔥 {clip.virality_score}% Viral
                    </Badge>
                  )}
                  
                  {/* Duration badge - bottom right */}
                  {!isProcessing && !hasFailed && (
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="text-xs font-semibold bg-black/70 text-white border-0">
                        {formatDuration(clip.duration_seconds)}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Format badges */}
                  {!isProcessing && !hasFailed && (
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      {hasVertical && (
                        <Badge variant="secondary" className="text-xs bg-black/70 text-white border-0">
                          9:16
                        </Badge>
                      )}
                      {hasThumbnail && (
                        <Badge variant="secondary" className="text-xs bg-black/70 text-white border-0">
                          16:9
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold line-clamp-2">{clip.title || 'Untitled Clip'}</h4>
                    {clip.source_media && (
                      <p className="text-xs text-muted-foreground mt-1">
                        From: {clip.source_media.file_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(clip.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                    {clip.suggested_caption && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {clip.suggested_caption}
                      </p>
                    )}
                    {hasFailed && clip.error_message && (
                      <p className="text-xs text-red-500 mt-1">
                        {clip.error_message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(clip.duration_seconds)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI
                    </Badge>
                  </div>

                  {/* Download buttons for each format */}
                  <div className="flex gap-2">
                    {hasVertical && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDownload(clip, 'vertical')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Vertical
                      </Button>
                    )}
                    {hasThumbnail && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDownload(clip, 'thumbnail')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Thumbnail
                      </Button>
                    )}
                    {!hasVertical && !hasThumbnail && !isProcessing && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedClip(clip);
                          setPreviewOpen(true);
                        }}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Preview Source
                      </Button>
                    )}
                    {/* Certification retry for failed certs */}
                    {clip.cert_status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCertifyClip(clip.id)}
                        title="Retry blockchain certification"
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Retry Cert
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(clip.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedClip?.title}</DialogTitle>
            <DialogDescription>
              {selectedClip?.source_media?.file_name && (
                <>From: {selectedClip.source_media.file_name}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedClip?.storage_path ? (
            <div className="space-y-4">
              <video
                src={selectedClip.storage_path}
                controls
                className="w-full rounded-lg"
              />
              
              {selectedClip.suggested_caption && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">AI Suggested Caption:</p>
                  <p className="text-sm">{selectedClip.suggested_caption}</p>
                </div>
              )}
              
              {selectedClip.virality_score && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Virality Score: {selectedClip.virality_score}%
                  </Badge>
                </div>
              )}
              
              {/* Post-render certification CTA for non-certified clips */}
              {selectedClip.cert_status === 'not_requested' && !dismissedBanners.has(selectedClip.id) && (
                <CertifyClipBanner
                  clipId={selectedClip.id}
                  onCertified={() => {
                    refetch();
                  }}
                  onDismiss={() => {
                    setDismissedBanners(prev => new Set(prev).add(selectedClip.id));
                  }}
                />
              )}
              
              {/* Certification Section */}
              {selectedClip.cert_status && selectedClip.cert_status !== 'not_requested' && (
                <CertificationSection
                  clipId={selectedClip.id}
                  certStatus={selectedClip.cert_status}
                  certChain={selectedClip.cert_chain}
                  certTxHash={selectedClip.cert_tx_hash}
                  certExplorerUrl={selectedClip.cert_explorer_url}
                  certCreatedAt={selectedClip.cert_created_at}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                {selectedClip?.status === "processing" 
                  ? "Clip is being processed..."
                  : "Clip URL not available"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Clip Dialog */}
      <CreateClipDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onConfirm={createDemoClip}
        isCreating={isCreatingDemo}
      />
    </>
  );
}
