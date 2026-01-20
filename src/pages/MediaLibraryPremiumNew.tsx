import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Grid, List, Upload, Play, Clock, Tag, 
  MoreHorizontal, Scissors, Plus, FolderOpen,
  Video, Mic, Radio, FileText, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Sample media items
const mediaItems = [
  { id: "1", title: "Interview with Alex", type: "video", duration: "45:23", date: "Dec 1, 2024", tags: ["interview", "tech"], thumbnail: null },
  { id: "2", title: "Solo Episode 12", type: "audio", duration: "32:15", date: "Nov 28, 2024", tags: ["solo", "updates"], thumbnail: null },
  { id: "3", title: "Live Q&A Session", type: "stream", duration: "1:23:45", date: "Nov 25, 2024", tags: ["live", "qa"], thumbnail: null },
  { id: "4", title: "Intro Script Draft", type: "draft", duration: "2:30", date: "Nov 24, 2024", tags: ["draft", "intro"], thumbnail: null },
];

const categories = [
  { id: "all", label: "All Media", icon: FolderOpen, count: 24 },
  { id: "episodes", label: "Episodes", icon: Video, count: 12 },
  { id: "clips", label: "Clips", icon: Scissors, count: 8 },
  { id: "streams", label: "Streams", icon: Radio, count: 3 },
  { id: "drafts", label: "Drafts", icon: FileText, count: 1 },
];

export default function MediaLibraryPremiumNew() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return Video;
      case "audio": return Mic;
      case "stream": return Radio;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video": return "bg-blue-500/20 text-blue-400";
      case "audio": return "bg-teal-500/20 text-teal-400";
      case "stream": return "bg-purple-500/20 text-purple-400";
      default: return "bg-white/10 text-white/60";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#0D1117] to-[#11151C]">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Media Library</h1>
              <p className="text-white/50 text-sm">Your creative vault</p>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>

          {/* Search and filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView("grid")}
                className={cn(
                  "w-8 h-8 rounded-md",
                  view === "grid" ? "bg-white/10 text-white" : "text-white/50"
                )}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView("list")}
                className={cn(
                  "w-8 h-8 rounded-md",
                  view === "list" ? "bg-white/10 text-white" : "text-white/50"
                )}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-56 flex-shrink-0">
            <nav className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    activeCategory === cat.id
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <cat.icon className="w-5 h-5" />
                  <span className="flex-1 text-left text-sm font-medium">{cat.label}</span>
                  <span className="text-xs text-white/40">{cat.count}</span>
                </button>
              ))}
            </nav>

            {/* Smart Albums */}
            <div className="mt-8">
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider px-4 mb-3">
                Smart Albums
              </p>
              <div className="space-y-1">
                {["Recent Uploads", "AI Tagged", "Favorites", "Shared"].map((album) => (
                  <button
                    key={album}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">{album}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {mediaItems.length === 0 ? (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center mb-6">
                  <FolderOpen className="w-10 h-10 text-blue-400/50" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Your creative vault is waiting</h3>
                <p className="text-white/50 text-center max-w-md mb-6">
                  Upload files or start recording in the Studio to build your media library.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </Button>
                  <Button className="bg-gradient-to-r from-blue-600 to-violet-600">
                    Open Studio
                  </Button>
                </div>
              </motion.div>
            ) : view === "grid" ? (
              /* Grid View */
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {mediaItems.map((item, index) => {
                  const TypeIcon = getTypeIcon(item.type);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all cursor-pointer"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video bg-gradient-to-br from-white/5 to-white/0 relative flex items-center justify-center">
                        <TypeIcon className="w-12 h-12 text-white/20" />
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                            <Play className="w-6 h-6 text-white ml-1" />
                          </div>
                        </div>
                        {/* Duration */}
                        <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 backdrop-blur">
                          <span className="text-xs text-white font-mono">{item.duration}</span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-medium text-white line-clamp-1">{item.title}</h3>
                          <Button variant="ghost" size="icon" className="w-6 h-6 text-white/40 hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={cn("text-[10px]", getTypeColor(item.type))}>
                            {item.type}
                          </Badge>
                          <span className="text-xs text-white/40">{item.date}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="h-7 text-xs bg-white/5 hover:bg-white/10 text-white/70">
                            <Scissors className="w-3 h-3 mr-1" />
                            Send to Clips
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs bg-white/5 hover:bg-white/10 text-white/70">
                            <Plus className="w-3 h-3 mr-1" />
                            Add to Episode
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="space-y-2">
                {mediaItems.map((item, index) => {
                  const TypeIcon = getTypeIcon(item.type);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
                    >
                      <div className="w-20 h-14 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <TypeIcon className="w-6 h-6 text-white/30" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">{item.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge className={cn("text-[10px]", getTypeColor(item.type))}>
                            {item.type}
                          </Badge>
                          <span className="text-xs text-white/40 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.duration}
                          </span>
                          <span className="text-xs text-white/40">{item.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" className="h-8 text-xs bg-white/5 hover:bg-white/10">
                          <Scissors className="w-3 h-3 mr-1" />
                          Clips
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs bg-white/5 hover:bg-white/10">
                          <Plus className="w-3 h-3 mr-1" />
                          Episode
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-white/40">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
