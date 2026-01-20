import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, Search, Filter, Play, Scissors, Share2, 
  MoreVertical, Download, Trash2, Calendar, Clock,
  Youtube, Facebook, Linkedin, Video
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PastStream {
  id: string;
  title: string;
  date: string;
  duration: string;
  thumbnail?: string;
  platforms: string[];
  views: number;
  status: "completed" | "processing" | "failed";
}

const mockStreams: PastStream[] = [
  {
    id: "1",
    title: "Weekly Tech Talk - Episode 45",
    date: "Dec 1, 2024",
    duration: "1:24:32",
    platforms: ["youtube", "facebook"],
    views: 1234,
    status: "completed",
  },
  {
    id: "2",
    title: "Product Launch Announcement",
    date: "Nov 28, 2024",
    duration: "45:18",
    platforms: ["youtube", "linkedin"],
    views: 856,
    status: "completed",
  },
  {
    id: "3",
    title: "Q&A with the Team",
    date: "Nov 25, 2024",
    duration: "58:42",
    platforms: ["youtube"],
    views: 2341,
    status: "completed",
  },
  {
    id: "4",
    title: "Behind the Scenes Tour",
    date: "Nov 22, 2024",
    duration: "32:15",
    platforms: ["facebook", "twitch"],
    views: 567,
    status: "processing",
  },
];

const platformIcons: Record<string, typeof Youtube> = {
  youtube: Youtube,
  facebook: Facebook,
  linkedin: Linkedin,
};

export default function PastStreams() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");

  const filteredStreams = mockStreams.filter(stream => {
    const matchesSearch = stream.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = filterPlatform === "all" || stream.platforms.includes(filterPlatform);
    return matchesSearch && matchesPlatform;
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
          <h1 className="text-xl font-semibold text-white">Past Streams</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search streams..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="twitch">Twitch</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Streams List */}
        <div className="space-y-3">
          {filteredStreams.map((stream) => (
            <div
              key={stream.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="w-48 aspect-video rounded-lg bg-gradient-to-br from-indigo-900/60 to-purple-900/60 flex items-center justify-center shrink-0">
                  <Video className="w-8 h-8 text-white/30" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-white font-medium truncate">{stream.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-white/50">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {stream.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {stream.duration}
                        </span>
                        <span>{stream.views.toLocaleString()} views</span>
                      </div>
                    </div>

                    <Badge
                      className={cn(
                        "shrink-0",
                        stream.status === "completed" && "bg-emerald-500/20 text-emerald-400 border-0",
                        stream.status === "processing" && "bg-amber-500/20 text-amber-400 border-0",
                        stream.status === "failed" && "bg-red-500/20 text-red-400 border-0"
                      )}
                    >
                      {stream.status}
                    </Badge>
                  </div>

                  {/* Platforms */}
                  <div className="flex items-center gap-2 mt-3">
                    {stream.platforms.map((platform) => {
                      const Icon = platformIcons[platform] || Video;
                      return (
                        <div
                          key={platform}
                          className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"
                        >
                          <Icon className="w-3.5 h-3.5 text-white/70" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white hover:bg-white/10 gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Watch
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white hover:bg-white/10 gap-2"
                  >
                    <Scissors className="w-4 h-4" />
                    Clips
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white hover:bg-white/10 gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/60 hover:text-white hover:bg-white/10"
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
              </div>
            </div>
          ))}
        </div>

        {filteredStreams.length === 0 && (
          <div className="text-center py-16">
            <Video className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No streams found</h3>
            <p className="text-white/50">Your past streams will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
