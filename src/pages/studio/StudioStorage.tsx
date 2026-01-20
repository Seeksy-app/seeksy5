import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, Search, Upload, FolderOpen, Video, Image, 
  Music, FileText, MoreVertical, Download, Trash2, 
  Grid3x3, List, HardDrive
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StorageItem {
  id: string;
  name: string;
  type: "video" | "image" | "audio" | "overlay" | "logo";
  size: string;
  date: string;
  thumbnail?: string;
}

const mockItems: StorageItem[] = [
  { id: "1", name: "Weekly Tech Talk - Dec 1.mp4", type: "video", size: "2.4 GB", date: "Dec 1, 2024" },
  { id: "2", name: "Product Launch.mp4", type: "video", size: "1.8 GB", date: "Nov 28, 2024" },
  { id: "3", name: "Company Logo.png", type: "logo", size: "245 KB", date: "Nov 15, 2024" },
  { id: "4", name: "Stream Overlay.png", type: "overlay", size: "1.2 MB", date: "Nov 10, 2024" },
  { id: "5", name: "Background Music.mp3", type: "audio", size: "8.5 MB", date: "Nov 5, 2024" },
  { id: "6", name: "Intro Animation.mp4", type: "video", size: "45 MB", date: "Oct 28, 2024" },
  { id: "7", name: "Brand Watermark.png", type: "logo", size: "125 KB", date: "Oct 20, 2024" },
  { id: "8", name: "Stream Thumbnail.jpg", type: "image", size: "890 KB", date: "Oct 15, 2024" },
];

const typeIcons: Record<string, typeof Video> = {
  video: Video,
  image: Image,
  audio: Music,
  overlay: FileText,
  logo: Image,
};

const typeColors: Record<string, string> = {
  video: "text-blue-400 bg-blue-500/20",
  image: "text-purple-400 bg-purple-500/20",
  audio: "text-green-400 bg-green-500/20",
  overlay: "text-amber-400 bg-amber-500/20",
  logo: "text-pink-400 bg-pink-500/20",
};

export default function StudioStorage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("all");

  const storageUsed = 12.4; // GB
  const storageTotal = 50; // GB
  const storagePercent = (storageUsed / storageTotal) * 100;

  const filteredItems = mockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || item.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-[#0d0f12]">
      {/* Header */}
      <header className="h-14 border-b border-white/10 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/studio")}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-white">Storage</h1>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 gap-2">
          <Upload className="w-4 h-4" />
          Upload
        </Button>
      </header>

      <div className="p-6 space-y-6">
        {/* Storage Usage */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-white/60" />
              <span className="text-white font-medium">Storage Usage</span>
            </div>
            <span className="text-white/60 text-sm">
              {storageUsed} GB of {storageTotal} GB used
            </span>
          </div>
          <Progress value={storagePercent} className="h-2" />
          <div className="flex items-center gap-4 mt-3 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Videos: 8.2 GB
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Images: 2.1 GB
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Audio: 1.8 GB
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Other: 0.3 GB
            </span>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="all" className="data-[state=active]:bg-white/10">All</TabsTrigger>
              <TabsTrigger value="video" className="data-[state=active]:bg-white/10">Videos</TabsTrigger>
              <TabsTrigger value="image" className="data-[state=active]:bg-white/10">Images</TabsTrigger>
              <TabsTrigger value="audio" className="data-[state=active]:bg-white/10">Audio</TabsTrigger>
              <TabsTrigger value="overlay" className="data-[state=active]:bg-white/10">Overlays</TabsTrigger>
              <TabsTrigger value="logo" className="data-[state=active]:bg-white/10">Logos</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-10 w-64 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-8 w-8",
                  viewMode === "grid" ? "bg-white/10 text-white" : "text-white/50"
                )}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
                className={cn(
                  "h-8 w-8",
                  viewMode === "list" ? "bg-white/10 text-white" : "text-white/50"
                )}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Items Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredItems.map((item) => {
              const Icon = typeIcons[item.type];
              return (
                <div
                  key={item.id}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors group"
                >
                  <div className="aspect-square relative bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <div className={cn("p-4 rounded-xl", typeColors[item.type])}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "absolute top-2 right-2 h-7 w-7 bg-black/50 text-white",
                            "opacity-0 group-hover:opacity-100 transition-opacity"
                          )}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="p-3">
                    <p className="text-white text-sm truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-white/50 text-xs mt-1">{item.size}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const Icon = typeIcons[item.type];
              return (
                <div
                  key={item.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors flex items-center gap-4"
                >
                  <div className={cn("p-2 rounded-lg", typeColors[item.type])}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{item.name}</p>
                  </div>
                  <span className="text-white/50 text-sm">{item.size}</span>
                  <span className="text-white/50 text-sm">{item.date}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No files found</h3>
            <p className="text-white/50">Upload files to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
