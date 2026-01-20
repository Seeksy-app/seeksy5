import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Search, Bell, Tv, Radio, Scissors, 
  Star, TrendingUp, Sparkles, Film,
  Flame, Clock, Award, Play, ChevronRight, Podcast
} from "lucide-react";
import { TVFooter } from "@/components/tv/TVFooter";
import { TVHeroPlayer } from "@/components/tv/TVHeroPlayer";
import { TVContentRow } from "@/components/tv/TVContentRow";
import { TVCreatorCard } from "@/components/tv/TVCreatorCard";
import { PodcastEpisodesModal } from "@/components/tv/PodcastEpisodesModal";
import { useFeaturedPodcasts, FeaturedPodcast } from "@/hooks/useFeaturedPodcasts";
import americanWarriorsPoster from "@/assets/tv/american-warriors.png";
import personalBrandPoster from "@/assets/tv/poster-personal-brand.png";
import echoesOfMidnightPoster from "@/assets/tv/poster-echoes-midnight.png";
import meditationPoster from "@/assets/tv/poster-meditation.png";
import midnightEchoesLivePoster from "@/assets/tv/poster-midnight-echoes-live.png";
import fightNightPoster from "@/assets/tv/poster-fight-night.png";
import seeksyTVHeroBg from "@/assets/seeksy-tv-hero-bg.png";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";


const categories = [
  "All", "Podcasts", "Interviews", "AI Clips", "Events", "Live", 
  "Technology", "Business", "Health", "True Crime", "Design", "Entertainment"
];

// Demo content for placeholders - American Warriors is ALWAYS first and links to channel with all episodes
const demoThumbnails = [
  { id: "channel-american-warriors", title: "American Warriors", gradient: "from-blue-800 to-slate-900", imageUrl: americanWarriorsPoster, linkType: "channel", channelSlug: "american-warriors", priority: 1 },
  { id: "demo-2", title: "Building a Personal Brand", gradient: "from-blue-600 to-cyan-600", imageUrl: personalBrandPoster, linkType: "watch", priority: 10 },
  { id: "demo-3", title: "Echoes of Midnight", gradient: "from-green-600 to-teal-600", imageUrl: echoesOfMidnightPoster, linkType: "watch" },
  { id: "demo-4", title: "Meditation for Professionals", gradient: "from-orange-600 to-red-600", imageUrl: meditationPoster, linkType: "watch" },
  { id: "demo-5", title: "Midnight Echoes Live", gradient: "from-pink-600 to-purple-600", imageUrl: midnightEchoesLivePoster, linkType: "watch" },
  { id: "demo-6", title: "Fight Night Live", gradient: "from-gray-700 to-gray-900", imageUrl: fightNightPoster, linkType: "watch" },
  { id: "demo-7", title: "Startup Stories", gradient: "from-amber-600 to-orange-600", linkType: "watch" },
  { id: "demo-8", title: "Design Systems", gradient: "from-indigo-600 to-blue-600", linkType: "watch" },
  { id: "demo-9", title: "Health & Science", gradient: "from-teal-600 to-green-600", linkType: "watch" },
  { id: "demo-10", title: "Leadership", gradient: "from-red-600 to-pink-600", linkType: "watch" },
  { id: "demo-11", title: "Marketing Pro", gradient: "from-cyan-600 to-blue-600", linkType: "watch" },
  { id: "demo-12", title: "AI Frontiers", gradient: "from-violet-600 to-purple-600", linkType: "watch" },
];

const demoEpisodes = [
  { id: "ep-1", title: "The Future of AI in Creative Industries", category: "Technology", duration_seconds: 2732, view_count: 45200, channel: { name: "Tech Insider Daily" }, content_type: "episode" },
  { id: "ep-2", title: "Building a Personal Brand from Scratch", category: "Business", duration_seconds: 2415, view_count: 38100, channel: { name: "Business Unplugged" }, content_type: "episode" },
  { id: "ep-3", title: "Meditation for Busy Professionals", category: "Health", duration_seconds: 1845, view_count: 52300, channel: { name: "The Wellness Hour" }, content_type: "episode" },
  { id: "ep-4", title: "The Untold Story: Cold Case Files", category: "True Crime", duration_seconds: 3128, view_count: 67400, channel: { name: "True Crime Weekly" }, content_type: "episode" },
  { id: "ep-5", title: "Design Systems That Scale", category: "Design", duration_seconds: 2156, view_count: 29800, channel: { name: "Creative Studio" }, content_type: "episode" },
  { id: "ep-6", title: "Startup Founders Share Their Journey", category: "Business", duration_seconds: 2890, view_count: 41200, channel: { name: "Startup Stories" }, content_type: "episode" },
];

const demoClips = [
  { id: "clip-1", title: "This AI Tool Changed Everything", category: "Technology", duration_seconds: 58, view_count: 125000, channel: { name: "AI Frontiers" }, content_type: "clip" },
  { id: "clip-2", title: "The One Habit You Need for Success", category: "Self-Help", duration_seconds: 75, view_count: 89000, channel: { name: "Mindful Living" }, content_type: "clip" },
  { id: "clip-3", title: "Shocking Twist in the Investigation", category: "True Crime", duration_seconds: 45, view_count: 156000, channel: { name: "True Crime Weekly" }, content_type: "clip" },
  { id: "clip-4", title: "Design Hack You Have Never Seen", category: "Design", duration_seconds: 62, view_count: 78000, channel: { name: "Creative Studio" }, content_type: "clip" },
  { id: "clip-5", title: "The Secret to Morning Productivity", category: "Productivity", duration_seconds: 89, view_count: 92000, channel: { name: "The Wellness Hour" }, content_type: "clip" },
  { id: "clip-6", title: "What Nobody Tells You About Startups", category: "Business", duration_seconds: 67, view_count: 134000, channel: { name: "Startup Stories" }, content_type: "clip" },
];

const demoCreators = [
  { id: "ch-1", name: "Tech Insider Daily", slug: "tech-insider-daily", category: "Technology", follower_count: 245000, total_views: 1250000 },
  { id: "ch-2", name: "The Wellness Hour", slug: "the-wellness-hour", category: "Health", follower_count: 189000, total_views: 890000 },
  { id: "ch-3", name: "Business Unplugged", slug: "business-unplugged", category: "Business", follower_count: 312000, total_views: 1890000 },
  { id: "ch-4", name: "Creative Studio", slug: "creative-studio", category: "Design", follower_count: 156000, total_views: 670000 },
  { id: "ch-5", name: "True Crime Weekly", slug: "true-crime-weekly", category: "True Crime", follower_count: 428000, total_views: 2340000 },
  { id: "ch-6", name: "Startup Stories", slug: "startup-stories", category: "Business", follower_count: 198000, total_views: 920000 },
  { id: "ch-7", name: "AI Frontiers", slug: "ai-frontiers", category: "Technology", follower_count: 276000, total_views: 1450000 },
  { id: "ch-8", name: "Mindful Living", slug: "mindful-living", category: "Health", follower_count: 134000, total_views: 540000 },
];

export default function SeeksyTVHome() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [posterImages, setPosterImages] = useState<Record<string, string>>({});
  const [loadingPosters, setLoadingPosters] = useState<Set<string>>(new Set());

  // Generate posters on mount - generate ALL 12 thumbnails
  // NOTE: We don't cache base64 images in localStorage as they exceed quota limits
  useEffect(() => {
    const generatePosters = async () => {
      // Generate ALL posters for complete coverage (no caching - base64 is too large)
      for (const item of demoThumbnails) {
        // Skip items that already have a custom imageUrl or already generated
        if (item.imageUrl || posterImages[item.id]) continue;
        
        setLoadingPosters(prev => new Set(prev).add(item.id));
        
        try {
          const { data, error } = await supabase.functions.invoke('generate-poster', {
            body: { title: item.title, category: "Podcasting" }
          });

          if (!error && data?.imageUrl) {
            setPosterImages(prev => ({ ...prev, [item.id]: data.imageUrl }));
          }
        } catch (err) {
          console.error("Failed to generate poster:", err);
        } finally {
          setLoadingPosters(prev => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
        }
        
        // Rate limit delay
        await new Promise(r => setTimeout(r, 2500));
      }
    };

    generatePosters();
  }, []);

  interface FeaturedItem {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    video_url: string | null;
    category: string | null;
    channel_name: string;
    duration_seconds: number | null;
    is_live?: boolean;
  }

  // Fetch featured content for hero
  const { data: featuredContent } = useQuery({
    queryKey: ['tv-featured-content'],
    queryFn: async (): Promise<FeaturedItem[]> => {
      const { data, error } = await (supabase as any)
        .from('tv_content')
        .select('id, title, description, thumbnail_url, video_url, duration_seconds, category, channel:tv_channels(name)')
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return (data || []).map((item: any) => ({
        ...item,
        channel_name: item.channel?.name || "Seeksy Creator"
      }));
    }
  });

  // Fetch channels with videos
  const { data: channels } = useQuery({
    queryKey: ['tv-channels-with-videos'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('tv_channels')
        .select('*, videos:tv_content(id, title, thumbnail_url, duration_seconds, view_count)')
        .eq('is_active', true)
        .order('follower_count', { ascending: false })
        .limit(8);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch featured creators
  const { data: featuredCreators } = useQuery({
    queryKey: ['tv-featured-creators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_channels')
        .select('id, name, slug, avatar_url, follower_count, category')
        .eq('is_active', true)
        .order('follower_count', { ascending: false })
        .limit(8);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch latest episodes
  const { data: latestEpisodes } = useQuery({
    queryKey: ['tv-latest-episodes', selectedCategory],
    queryFn: async () => {
      let query = (supabase as any)
        .from('tv_content')
        .select('id, title, description, thumbnail_url, duration_seconds, view_count, category, content_type, channel:tv_channels(name, slug)')
        .eq('is_published', true)
        .in('content_type', ['episode', 'spotlight'])
        .order('published_at', { ascending: false })
        .limit(12);
      
      if (selectedCategory !== "All") {
        query = query.eq('category', selectedCategory);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch AI clips
  const { data: aiClips } = useQuery({
    queryKey: ['tv-ai-clips'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('tv_content')
        .select('id, title, thumbnail_url, duration_seconds, view_count, content_type, channel:tv_channels(name, slug)')
        .eq('is_published', true)
        .eq('content_type', 'clip')
        .order('view_count', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch trending (most viewed)
  const { data: trendingContent } = useQuery({
    queryKey: ['tv-trending'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('tv_content')
        .select('id, title, thumbnail_url, duration_seconds, view_count, content_type, category, channel:tv_channels(name, slug)')
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch trending creators
  const { data: trendingCreators } = useQuery({
    queryKey: ['tv-trending-creators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_channels')
        .select('id, name, slug, avatar_url, category, total_views, follower_count')
        .eq('is_active', true)
        .order('total_views', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Featured podcasts from CSV
  const { podcasts: featuredPodcasts, isLoading: podcastsLoading } = useFeaturedPodcasts(6);
  
  // Podcast modal state
  const [selectedPodcast, setSelectedPodcast] = useState<FeaturedPodcast | null>(null);
  const [podcastModalOpen, setPodcastModalOpen] = useState(false);

  // Use demo content when no real content exists
  const displayTrending = trendingContent?.length ? trendingContent : demoEpisodes;
  const displayEpisodes = latestEpisodes?.length ? latestEpisodes : demoEpisodes;
  const displayClips = aiClips?.length ? aiClips : demoClips;
  const displayCreators = featuredCreators?.length ? featuredCreators : demoCreators;
  const displayTrendingCreators = trendingCreators?.length ? trendingCreators : demoCreators.slice(0, 5);

  // Default featured content if none in DB
  const heroItems = featuredContent?.length ? featuredContent : [
    {
      id: "default",
      title: "Unlimited podcasts, shows, and more",
      description: "Watch creator content, podcasts, AI clips, and live streams. Start watching for free.",
      thumbnail_url: null,
      video_url: null,
      category: "Featured",
      channel_name: "Seeksy",
      duration_seconds: 0,
      is_live: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-gradient-to-b from-[#0a0a14] via-[#0a0a14]/95 to-transparent backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Tv className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                Seeksy TV
              </span>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-white font-medium hover:text-amber-400 transition-colors">Home</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Shows</a>
              <a href="#featured-podcasts" className="text-gray-400 hover:text-white transition-colors">Podcasts</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Clips</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Live</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">My List</a>
            </nav>

            {/* Search & Actions */}
            <div className="flex items-center gap-4">
              <div className="hidden md:block relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-amber-500 h-9"
                />
              </div>
              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                <Bell className="h-5 w-5" />
              </Button>
              <Button 
                variant="default" 
                className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Netflix-Style Hero with Mosaic Background */}
      <section className="relative w-full min-h-[85vh] overflow-hidden">
        {/* Hero Background Image - preloaded via link tag for faster loading */}
        <div className="absolute inset-0 bg-[#0a0a14]">
          <img 
            src={seeksyTVHeroBg} 
            alt="Seeksy TV Shows" 
            className="w-full h-full object-cover object-center"
            loading="eager"
            fetchPriority="high"
          />
          
          {/* Light gradient overlay - image is already dark */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-transparent to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 pt-40 pb-20 flex flex-col items-center justify-center min-h-[85vh] text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 drop-shadow-2xl leading-tight">
            Unlimited podcasts,
            <br />
            <span className="text-amber-400">shows, and more</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 mb-4 max-w-2xl">
            Watch anywhere. Create anything. Join the creator revolution.
          </p>
          
          <p className="text-base text-white/60 mb-8">
            Ready to watch? Enter your email to create or restart your membership.
          </p>

          {/* Email Signup */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl">
            <Input
              placeholder="Email address"
              className="h-14 bg-black/60 border-white/30 text-white placeholder:text-gray-400 text-lg px-6"
            />
            <Button 
              size="lg"
              className="h-14 bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg px-8 shadow-lg shadow-amber-500/30 whitespace-nowrap"
              onClick={() => navigate("/auth?mode=signup")}
            >
              Get Started
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="container mx-auto px-4 py-6 -mt-8 relative z-10">
        <ScrollArea className="w-full">
          <div className="flex gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className={
                  selectedCategory === category
                    ? "bg-amber-500 hover:bg-amber-600 text-white shrink-0 shadow-lg shadow-amber-500/30"
                    : "border-white/20 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white shrink-0"
                }
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      {/* Trending Now - Netflix Style with Big Numbers */}
      <section className="py-8">
        <div className="container mx-auto px-4 mb-4">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-white">
            <Flame className="h-6 w-6 text-amber-400" />
            Trending Now
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
          {/* Always show American Warriors first, then the rest */}
          {[
            demoThumbnails.find(d => d.id === "channel-american-warriors"),
            ...displayTrending.slice(0, 9)
          ].filter(Boolean).map((item: any, index) => {
            // For first item (American Warriors), use its own data; for others, use demoThumbnails
            const isAmericanWarriors = index === 0;
            const demoItem = isAmericanWarriors 
              ? demoThumbnails[0] 
              : demoThumbnails[(index) % demoThumbnails.length];
            const aiPosterUrl = posterImages[demoItem?.id];
            const posterLoading = loadingPosters.has(demoItem?.id);
            const staticImageUrl = demoItem?.imageUrl;
            
            const handleClick = () => {
              if (demoItem?.linkType === "channel" && demoItem?.channelSlug) {
                navigate(`/tv/channel/${demoItem.channelSlug}`);
              } else {
                // All demo items go to American Warriors channel since they don't have real content
                navigate(`/tv/channel/american-warriors`);
              }
            };
            
            return (
              <div 
                key={isAmericanWarriors ? 'american-warriors' : item.id}
                className="shrink-0 w-48 md:w-56 group relative cursor-pointer"
                onClick={handleClick}
              >
                {/* Big Rank Number */}
                <div className="absolute -left-4 bottom-0 z-10">
                  <span className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-white/5 leading-none drop-shadow-lg" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.3)' }}>
                    {index + 1}
                  </span>
                </div>
                
                {/* Thumbnail */}
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 ml-8 relative group-hover:scale-105 transition-transform duration-300">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : staticImageUrl ? (
                    <img src={staticImageUrl} alt={demoItem?.title || item.title} className="w-full h-full object-cover" />
                  ) : aiPosterUrl ? (
                    <img src={aiPosterUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${demoItem?.gradient || 'from-amber-600 to-orange-600'} flex items-end p-4 relative`}>
                      {posterLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-white/60 uppercase tracking-wider mb-1">{item.category}</p>
                        <h3 className="text-sm font-bold text-white line-clamp-2">{item.title}</h3>
                      </div>
                    </div>
                  )}
                  
                  {/* Hover Play */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
                      <Play className="h-5 w-5 text-white fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Podcasts */}
      <section id="featured-podcasts" className="py-8 scroll-mt-24">
        <div className="container mx-auto px-4 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-white">
              <Podcast className="h-6 w-6 text-amber-400" />
              Featured Podcasts
            </h2>
            <Button 
              variant="ghost" 
              className="text-amber-400 hover:text-amber-300 hover:bg-white/5"
              onClick={() => navigate("/tv/podcasts")}
            >
              See More <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
          {podcastsLoading ? (
            <div className="text-gray-400 text-sm">Loading podcasts...</div>
          ) : featuredPodcasts.length > 0 ? (
            featuredPodcasts.map((podcast) => (
              <div 
                key={podcast.id}
                className="shrink-0 w-48 group cursor-pointer"
                onClick={() => {
                  setSelectedPodcast(podcast);
                  setPodcastModalOpen(true);
                }}
              >
                <div className="aspect-square rounded-xl overflow-hidden ring-2 ring-transparent group-hover:ring-amber-500/50 transition-all shadow-lg">
                  {podcast.imageUrl ? (
                    <img 
                      src={podcast.imageUrl} 
                      alt={podcast.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/60 bg-gradient-to-br from-primary/20 to-primary/40">
                      {podcast.title.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="mt-3 font-semibold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                  {podcast.title}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-1">{podcast.author}</p>
              </div>
            ))
          ) : (
            displayCreators.map((creator) => (
              <TVCreatorCard
                key={creator.id}
                {...creator}
                onClick={() => navigate(`/tv/channel/${creator.slug || creator.id}`)}
                variant="featured"
              />
            ))
          )}
        </div>
      </section>

      {/* Podcast Episodes Modal */}
      <PodcastEpisodesModal
        open={podcastModalOpen}
        onOpenChange={setPodcastModalOpen}
        podcast={selectedPodcast}
      />

      {/* Latest Episodes */}
      <TVContentRow
        title="Latest Episodes"
        icon={Radio}
        items={displayEpisodes}
        onItemClick={(id) => navigate(`/tv/watch/${id}`)}
      />

      {/* AI Clips - Vertical Format */}
      <TVContentRow
        title="AI-Generated Clips"
        icon={Sparkles}
        items={displayClips}
        onItemClick={(id) => navigate(`/tv/clip/${id}`)}
        variant="portrait"
      />

      {/* Popular Channels Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-white">
            <Film className="h-6 w-6 text-amber-400" />
            Popular Channels
          </h2>
        </div>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(channels?.length ? channels : demoCreators).map((channel: any) => (
              <div
                key={channel.id}
                className="group rounded-xl overflow-hidden bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-amber-500/30"
                onClick={() => navigate(`/tv/channel/${channel.slug || channel.id}`)}
              >
                {/* Channel Videos Preview */}
                <div className="grid grid-cols-3 gap-0.5">
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className={`aspect-video bg-gradient-to-br ${demoThumbnails[(idx + parseInt(channel.id?.slice(-1) || '0')) % demoThumbnails.length]?.gradient || 'from-gray-700 to-gray-800'}`}>
                      {channel.videos?.[idx]?.thumbnail_url ? (
                        <img src={channel.videos[idx].thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tv className="h-4 w-4 text-white/30" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Channel Info */}
                <div className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold shrink-0 ring-2 ring-transparent group-hover:ring-amber-500/50 transition-all">
                    {channel.name?.charAt(0) || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors truncate">
                      {channel.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {channel.videos?.length || Math.floor(Math.random() * 20) + 5} videos
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Creators */}
      <section className="py-8 mb-8">
        <div className="container mx-auto px-4 mb-4">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-white">
            <TrendingUp className="h-6 w-6 text-amber-400" />
            Trending This Week
          </h2>
        </div>
        <div className="container mx-auto px-4 space-y-3">
          {displayTrendingCreators.map((creator, index) => (
            <TVCreatorCard
              key={creator.id}
              {...creator}
              onClick={() => navigate(`/tv/channel/${creator.slug || creator.id}`)}
              variant="compact"
              rank={index + 1}
            />
          ))}
        </div>
      </section>

      <TVFooter />
    </div>
  );
}
