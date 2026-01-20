import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, Search, ArrowLeft, Filter, Grid3X3, List,
  Tv, Clock, TrendingUp, Calendar
} from "lucide-react";
import { TVFooter } from "@/components/tv/TVFooter";

// Mock data
const allContent = [
  { id: "1", title: "The Future of AI in 2025", creator: "The Daily Tech", type: "episode", category: "Technology", duration: "45:32", thumbnail: "/placeholder.svg", views: "15K", date: "2 days ago" },
  { id: "2", title: "Building a Brand from Scratch", creator: "Business Insider Pod", type: "episode", category: "Business", duration: "38:15", thumbnail: "/placeholder.svg", views: "12K", date: "5 days ago" },
  { id: "3", title: "Meditation for Beginners", creator: "Health & Wellness", type: "episode", category: "Health", duration: "22:45", thumbnail: "/placeholder.svg", views: "8.5K", date: "1 week ago" },
  { id: "4", title: "The Missing Evidence", creator: "True Crime Weekly", type: "episode", category: "True Crime", duration: "52:18", thumbnail: "/placeholder.svg", views: "28K", date: "1 week ago" },
  { id: "5", title: "Remote Work Best Practices", creator: "Business Insider Pod", type: "episode", category: "Business", duration: "41:05", thumbnail: "/placeholder.svg", views: "9.2K", date: "2 weeks ago" },
  { id: "6", title: "Color Theory Deep Dive", creator: "Creative Minds", type: "episode", category: "Design", duration: "35:20", thumbnail: "/placeholder.svg", views: "6.8K", date: "2 weeks ago" },
  { id: "7", title: "AI Moment That Changed Everything", creator: "The Daily Tech", type: "clip", category: "Technology", duration: "0:58", thumbnail: "/placeholder.svg", views: "45K", date: "3 days ago" },
  { id: "8", title: "Morning Tech Roundup", creator: "The Daily Tech", type: "live", category: "Technology", duration: "LIVE", thumbnail: "/placeholder.svg", views: "2.3K watching", date: "Now" },
  { id: "9", title: "Design Systems Workshop", creator: "Creative Minds", type: "live", category: "Design", duration: "LIVE", thumbnail: "/placeholder.svg", views: "1.1K watching", date: "Now" },
  { id: "10", title: "Startup Funding 101", creator: "Business Insider Pod", type: "episode", category: "Business", duration: "48:30", thumbnail: "/placeholder.svg", views: "18K", date: "3 weeks ago" },
  { id: "11", title: "This One Habit Changed My Life", creator: "Health & Wellness", type: "clip", category: "Health", duration: "1:15", thumbnail: "/placeholder.svg", views: "32K", date: "5 days ago" },
  { id: "12", title: "The Confession", creator: "True Crime Weekly", type: "clip", category: "True Crime", duration: "0:45", thumbnail: "/placeholder.svg", views: "67K", date: "1 week ago" },
];

const categories = ["All", "Technology", "Business", "Health", "Design", "True Crime", "Entertainment"];
const contentTypes = ["All Types", "Episodes", "Clips", "Live"];
const sortOptions = [
  { value: "recent", label: "Most Recent" },
  { value: "popular", label: "Most Popular" },
  { value: "trending", label: "Trending" },
];

export default function SeeksyTVBrowse() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All");
  const [selectedType, setSelectedType] = useState("All Types");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredContent = allContent.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.creator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesType = selectedType === "All Types" || 
                       (selectedType === "Episodes" && item.type === "episode") ||
                       (selectedType === "Clips" && item.type === "clip") ||
                       (selectedType === "Live" && item.type === "live");
    return matchesSearch && matchesCategory && matchesType;
  });

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
                  placeholder="Search content..."
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

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Browse All Content</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "text-amber-400" : "text-gray-400"}
            >
              <Grid3X3 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "text-amber-400" : "text-gray-400"}
            >
              <List className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {/* Category Pills */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                className={
                  selectedCategory === cat
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
                }
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[140px] bg-white/10 border-white/20 text-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] bg-white/10 border-white/20 text-white">
                <TrendingUp className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-400 text-sm">{filteredContent.length} results</p>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredContent.map((item) => (
              <div
                key={item.id}
                className="group cursor-pointer"
                onClick={() => navigate(item.type === "clip" ? `/tv/clip/${item.id}` : `/tv/watch/${item.id}`)}
              >
                <div className={`relative ${item.type === "clip" ? "aspect-[9/16]" : "aspect-video"} rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-gray-800 to-gray-900`}>
                  <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                  
                  {/* Type Badge */}
                  <div className="absolute top-2 left-2">
                    {item.type === "live" && (
                      <Badge className="bg-red-600 text-white text-xs">
                        <span className="animate-pulse mr-1">●</span> LIVE
                      </Badge>
                    )}
                    {item.type === "clip" && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                        AI Clip
                      </Badge>
                    )}
                  </div>
                  
                  {/* Duration */}
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                      {item.duration}
                    </Badge>
                  </div>
                  
                  {/* Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <div className="w-14 h-14 rounded-full bg-amber-500/90 flex items-center justify-center">
                      <Play className="h-6 w-6 text-white fill-current ml-1" />
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold group-hover:text-amber-400 transition-colors line-clamp-2 mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400">{item.creator}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <span>{item.views}</span>
                  <span>•</span>
                  <span>{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContent.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => navigate(item.type === "clip" ? `/tv/clip/${item.id}` : `/tv/watch/${item.id}`)}
              >
                <div className="relative w-48 shrink-0">
                  <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                  {item.type === "live" && (
                    <Badge className="absolute top-1 left-1 bg-red-600 text-white text-xs">
                      <span className="animate-pulse mr-1">●</span> LIVE
                    </Badge>
                  )}
                  <Badge variant="secondary" className="absolute bottom-1 right-1 bg-black/70 text-white text-xs">
                    {item.duration}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 hover:text-amber-400 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 mb-2">{item.creator}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {item.date}
                    </span>
                    <span>{item.views}</span>
                    <Badge variant="outline" className="border-gray-600 text-gray-400">
                      {item.category}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredContent.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-gray-400 mb-4">No content found</p>
            <p className="text-gray-500">Try adjusting your filters or search term</p>
          </div>
        )}
      </main>

      <TVFooter />
    </div>
  );
}
