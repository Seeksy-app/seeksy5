import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Play, Search, ArrowLeft, TrendingUp, Flame,
  Tv, Clock, Star, BarChart3
} from "lucide-react";
import { TVFooter } from "@/components/tv/TVFooter";

// Mock trending data
const trendingContent = [
  { id: "1", rank: 1, title: "The AI Revolution Has Arrived", creator: "The Daily Tech", type: "episode", category: "Technology", duration: "52:18", thumbnail: "/placeholder.svg", views: "156K", growth: "+342%", trend: "up" },
  { id: "2", rank: 2, title: "The Confession That Changed Everything", creator: "True Crime Weekly", type: "clip", category: "True Crime", duration: "1:15", thumbnail: "/placeholder.svg", views: "312K", growth: "+285%", trend: "up" },
  { id: "3", rank: 3, title: "2025 Investment Strategies", creator: "Business Insider Pod", type: "episode", category: "Business", duration: "45:32", thumbnail: "/placeholder.svg", views: "89K", growth: "+198%", trend: "up" },
  { id: "4", rank: 4, title: "Morning Meditation Guide", creator: "Health & Wellness", type: "episode", category: "Health", duration: "22:15", thumbnail: "/placeholder.svg", views: "67K", growth: "+156%", trend: "up" },
  { id: "5", rank: 5, title: "Design Trends for 2025", creator: "Creative Minds", type: "episode", category: "Design", duration: "38:45", thumbnail: "/placeholder.svg", views: "45K", growth: "+134%", trend: "up" },
  { id: "6", rank: 6, title: "The Missing Evidence", creator: "True Crime Weekly", type: "episode", category: "True Crime", duration: "1:05:30", thumbnail: "/placeholder.svg", views: "128K", growth: "+98%", trend: "same" },
  { id: "7", rank: 7, title: "Startup Funding 101", creator: "Business Insider Pod", type: "episode", category: "Business", duration: "48:30", thumbnail: "/placeholder.svg", views: "56K", growth: "+87%", trend: "up" },
  { id: "8", rank: 8, title: "Quick Workout Challenge", creator: "Health & Wellness", type: "clip", category: "Health", duration: "0:58", thumbnail: "/placeholder.svg", views: "234K", growth: "+76%", trend: "down" },
  { id: "9", rank: 9, title: "Apple's Secret Project Revealed", creator: "The Daily Tech", type: "episode", category: "Technology", duration: "35:20", thumbnail: "/placeholder.svg", views: "78K", growth: "+65%", trend: "up" },
  { id: "10", rank: 10, title: "Color Theory Masterclass", creator: "Creative Minds", type: "episode", category: "Design", duration: "42:15", thumbnail: "/placeholder.svg", views: "32K", growth: "+54%", trend: "same" },
];

const trendingCreators = [
  { id: "1", name: "The Daily Tech", avatar: "/placeholder.svg", followers: "125K", growth: "+15K this week", category: "Technology" },
  { id: "2", name: "True Crime Weekly", avatar: "/placeholder.svg", followers: "312K", growth: "+28K this week", category: "True Crime" },
  { id: "3", name: "Business Insider Pod", avatar: "/placeholder.svg", followers: "203K", growth: "+12K this week", category: "Business" },
  { id: "4", name: "Health & Wellness", avatar: "/placeholder.svg", followers: "156K", growth: "+9K this week", category: "Health" },
  { id: "5", name: "Creative Minds", avatar: "/placeholder.svg", followers: "89K", growth: "+6K this week", category: "Design" },
];

const timeFilters = ["Today", "This Week", "This Month", "All Time"];

export default function SeeksyTVTrending() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTime, setSelectedTime] = useState("This Week");

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

            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search trending..."
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Trending</h1>
              <p className="text-gray-400">What's hot on Seeksy TV right now</p>
            </div>
          </div>

          {/* Time Filter */}
          <div className="flex gap-2">
            {timeFilters.map((time) => (
              <Button
                key={time}
                variant={selectedTime === time ? "default" : "outline"}
                size="sm"
                className={
                  selectedTime === time
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
                }
                onClick={() => setSelectedTime(time)}
              >
                {time}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Trending List */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-amber-400" />
              <h2 className="text-xl font-bold">Top 10 Content</h2>
            </div>
            
            <div className="space-y-3">
              {trendingContent.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => navigate(item.type === "clip" ? `/tv/clip/${item.id}` : `/tv/watch/${item.id}`)}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12 shrink-0">
                    <span className={`text-3xl font-bold ${item.rank <= 3 ? 'text-amber-400' : 'text-gray-500'}`}>
                      {item.rank}
                    </span>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-40 shrink-0">
                    <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                      <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                    </div>
                    {item.type === "clip" && (
                      <Badge className="absolute top-1 left-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                        Clip
                      </Badge>
                    )}
                    <Badge variant="secondary" className="absolute bottom-1 right-1 bg-black/70 text-white text-xs">
                      {item.duration}
                    </Badge>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 hover:text-amber-400 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 mb-2">{item.creator}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">{item.views} views</span>
                      <Badge variant="outline" className="border-gray-600 text-gray-400">
                        {item.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Growth */}
                  <div className="flex items-center shrink-0">
                    <Badge className={`${
                      item.trend === 'up' ? 'bg-green-500/20 text-green-400' :
                      item.trend === 'down' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    } border-0`}>
                      <BarChart3 className="h-3 w-3 mr-1" />
                      {item.growth}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Creators Sidebar */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-amber-400" />
              <h2 className="text-xl font-bold">Rising Creators</h2>
            </div>
            
            <div className="space-y-3">
              {trendingCreators.map((creator, index) => (
                <div
                  key={creator.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => navigate(`/tv/channel/${creator.id}`)}
                >
                  <span className="text-xl font-bold text-gray-500 w-6">#{index + 1}</span>
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                    <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{creator.name}</h3>
                    <p className="text-sm text-gray-400">{creator.followers} followers</p>
                    <p className="text-xs text-green-400">{creator.growth}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <TVFooter />
    </div>
  );
}
