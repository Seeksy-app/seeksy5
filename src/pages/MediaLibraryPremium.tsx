import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Grid3x3, List, Upload, Filter, MoreVertical,
  Play, Clock, Tag, FolderOpen, Sparkles, Video, Mic,
  Radio, FileText, ArrowRight, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  title: string;
  type: "video" | "audio" | "stream" | "draft";
  duration: string;
  thumbnail?: string;
  createdAt: string;
  tags: string[];
  aiTags?: string[];
}

const sampleMedia: MediaItem[] = [
  {
    id: "1",
    title: "Episode 45: The Future of AI",
    type: "video",
    duration: "42:30",
    createdAt: "2 days ago",
    tags: ["podcast", "tech"],
    aiTags: ["technology", "artificial intelligence", "interview"],
  },
  {
    id: "2",
    title: "Quick Tips: Content Creation",
    type: "audio",
    duration: "15:20",
    createdAt: "1 week ago",
    tags: ["tips"],
    aiTags: ["education", "creator economy"],
  },
  {
    id: "3",
    title: "Live Q&A Session",
    type: "stream",
    duration: "1:24:15",
    createdAt: "3 days ago",
    tags: ["live", "qa"],
    aiTags: ["community", "engagement"],
  },
];

const smartAlbums = [
  { id: "podcasts", name: "Podcasts", icon: Mic, count: 24 },
  { id: "clips", name: "Clips", icon: Video, count: 156 },
  { id: "streams", name: "Streams", icon: Radio, count: 8 },
  { id: "drafts", name: "Drafts", icon: FileText, count: 3 },
];

export default function MediaLibraryPremium() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const getTypeIcon = (type: MediaItem["type"]) => {
    switch (type) {
      case "video": return Video;
      case "audio": return Mic;
      case "stream": return Radio;
      case "draft": return FileText;
    }
  };

  const getTypeColor = (type: MediaItem["type"]) => {
    switch (type) {
      case "video": return "bg-blue-500/20 text-blue-400";
      case "audio": return "bg-violet-500/20 text-violet-400";
      case "stream": return "bg-red-500/20 text-red-400";
      case "draft": return "bg-amber-500/20 text-amber-400";
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 container max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Media Library</h1>
            <p className="text-white/60">Your creative vault • {sampleMedia.length} items</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button className="bg-white/10 hover:bg-white/15 text-white border-0">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0">
              <Plus className="w-4 h-4 mr-2" />
              New Recording
            </Button>
          </div>
        </div>

        {/* Smart Albums */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {smartAlbums.map((album) => (
            <Card
              key={album.id}
              onClick={() => setSelectedAlbum(selectedAlbum === album.id ? null : album.id)}
              className={cn(
                "p-4 cursor-pointer transition-all border-white/10",
                "bg-white/5 hover:bg-white/10",
                selectedAlbum === album.id && "bg-white/10 border-white/20"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <album.icon className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{album.name}</p>
                  <p className="text-xs text-white/50">{album.count} items</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Search media, tags, or AI-detected content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            
            <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "w-8 h-8 rounded-md",
                  viewMode === "grid" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
                )}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
                className={cn(
                  "w-8 h-8 rounded-md",
                  viewMode === "list" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
                )}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Media content */}
        {sampleMedia.length === 0 ? (
          /* Empty state */
          <Card className="p-16 bg-white/5 border-white/10 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-10 h-10 text-violet-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Your creative vault awaits</h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Upload your first recording or create something new in the studio. 
              AI will automatically tag and organize everything.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Upload className="w-4 h-4 mr-2" />
                Upload Media
              </Button>
              <Button className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                Open Studio
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        ) : viewMode === "grid" ? (
          /* Grid view */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleMedia.map((item) => {
              const TypeIcon = getTypeIcon(item.type);
              return (
                <Card
                  key={item.id}
                  className={cn(
                    "group overflow-hidden bg-white/5 border-white/10 transition-all cursor-pointer",
                    "hover:bg-white/[0.08] hover:border-white/20"
                  )}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-white/5 to-white/10">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <TypeIcon className="w-12 h-12 text-white/20" />
                    </div>
                    
                    {/* Play button overlay */}
                    <div className={cn(
                      "absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity",
                      hoveredItem === item.id && "opacity-100"
                    )}>
                      <Button size="icon" className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xl">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </Button>
                    </div>

                    {/* Duration badge */}
                    <Badge className="absolute bottom-2 right-2 bg-black/60 text-white border-0 text-xs">
                      {item.duration}
                    </Badge>

                    {/* Type badge */}
                    <Badge className={cn("absolute top-2 left-2 border-0 text-xs", getTypeColor(item.type))}>
                      {item.type}
                    </Badge>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-white mb-2 line-clamp-1">{item.title}</h3>
                    
                    <div className="flex items-center gap-2 text-xs text-white/50 mb-3">
                      <Clock className="w-3 h-3" />
                      {item.createdAt}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-[10px] bg-white/10 rounded text-white/60">
                          {tag}
                        </span>
                      ))}
                      {item.aiTags?.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-[10px] bg-violet-500/20 rounded text-violet-400 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* List view */
          <div className="space-y-2">
            {sampleMedia.map((item) => {
              const TypeIcon = getTypeIcon(item.type);
              return (
                <Card
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-white/5 border-white/10 hover:bg-white/[0.08] transition-colors cursor-pointer"
                >
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", getTypeColor(item.type))}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{item.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-white/50">
                      <span>{item.duration}</span>
                      <span>•</span>
                      <span>{item.createdAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.aiTags?.slice(0, 2).map((tag) => (
                      <Badge key={tag} className="bg-violet-500/20 text-violet-400 border-0 text-[10px]">
                        <Sparkles className="w-2.5 h-2.5 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Button variant="ghost" size="icon" className="text-white/40 hover:text-white">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
