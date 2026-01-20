import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, ArrowRight } from "lucide-react";
import { saveEpisode, type EpisodeMetadata } from "@/lib/api/podcastStudioAPI";

const SaveEpisode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tracks, duration, micSettings, cleanupMethod, adReadEvents } = location.state || {};

  const [episodeTitle, setEpisodeTitle] = useState("");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!episodeTitle.trim() || !tracks) return;

    setIsSaving(true);

    const metadata: EpisodeMetadata = {
      title: episodeTitle,
      description: includeMetadata ? "Recorded in Seeksy Podcast Studio" : undefined,
      duration,
      tracks,
      cleanupMethod,
      recordingDate: new Date(),
    };

    try {
      const { episodeId } = await saveEpisode(metadata);

      // Get the audio URL from tracks
      const audioUrl = tracks?.[0]?.audioUrl || null;

      navigate("/podcast-studio/export", {
        state: {
          episodeId,
          episodeTitle,
          tracks,
          duration,
          cleanupMethod,
          adReadEvents,
          audioUrl,
        },
      });
    } catch (error) {
      console.error("Save failed:", error);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8 bg-white/95 backdrop-blur">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#053877] to-[#2C6BED] flex items-center justify-center">
              <Save className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#053877]">
                Save Episode
              </h2>
              <p className="text-sm text-muted-foreground">
                Add episode details and save your recording
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="episode-title">Episode Title *</Label>
              <Input
                id="episode-title"
                placeholder="Enter episode title..."
                value={episodeTitle}
                onChange={(e) => setEpisodeTitle(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
              <div className="text-sm font-medium">Recording Details</div>
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
                  {cleanupMethod || "None"}
                </div>
                <div>
                  <span className="font-medium text-foreground">Quality:</span> Studio
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="metadata"
                checked={includeMetadata}
                onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
              />
              <Label
                htmlFor="metadata"
                className="text-sm font-normal cursor-pointer"
              >
                Include recording metadata in export
              </Label>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={!episodeTitle.trim() || isSaving}
            className="w-full bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white h-12"
          >
            {isSaving ? "Saving..." : "Save & Continue"}
            {!isSaving && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SaveEpisode;
