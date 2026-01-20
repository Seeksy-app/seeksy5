import { useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Music, Clock, Wand2, Mic2, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AdReadEvent {
  timestamp: number;
  adScriptId: string;
  adScriptTitle: string;
  duration: number;
}

const EpisodeDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Get episode data from navigation state
  const episodeData = location.state || {};
  const {
    episodeTitle = "Untitled Episode",
    duration = 0,
    tracks = [],
    cleanupMethod = "basic",
    recordingDate = new Date(),
    adReadEvents = []
  } = episodeData;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Episode Info Card */}
        <Card className="bg-white/95 backdrop-blur p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-[#053877] mb-2">
                {episodeTitle}
              </h1>
              <p className="text-sm text-muted-foreground">
                Episode ID: {id}
              </p>
            </div>

            {/* Episode Metadata Grid */}
            <div className="grid grid-cols-2 gap-6 py-6 border-t border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2C6BED]/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-[#2C6BED]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-semibold text-[#053877]">{formatTime(duration)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2C6BED]/10 flex items-center justify-center">
                  <Mic2 className="h-5 w-5 text-[#2C6BED]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Audio Tracks</p>
                  <p className="font-semibold text-[#053877]">{tracks.length} tracks</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2C6BED]/10 flex items-center justify-center">
                  <Wand2 className="h-5 w-5 text-[#2C6BED]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cleanup Method</p>
                  <p className="font-semibold text-[#053877] capitalize">{cleanupMethod}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2C6BED]/10 flex items-center justify-center">
                  <Music className="h-5 w-5 text-[#2C6BED]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Recording Date</p>
                  <p className="font-semibold text-[#053877] text-sm">
                    {formatDate(recordingDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Ad Read Events Section */}
            {adReadEvents.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-[#2C6BED]" />
                  <h2 className="text-xl font-bold text-[#053877]">
                    Ad Reads ({adReadEvents.length})
                  </h2>
                </div>

                <div className="space-y-3">
                  {adReadEvents.map((adRead: AdReadEvent, index: number) => (
                    <Card key={index} className="p-4 bg-muted/30 border border-border">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-[#053877]">
                            {adRead.adScriptTitle}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Script ID: {adRead.adScriptId}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-semibold text-[#2C6BED]">
                            {formatTime(adRead.timestamp)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {adRead.duration}s read
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {adReadEvents.length === 0 && (
              <div className="text-center py-8 border-t border-border">
                <Tag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No ad reads were logged for this episode
                </p>
              </div>
            )}

            {/* Multitrack Info */}
            {tracks.length > 0 && (
              <div className="space-y-3 pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-[#053877]">Audio Tracks</h3>
                <div className="space-y-2">
                  {tracks.map((track: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#2C6BED] flex items-center justify-center text-white text-sm font-semibold">
                          {index + 1}
                        </div>
                        <span className="font-medium text-[#053877]">
                          {track.participantName}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {track.participantId}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EpisodeDetails;
