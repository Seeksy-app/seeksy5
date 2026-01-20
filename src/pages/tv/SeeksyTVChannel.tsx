import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Play, Bell, Share2, Users, Radio, Scissors, Video,
  Calendar, ArrowLeft, ExternalLink, Twitter, Instagram, Loader2
} from "lucide-react";
import { Tv } from "lucide-react";
import { TVFooter } from "@/components/tv/TVFooter";
import americanWarriorsLogo from "@/assets/american-warriors-logo.png";
import awAvatar from "@/assets/aw-avatar.png";
import awHero from "@/assets/aw-hero.png";

export default function SeeksyTVChannel() {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);

  // Fetch channel by slug
  const { data: channel, isLoading: channelLoading } = useQuery({
    queryKey: ['tv-channel', channelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_channels')
        .select('*')
        .eq('slug', channelId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!channelId
  });

  // Fetch videos for this channel
  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['tv-channel-videos', channel?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_content')
        .select('*')
        .eq('channel_id', channel!.id)
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!channel?.id
  });

  if (channelLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-[#0a0a14] text-white flex flex-col items-center justify-center">
        <Tv className="h-16 w-16 text-gray-600 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Channel Not Found</h1>
        <p className="text-gray-400 mb-4">The channel you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/tv')} variant="outline" className="border-white/20 text-white hover:bg-white/10">
          Back to Seeksy TV
        </Button>
      </div>
    );
  }

  const socialLinks = (channel.social_links as Record<string, string>) || {};
  
  // Check if this is American Warriors channel for custom styling
  const isAmericanWarriors = channelId === "american-warriors" || channel.slug === "american-warriors";
  const avatarImage = isAmericanWarriors ? awAvatar : channel.avatar_url;
  const heroImage = isAmericanWarriors ? awHero : channel.cover_url;

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
            <Button 
              variant="default" 
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Cover Image / Backdrop */}
      <div className="relative h-64 md:h-80">
        <div className={`absolute inset-0 ${isAmericanWarriors ? 'bg-gradient-to-r from-[#1a3a5c] via-[#2d5a87] to-[#053877]' : 'bg-gradient-to-r from-[#053877] to-[#2C6BED]'}`}>
          {heroImage ? (
            <img src={heroImage} alt="" className="w-full h-full object-cover" />
          ) : null}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-[#0a0a14]/50 to-transparent" />
      </div>

      {/* Creator Info */}
      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-[#0a0a14] bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              {avatarImage ? (
                <img src={avatarImage} alt={channel.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-bold text-white">{channel.name.charAt(0)}</span>
              )}
            </div>
            {channel.is_verified && (
              <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white">
                ✓ Verified
              </Badge>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold">{channel.name}</h1>
                <p className="text-gray-400">@{channel.slug}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={isFollowing 
                    ? "bg-white/10 hover:bg-white/20 text-white" 
                    : "bg-amber-500 hover:bg-amber-600 text-white"
                  }
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
                <Button variant="outline" size="icon" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {channel.description && (
              <p className="text-gray-300 mb-4 max-w-2xl">{channel.description}</p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="font-bold text-white">{channel.follower_count?.toLocaleString() || 0}</span>
                <span className="text-gray-400 ml-1">Followers</span>
              </div>
              <div>
                <span className="font-bold text-white">{channel.total_views?.toLocaleString() || 0}</span>
                <span className="text-gray-400 ml-1">Total Views</span>
              </div>
              <div>
                <span className="font-bold text-white">{videos?.length || 0}</span>
                <span className="text-gray-400 ml-1">Videos</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-4">
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {socialLinks.website && (
                <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <ExternalLink className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="episodes" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 p-1">
            <TabsTrigger value="episodes" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <Radio className="h-4 w-4 mr-2" />
              Videos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="episodes" className="mt-6">
            {videosLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : videos && videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/tv/watch/${video.id}`)}
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-gray-800 to-gray-900">
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tv className="h-12 w-12 text-gray-600" />
                        </div>
                      )}
                      {video.duration_seconds && (
                        <div className="absolute bottom-2 right-2">
                          <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                            {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
                          </Badge>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <div className="w-14 h-14 rounded-full bg-amber-500/90 flex items-center justify-center">
                          <Play className="h-6 w-6 text-white fill-current ml-1" />
                        </div>
                      </div>
                    </div>
                    <h3 className="font-semibold group-hover:text-amber-400 transition-colors line-clamp-2 mb-1">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-400">{video.view_count || 0} views</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Tv className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold">No videos yet</h3>
                <p className="text-gray-400">This channel hasn't published any videos yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <TVFooter />
    </div>
  );
}