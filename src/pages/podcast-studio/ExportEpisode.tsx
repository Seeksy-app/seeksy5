import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Shield, ArrowRight, FileText, Radio } from "lucide-react";
import { exportEpisode } from "@/lib/api/podcastStudioAPI";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const ExportEpisode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { episodeId, episodeTitle, tracks, duration, cleanupMethod, adReadEvents } = location.state || {};

  const [isExporting, setIsExporting] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: podcasts } = useQuery({
    queryKey: ["podcasts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleExport = async () => {
    if (!episodeId) return;

    setIsExporting(true);

    try {
      const { downloadUrls } = await exportEpisode(episodeId, "bundled");
      
      // Simulate download
      console.log("Downloading from:", downloadUrls);
      
      setIsExporting(false);
    } catch (error) {
      console.error("Export failed:", error);
      setIsExporting(false);
    }
  };

  const handleSuccess = () => {
    const audioUrl = tracks?.[0]?.audioUrl || null;
    
    navigate(`/podcast-studio/success`, {
      state: { 
        episodeTitle, 
        episodeId,
        audioUrl,
        duration,
      },
    });
  };

  const handleCertify = () => {
    // Navigate to Content Certification Flow with full episode metadata
    navigate("/content-certification", {
      state: {
        contentType: "podcast-episode",
        episodeId,
        episodeTitle,
        tracks,
        cleanupMethod,
        recordingDate: new Date(),
        adReadEvents: adReadEvents || [],
      },
    });
  };

  const handleSendToPodcast = (podcastId: string) => {
    const audioUrl = tracks?.[0]?.audioUrl || null;
    
    // Navigate to new episode form with pre-filled data
    navigate(`/podcasts/${podcastId}/episodes/new-from-studio`, {
      state: {
        episodeId,
        audioUrl,
        title: episodeTitle || "Untitled Episode",
        duration,
        recordingDate: new Date().toISOString(),
        cleanupMethod,
        tracks,
        adReadEvents: adReadEvents || [],
      },
    });
    setIsSheetOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8 bg-white/95 backdrop-blur">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-[#053877]">
              Export Episode
            </h2>
            <p className="text-sm text-muted-foreground">
              Download your processed audio or certify it on-chain
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-muted/30 space-y-3">
            <div className="font-semibold text-[#053877]">{episodeTitle}</div>
            <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Duration:</span>{" "}
                {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, "0")}
              </div>
              <div>
                <span className="font-medium text-foreground">Tracks:</span>{" "}
                {tracks?.length || 0}
              </div>
              <div>
                <span className="font-medium text-foreground">Cleanup:</span>{" "}
                {cleanupMethod}
              </div>
              <div>
                <span className="font-medium text-foreground">Format:</span> WAV
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white h-12"
            >
              {isExporting ? (
                "Exporting..."
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Processed Audio
                </>
              )}
            </Button>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="default"
                  className="w-full h-12 bg-[#053877] hover:bg-[#053877]/90 text-white"
                >
                  <Radio className="w-4 h-4 mr-2" />
                  Send to Podcasts
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Select a Podcast</SheetTitle>
                  <SheetDescription>
                    Choose which podcast this episode belongs to
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-3">
                  {podcasts && podcasts.length > 0 ? (
                    podcasts.map((podcast) => (
                      <Card
                        key={podcast.id}
                        className="p-4 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleSendToPodcast(podcast.id)}
                      >
                        <div className="flex items-center gap-3">
                          {podcast.cover_image_url ? (
                            <img
                              src={podcast.cover_image_url}
                              alt={podcast.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
                              <Radio className="w-6 h-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{podcast.title}</h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {podcast.description || "No description"}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">
                        No podcasts found. Create one first!
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => navigate("/podcasts/create")}
                      >
                        Create Podcast
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Button
              onClick={handleSuccess}
              variant="outline"
              className="w-full h-12 border-[#053877] text-[#053877] hover:bg-[#053877]/5"
            >
              <FileText className="w-4 h-4 mr-2" />
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <Button
              onClick={handleCertify}
              variant="outline"
              className="w-full h-12 border-[#2C6BED] text-[#2C6BED] hover:bg-[#2C6BED]/5"
            >
              <Shield className="w-4 h-4 mr-2" />
              Certify This Episode
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Certification creates an on-chain record of authenticity for your episode
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ExportEpisode;
