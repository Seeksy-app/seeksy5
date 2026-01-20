import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Play, ChevronLeft, ChevronRight, Scissors, 
  Clock, Eye, Plus, ThumbsUp 
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  thumbnail_url: string | null;
  duration_seconds?: number;
  view_count?: number;
  channel?: { name: string; slug?: string } | null;
  content_type?: string;
  category?: string;
}

interface TVContentRowProps {
  title: string;
  icon?: LucideIcon;
  items: ContentItem[];
  onItemClick: (id: string) => void;
  variant?: "default" | "portrait" | "large";
  showRank?: boolean;
}

// Helper functions
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}:${remainingMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatViews = (views: number) => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
};

export function TVContentRow({ 
  title, 
  icon: Icon, 
  items, 
  onItemClick, 
  variant = "default",
  showRank = false 
}: TVContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const getItemWidth = () => {
    switch (variant) {
      case "portrait": return "w-40 md:w-48";
      case "large": return "w-80 md:w-96";
      default: return "w-64 md:w-72";
    }
  };

  const getAspectRatio = () => {
    switch (variant) {
      case "portrait": return "aspect-[9/14]";
      case "large": return "aspect-video";
      default: return "aspect-video";
    }
  };

  if (!items.length) return null;

  return (
    <section className="py-6 group/section">
      {/* Section Header */}
      <div className="container mx-auto px-4 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-white">
            {Icon && <Icon className="h-6 w-6 text-amber-400" />}
            {title}
          </h2>
          <Button variant="ghost" className="text-amber-400 hover:text-amber-300 opacity-0 group-hover/section:opacity-100 transition-opacity">
            See all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Content Slider */}
      <div className="relative group">
        {/* Navigation Buttons */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-[#0a0a14] to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <ChevronLeft className="h-8 w-8 text-white" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-[#0a0a14] to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <ChevronRight className="h-8 w-8 text-white" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-4 pb-4 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`shrink-0 ${getItemWidth()} group/card cursor-pointer transition-all duration-300 ${
                hoveredId === item.id ? 'scale-105 z-10' : ''
              }`}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onItemClick(item.id)}
            >
              {/* Thumbnail Container */}
              <div className={`relative ${getAspectRatio()} rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg`}>
                {/* Thumbnail Image */}
                {item.thumbnail_url ? (
                  <img 
                    src={item.thumbnail_url} 
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
                    <Play className="h-12 w-12 text-white/30" />
                  </div>
                )}

                {/* Rank Number */}
                {showRank && (
                  <div className="absolute -left-2 bottom-0 text-8xl font-black text-white/20 drop-shadow-lg leading-none">
                    {index + 1}
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />

                {/* AI Clip Badge */}
                {item.content_type === "clip" && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5">
                      <Scissors className="h-3 w-3 mr-1" /> AI
                    </Badge>
                  </div>
                )}

                {/* Duration Badge */}
                {item.duration_seconds && (
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="bg-black/80 text-white text-xs backdrop-blur-sm">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDuration(item.duration_seconds)}
                    </Badge>
                  </div>
                )}

                {/* Hover Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-300">
                  <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/40 transform scale-75 group-hover/card:scale-100 transition-transform">
                    <Play className="h-6 w-6 text-white fill-current ml-1" />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="absolute bottom-2 left-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                    <Plus className="h-4 w-4 text-white" />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                    <ThumbsUp className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Content Info */}
              <div className="mt-3 space-y-1">
                <h3 className="font-semibold text-sm md:text-base text-white group-hover/card:text-amber-400 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                {item.channel && (
                  <p className="text-xs text-gray-400">{item.channel.name}</p>
                )}
                {item.view_count !== undefined && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Eye className="h-3 w-3" />
                    <span>{formatViews(item.view_count)} views</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
