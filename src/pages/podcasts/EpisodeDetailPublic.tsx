import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock, Radio, Shield, Waves, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SubmitToAwardsDialog } from "@/components/episode/SubmitToAwardsDialog";
import { useState } from "react";

const EpisodeDetailPublic = () => {
  const { podcastId, episodeId } = useParams();
  const navigate = useNavigate();
  const [showAwardsDialog, setShowAwardsDialog] = useState(false);

  const { data: episode, isLoading } = useQuery({
    queryKey: ["episode", episodeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("id", episodeId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Ad reads are stored in episode metadata for now
  const adReads = (episode as any)?.ad_reads || [];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="h-64 animate-pulse bg-muted/20" />
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Episode Not Found</h2>
          <p className="text-muted-foreground mb-4">
            This episode doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => navigate(`/podcasts/${podcastId}`)}>
            Back to Podcast
          </Button>
        </Card>
      </div>
    );
  }

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

        {/* Episode Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{episode.title}</CardTitle>
                <CardDescription>
                  {episode.description || "No description provided"}
                </CardDescription>
              </div>
              <Badge variant={episode.is_published ? "default" : "secondary"}>
                {episode.is_published ? "Published" : "Draft"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {episode.publish_date && (
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    Publish Date
                  </div>
                  <div className="font-medium">{formatDate(episode.publish_date)}</div>
                </div>
              )}
              {episode.duration_seconds && (
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    Duration
                  </div>
                  <div className="font-medium">{formatDuration(episode.duration_seconds)}</div>
                </div>
              )}
              {(episode as any).track_count && (
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <Waves className="w-4 h-4" />
                    Tracks
                  </div>
                  <div className="font-medium">{(episode as any).track_count} track(s)</div>
                </div>
              )}
              {(episode as any).cleanup_method && (
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <Shield className="w-4 h-4" />
                    Cleanup
                  </div>
                  <div className="font-medium capitalize">{(episode as any).cleanup_method}</div>
                </div>
              )}
            </div>

            {episode.episode_number && (
              <div className="mt-4 flex gap-2 text-sm">
                {episode.season_number && (
                  <Badge variant="outline">Season {episode.season_number}</Badge>
                )}
                <Badge variant="outline">Episode {episode.episode_number}</Badge>
                {episode.episode_type && episode.episode_type !== "full" && (
                  <Badge variant="outline" className="capitalize">{episode.episode_type}</Badge>
                )}
                {episode.is_explicit && (
                  <Badge variant="destructive">Explicit</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mb-6 flex gap-2">
          <Button
            onClick={() => setShowAwardsDialog(true)}
            variant="outline"
            className="flex-1"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Submit to Awards
          </Button>
        </div>
        {adReads && adReads.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ad Reads in This Episode</CardTitle>
              <CardDescription>
                {adReads.length} ad read{adReads.length !== 1 ? 's' : ''} marked during recording
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {adReads.map((adRead: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{adRead.brandName}</div>
                        <div className="text-sm text-muted-foreground">{adRead.scriptTitle}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(adRead.timestamp)}
                      </div>
                      {adRead.duration && (
                        <div>{adRead.duration}s</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audio Player - Coming Soon */}
        {episode.audio_url && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Audio Player</CardTitle>
              <CardDescription>
                Listen to this episode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-8 text-center">
                <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Audio player integration coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Awards Submission Dialog */}
      {episode && (
        <SubmitToAwardsDialog
          open={showAwardsDialog}
          onOpenChange={setShowAwardsDialog}
          episode={{
            id: episode.id,
            title: episode.title,
            description: episode.description || undefined,
            audio_url: episode.audio_url || undefined,
            podcast_id: podcastId!,
          }}
        />
      )}
    </div>
  );
};

export default EpisodeDetailPublic;
