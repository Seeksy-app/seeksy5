import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Search, Tv, Podcast, Bell
} from "lucide-react";
import { TVFooter } from "@/components/tv/TVFooter";
import { PodcastEpisodesModal } from "@/components/tv/PodcastEpisodesModal";
import { useFeaturedPodcasts, FeaturedPodcast } from "@/hooks/useFeaturedPodcasts";

export default function SeeksyTVPodcasts() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPodcast, setSelectedPodcast] = useState<FeaturedPodcast | null>(null);
  const [podcastModalOpen, setPodcastModalOpen] = useState(false);

  // Get all podcasts from CSV
  const { podcasts, isLoading } = useFeaturedPodcasts(100);

  // Filter podcasts by search
  const filteredPodcasts = podcasts.filter(podcast =>
    podcast.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    podcast.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a14]/95 backdrop-blur border-b border-white/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/tv")}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                  <Tv className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-amber-400">Seeksy TV</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:block relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search podcasts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-amber-500 h-9"
                />
              </div>
              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-white/10">
                <Bell className="h-5 w-5" />
              </Button>
              <Button 
                variant="default" 
                className="bg-amber-500 hover:bg-amber-600 text-white font-medium"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Podcast className="h-8 w-8 text-amber-400" />
          <h1 className="text-3xl font-bold">All Podcasts</h1>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search podcasts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-amber-500"
          />
        </div>

        {/* Podcasts Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPodcasts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredPodcasts.map((podcast) => (
              <div 
                key={podcast.id}
                className="group cursor-pointer"
                onClick={() => {
                  setSelectedPodcast(podcast);
                  setPodcastModalOpen(true);
                }}
              >
                <div className="aspect-square rounded-xl overflow-hidden ring-2 ring-transparent group-hover:ring-amber-500/50 transition-all shadow-lg mb-3">
                  {podcast.imageUrl ? (
                    <img 
                      src={podcast.imageUrl} 
                      alt={podcast.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/60 bg-gradient-to-br from-amber-600/40 to-orange-600/40">
                      {podcast.title.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors line-clamp-2 mb-1">
                  {podcast.title}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-1">{podcast.author}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Podcast className="h-12 w-12 mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold">No podcasts found</h3>
            <p className="text-gray-400">Try a different search term.</p>
          </div>
        )}
      </div>

      {/* Podcast Episodes Modal */}
      <PodcastEpisodesModal
        podcast={selectedPodcast}
        open={podcastModalOpen}
        onOpenChange={setPodcastModalOpen}
      />

      <TVFooter />
    </div>
  );
}
