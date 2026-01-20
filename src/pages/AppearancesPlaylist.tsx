import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Youtube,
  Music2,
  ExternalLink,
  Share2,
  Copy,
  Calendar,
  Mic2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface PlaylistAppearance {
  id: string;
  title: string;
  show_name: string | null;
  platform: string;
  external_url: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
}

interface PlaylistData {
  name: string;
  description: string;
  appearances: PlaylistAppearance[];
}

export default function AppearancesPlaylist() {
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null);

  useEffect(() => {
    const data = localStorage.getItem("guest_appearances_playlist");
    if (data) {
      setPlaylist(JSON.parse(data));
    }
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "youtube": return <Youtube className="h-5 w-5 text-red-500" />;
      case "spotify": return <Music2 className="h-5 w-5 text-green-500" />;
      default: return <Mic2 className="h-5 w-5" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "youtube": return "bg-red-500/10 text-red-600 border-red-500/30";
      case "spotify": return "bg-green-500/10 text-green-600 border-green-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (!playlist) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-muted-foreground mb-4">No playlist found</p>
        <Button variant="outline" onClick={() => navigate("/my-appearances")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Scanner
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/my-appearances")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {playlist.description}
            </p>
          )}
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant="secondary" className="text-sm">
              {playlist.appearances.length} Episode{playlist.appearances.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>

        {/* Episodes Grid */}
        <div className="grid gap-4">
          {playlist.appearances.map((appearance, index) => (
            <Card 
              key={appearance.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow group"
            >
              <CardContent className="p-0">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  {appearance.thumbnail_url ? (
                    <div className="relative w-48 h-28 flex-shrink-0">
                      <img
                        src={appearance.thumbnail_url}
                        alt={appearance.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge className={`${getPlatformColor(appearance.platform)} border`}>
                          {getPlatformIcon(appearance.platform)}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="w-48 h-28 bg-muted flex items-center justify-center flex-shrink-0">
                      {getPlatformIcon(appearance.platform)}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 py-4 pr-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                          {appearance.title}
                        </h3>
                        {appearance.show_name && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {appearance.show_name}
                          </p>
                        )}
                        {appearance.published_at && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(appearance.published_at), "MMMM d, yyyy")}
                          </p>
                        )}
                      </div>

                      {appearance.external_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 flex-shrink-0"
                          asChild
                        >
                          <a 
                            href={appearance.external_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Listen
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 py-8 border-t">
          <p className="text-sm text-muted-foreground">
            Created with <span className="font-semibold text-primary">Seeksy</span> Guest Appearance Scanner
          </p>
        </div>
      </div>
    </div>
  );
}