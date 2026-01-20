import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Clock, Waves } from "lucide-react";

interface AdReadEvent {
  timestamp: number;
  scriptId: string;
  brandName: string;
  scriptTitle: string;
  duration: number;
}

const NewEpisodeFromStudio = () => {
  const { podcastId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get pre-filled data from studio export
  const studioData = location.state || {};
  const {
    episodeId: studioEpisodeId,
    audioUrl,
    title: initialTitle,
    duration,
    recordingDate,
    cleanupMethod,
    tracks,
    adReadEvents = [],
  } = studioData;

  const [title, setTitle] = useState(initialTitle || "");
  const [description, setDescription] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [seasonNumber, setSeasonNumber] = useState("");
  const [episodeType, setEpisodeType] = useState("full");
  const [isExplicit, setIsExplicit] = useState(false);
  const [publishOption, setPublishOption] = useState("unpublished");
  const [scheduledDate, setScheduledDate] = useState("");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: podcast } = useQuery({
    queryKey: ["podcast", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("id", podcastId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const saveEpisode = useMutation({
    mutationFn: async () => {
      if (!user || !audioUrl) {
        throw new Error("Missing required data");
      }

      // Determine published status and publish date
      const isPublished = publishOption === 'immediate';
      const publishDate = publishOption === 'scheduled' && scheduledDate 
        ? scheduledDate 
        : new Date().toISOString();

      const episodeData: any = {
        podcast_id: podcastId,
        title,
        description,
        audio_url: audioUrl,
        episode_number: episodeNumber ? parseInt(episodeNumber) : null,
        season_number: seasonNumber ? parseInt(seasonNumber) : null,
        episode_type: episodeType,
        is_explicit: isExplicit,
        duration_seconds: duration || null,
        is_published: isPublished,
        publish_date: publishDate,
        // Store studio metadata in JSON for now
        studio_metadata: {
          studio_episode_id: studioEpisodeId,
          cleanup_method: cleanupMethod,
          recording_date: recordingDate,
          track_count: tracks?.length || 1,
        },
        // Store ad reads in episode metadata
        ad_reads: adReadEvents,
      };

      // Create episode record
      const { data, error } = await supabase
        .from("episodes")
        .insert(episodeData)
        .select()
        .single();

      if (error) throw error;

      // Track revenue if episode is published
      if (isPublished && data) {
        try {
          // Calculate impressions (mock for now)
          const baseImpressions = 1000;
          const episodeAge = 0; // New episode
          const impressions = Math.round(baseImpressions * 1.5); // New episode bonus
          
          // Track revenue via edge function
          await supabase.functions.invoke('track-episode-revenue', {
            body: {
              episodeId: data.id,
              podcastId: data.podcast_id,
              userId: user.id,
              impressions,
              adReadCount: adReadEvents.length,
              adReadEvents,
              duration: duration || 0,
              isCertifiedVoice: false, // TODO: Check if user has certified voice
            },
          });
          
          console.log('Revenue tracking initiated for episode:', data.id);
        } catch (revenueError) {
          console.error('Revenue tracking error (non-blocking):', revenueError);
          // Don't fail episode creation if revenue tracking fails
        }
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success("Episode draft saved successfully!");
      navigate(`/podcasts/${podcastId}/episodes/${data.id}`);
    },
    onError: (error) => {
      console.error("Episode save error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to save episode: ${errorMessage}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter an episode title");
      return;
    }
    saveEpisode.mutate();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(`/podcasts/${podcastId}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Podcast
        </Button>

        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-primary" />
              Episode from Studio Recording
            </CardTitle>
            <CardDescription>
              This episode was created from your Podcast Studio recording
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Duration</div>
                <div className="font-medium">{duration ? formatDuration(duration) : "N/A"}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Tracks</div>
                <div className="font-medium">{tracks?.length || 1} track(s)</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Cleanup</div>
                <div className="font-medium capitalize">{cleanupMethod || "None"}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Ad Reads</div>
                <div className="font-medium">{adReadEvents.length} marked</div>
              </div>
            </div>

            {adReadEvents.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <Label className="text-sm font-medium mb-2 block">Ad Reads in This Episode</Label>
                <div className="space-y-2">
                  {adReadEvents.map((adRead: AdReadEvent, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-background/50 rounded border border-border"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{adRead.brandName}</div>
                        <div className="text-xs text-muted-foreground">{adRead.scriptTitle}</div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(adRead.timestamp)}
                        </div>
                        <div>{adRead.duration}s</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Episode Details */}
          <Card>
            <CardHeader>
              <CardTitle>Episode Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Episode Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled Episode"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Episode Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="One or two sentences that describe your episode."
                  rows={5}
                  maxLength={3500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {description.length > 0 && `${3500 - description.length} Characters Remaining`}
                </p>
              </div>

              {/* Season & Episode Numbers */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="seasonNumber">Season #</Label>
                  <Input
                    id="seasonNumber"
                    type="number"
                    value={seasonNumber}
                    onChange={(e) => setSeasonNumber(e.target.value)}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="episodeNumber">Episode #</Label>
                  <Input
                    id="episodeNumber"
                    type="number"
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(e.target.value)}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="episodeType">Type</Label>
                  <Select value={episodeType} onValueChange={setEpisodeType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full</SelectItem>
                      <SelectItem value="trailer">Trailer</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Explicit Content */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="explicit"
                  checked={isExplicit}
                  onChange={(e) => setIsExplicit(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="explicit" className="cursor-pointer">
                  This episode contains explicit material.
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Publishing Options */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing Options</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={publishOption} onValueChange={setPublishOption}>
                <div className="flex items-center space-x-2 mb-3">
                  <RadioGroupItem value="unpublished" id="unpublished" />
                  <Label htmlFor="unpublished" className="cursor-pointer">
                    Save as unpublished draft
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mb-3">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <Label htmlFor="immediate" className="cursor-pointer">
                    Publish immediately
                  </Label>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="scheduled" id="scheduled" />
                    <Label htmlFor="scheduled" className="cursor-pointer">
                      Schedule for later
                    </Label>
                  </div>
                  {publishOption === 'scheduled' && (
                    <Input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="ml-6"
                    />
                  )}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/podcasts/${podcastId}`)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveEpisode.isPending || !title.trim()}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveEpisode.isPending ? "Saving..." : "Save Episode"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewEpisodeFromStudio;
