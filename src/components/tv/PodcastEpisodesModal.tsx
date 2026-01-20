import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Calendar, ExternalLink, Heart, Loader2, X } from "lucide-react";
import { format } from "date-fns";

interface Episode {
  title: string;
  description: string;
  pubDate: string;
  audioUrl?: string;
  duration?: string;
}

interface PodcastEpisodesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  podcast: {
    title: string;
    author: string;
    imageUrl: string;
    websiteUrl: string;
    rssUrl: string;
  } | null;
}

export function PodcastEpisodesModal({ 
  open, 
  onOpenChange, 
  podcast 
}: PodcastEpisodesModalProps) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && podcast?.rssUrl) {
      fetchEpisodes(podcast.rssUrl);
    }
  }, [open, podcast?.rssUrl]);

  const fetchEpisodes = async (rssUrl: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use a CORS proxy or RSS parser service
      const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.status === "ok" && data.items) {
        setEpisodes(data.items.slice(0, 20).map((item: any) => ({
          title: item.title,
          description: item.description?.replace(/<[^>]*>/g, "").slice(0, 200) || "",
          pubDate: item.pubDate,
          audioUrl: item.enclosure?.link,
          duration: item.itunes?.duration,
        })));
      } else {
        setError("Unable to load episodes");
      }
    } catch (err) {
      console.error("Error fetching RSS:", err);
      setError("Unable to load episodes");
    } finally {
      setIsLoading(false);
    }
  };

  if (!podcast) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1a24] border-white/10 text-white max-h-[85vh] p-0 overflow-hidden">
        {/* Header with podcast info */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start gap-4">
            <img 
              src={podcast.imageUrl} 
              alt={podcast.title}
              className="w-20 h-20 rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold text-white mb-1">
                {podcast.title}
              </DialogTitle>
              <p className="text-gray-400 text-sm mb-3">by {podcast.author}</p>
              {/* Buttons removed per request */}
            </div>
          </div>
        </div>

        {/* Episodes list */}
        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-gray-400">
                <p>{error}</p>
                <p className="text-sm mt-2">Try visiting the website directly</p>
              </div>
            ) : episodes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No episodes found
              </div>
            ) : (
              episodes.map((episode, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                  onClick={() => episode.audioUrl && window.open(episode.audioUrl, "_blank")}
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                    <Play className="h-4 w-4 text-white group-hover:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {episode.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Calendar className="h-3 w-3" />
                      {episode.pubDate ? format(new Date(episode.pubDate), "MMM d, yyyy") : "Unknown date"}
                    </div>
                    <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                      {episode.description || "No description available"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
