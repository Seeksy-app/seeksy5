import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Play, Search, ArrowLeft, Sparkles, TrendingUp,
  Tv, Clock, Heart, Share2
} from "lucide-react";
import { TVFooter } from "@/components/tv/TVFooter";

// Mock clips data
const featuredClips = [
  { id: "1", title: "The AI Moment That Changed Everything", creator: "The Daily Tech", duration: "0:58", thumbnail: "/placeholder.svg", views: "245K", likes: "18K" },
  { id: "2", title: "This One Habit Changed My Life", creator: "Health & Wellness", duration: "1:15", thumbnail: "/placeholder.svg", views: "189K", likes: "14K" },
  { id: "3", title: "The Suspect's Confession", creator: "True Crime Weekly", duration: "0:45", thumbnail: "/placeholder.svg", views: "312K", likes: "28K" },
];

const trendingClips = [
  { id: "4", title: "Design Hack in 60 Seconds", creator: "Creative Minds", duration: "1:00", thumbnail: "/placeholder.svg", views: "128K", likes: "9.2K" },
  { id: "5", title: "Why GPT-5 Matters", creator: "The Daily Tech", duration: "0:52", thumbnail: "/placeholder.svg", views: "98K", likes: "7.5K" },
  { id: "6", title: "The Secret to Morning Productivity", creator: "Business Insider Pod", duration: "1:05", thumbnail: "/placeholder.svg", views: "76K", likes: "5.8K" },
  { id: "7", title: "Plot Twist You Won't Believe", creator: "True Crime Weekly", duration: "0:38", thumbnail: "/placeholder.svg", views: "156K", likes: "12K" },
  { id: "8", title: "5 Minute Workout Challenge", creator: "Health & Wellness", duration: "1:12", thumbnail: "/placeholder.svg", views: "89K", likes: "6.4K" },
];

const recentClips = [
  { id: "9", title: "Tech Prediction That Came True", creator: "The Daily Tech", duration: "0:48", thumbnail: "/placeholder.svg", views: "34K", likes: "2.1K" },
  { id: "10", title: "Logo Design Tips", creator: "Creative Minds", duration: "1:08", thumbnail: "/placeholder.svg", views: "28K", likes: "1.8K" },
  { id: "11", title: "Startup Advice in 60 Seconds", creator: "Business Insider Pod", duration: "0:55", thumbnail: "/placeholder.svg", views: "42K", likes: "3.2K" },
  { id: "12", title: "True Story of the Heist", creator: "True Crime Weekly", duration: "1:20", thumbnail: "/placeholder.svg", views: "67K", likes: "5.1K" },
  { id: "13", title: "Breathing Exercise for Stress", creator: "Health & Wellness", duration: "0:42", thumbnail: "/placeholder.svg", views: "51K", likes: "4.2K" },
  { id: "14", title: "Apple's Secret Project", creator: "The Daily Tech", duration: "0:58", thumbnail: "/placeholder.svg", views: "78K", likes: "5.9K" },
  { id: "15", title: "Color Psychology in Branding", creator: "Creative Minds", duration: "1:05", thumbnail: "/placeholder.svg", views: "32K", likes: "2.4K" },
  { id: "16", title: "Investment Mistakes to Avoid", creator: "Business Insider Pod", duration: "0:50", thumbnail: "/placeholder.svg", views: "45K", likes: "3.6K" },
];

const categories = ["All", "Technology", "Business", "Health", "Design", "True Crime", "Entertainment", "Comedy"];

export default function SeeksyTVClips() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const ClipCard = ({ clip, featured = false }: { clip: typeof featuredClips[0], featured?: boolean }) => (
    <div
      className={`shrink-0 ${featured ? 'w-56' : 'w-44'} group cursor-pointer`}
      onClick={() => navigate(`/tv/clip/${clip.id}`)}
    >
      <div className="relative aspect-[9/16] rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-purple-900 to-pink-900">
        <img src={clip.thumbnail} alt="" className="w-full h-full object-cover" />
        
        {/* AI Clip Badge */}
        <div className="absolute top-2 left-2">
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
            <Sparkles className="h-3 w-3 mr-1" /> AI Clip
          </Badge>
        </div>
        
        {/* Duration */}
        <div className="absolute bottom-2 right-2">
          <Badge variant="secondary" className="bg-black/70 text-white text-xs">
            {clip.duration}
          </Badge>
        </div>
        
        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <div className={`${featured ? 'w-16 h-16' : 'w-12 h-12'} rounded-full bg-amber-500/90 flex items-center justify-center`}>
            <Play className={`${featured ? 'h-7 w-7' : 'h-5 w-5'} text-white fill-current ml-0.5`} />
          </div>
        </div>

        {/* Stats Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-between text-xs text-white/80">
            <span>{clip.views}</span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" /> {clip.likes}
            </span>
          </div>
        </div>
      </div>
      <h3 className={`${featured ? 'font-semibold text-sm' : 'font-medium text-xs'} group-hover:text-amber-400 transition-colors line-clamp-2`}>
        {clip.title}
      </h3>
      <p className="text-xs text-gray-400 mt-1">{clip.creator}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex flex-col">
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
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/tv")}>
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                  <Tv className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-amber-400">Seeksy TV</span>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search clips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
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

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI-Generated Clips</h1>
            <p className="text-gray-400">Short-form content created by AI from full episodes</p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <ScrollArea className="w-full">
            <div className="flex gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  className={
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shrink-0"
                      : "border-white/20 text-gray-300 hover:text-white hover:bg-white/10 shrink-0"
                  }
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Featured Clips */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl font-bold">Featured Clips</h2>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {featuredClips.map((clip) => (
                <ClipCard key={clip.id} clip={clip} featured />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        {/* Trending Clips */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl font-bold">Trending This Week</h2>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {trendingClips.map((clip) => (
                <ClipCard key={clip.id} clip={clip} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        {/* Recent Clips Grid */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl font-bold">Recent Clips</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {recentClips.map((clip) => (
              <ClipCard key={clip.id} clip={clip} />
            ))}
          </div>
        </section>
      </main>

      <TVFooter />
    </div>
  );
}
