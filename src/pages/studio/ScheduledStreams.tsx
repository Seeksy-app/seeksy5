import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, Plus, Calendar, Clock, MoreVertical, 
  Edit2, Trash2, Copy, Play, Youtube, Facebook, 
  Linkedin, Video, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ScheduledStream {
  id: string;
  title: string;
  scheduledDate: string;
  scheduledTime: string;
  platforms: string[];
  thumbnail?: string;
  status: "upcoming" | "live" | "cancelled";
  guests: number;
}

const mockScheduled: ScheduledStream[] = [
  {
    id: "1",
    title: "December Creator Roundtable",
    scheduledDate: "Dec 5, 2024",
    scheduledTime: "3:00 PM EST",
    platforms: ["youtube", "facebook", "linkedin"],
    status: "upcoming",
    guests: 3,
  },
  {
    id: "2",
    title: "Year in Review Special",
    scheduledDate: "Dec 15, 2024",
    scheduledTime: "7:00 PM EST",
    platforms: ["youtube"],
    status: "upcoming",
    guests: 0,
  },
  {
    id: "3",
    title: "Live Holiday Q&A",
    scheduledDate: "Dec 22, 2024",
    scheduledTime: "2:00 PM EST",
    platforms: ["youtube", "twitch"],
    status: "upcoming",
    guests: 1,
  },
];

const platformIcons: Record<string, typeof Youtube> = {
  youtube: Youtube,
  facebook: Facebook,
  linkedin: Linkedin,
};

function getTimeUntil(dateStr: string, timeStr: string): string {
  // Simple mock calculation
  const days = Math.floor(Math.random() * 20) + 1;
  if (days === 1) return "Tomorrow";
  if (days < 7) return `In ${days} days`;
  return `In ${Math.ceil(days / 7)} weeks`;
}

export default function ScheduledStreams() {
  const navigate = useNavigate();

  const handleStartNow = (id: string) => {
    toast.info("Starting stream...");
  };

  const handleCopyLink = (id: string) => {
    navigator.clipboard.writeText(`https://seeksy.io/live/${id}`);
    toast.success("Stream link copied!");
  };

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
          <h1 className="text-xl font-semibold text-white">Scheduled Streams</h1>
        </div>
        <Button 
          onClick={() => navigate("/studio/video")}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 gap-2"
        >
          <Plus className="w-4 h-4" />
          Schedule Stream
        </Button>
      </header>

      <div className="p-6">
        {/* Streams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockScheduled.map((stream) => (
            <div
              key={stream.id}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors"
            >
              {/* Thumbnail */}
              <div className="aspect-video relative bg-gradient-to-br from-indigo-900/60 to-purple-900/60">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="w-12 h-12 text-white/20" />
                </div>
                
                {/* Countdown Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className="bg-black/60 text-white border-0">
                    {getTimeUntil(stream.scheduledDate, stream.scheduledTime)}
                  </Badge>
                </div>

                {/* Platforms */}
                <div className="absolute top-3 right-3 flex gap-1">
                  {stream.platforms.map((platform) => {
                    const Icon = platformIcons[platform] || Video;
                    return (
                      <div
                        key={platform}
                        className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
                      >
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-white font-medium line-clamp-2">{stream.title}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleStartNow(stream.id)}>
                        <Play className="w-4 h-4 mr-2" />
                        Start Now
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyLink(stream.id)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Cancel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-4 mt-3 text-sm text-white/50">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {stream.scheduledDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {stream.scheduledTime}
                  </span>
                </div>

                {stream.guests > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-white/50">
                    <Users className="w-3.5 h-3.5" />
                    {stream.guests} guest{stream.guests > 1 ? "s" : ""} invited
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                    onClick={() => handleCopyLink(stream.id)}
                  >
                    <Copy className="w-3.5 h-3.5 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30"
                    onClick={() => handleStartNow(stream.id)}
                  >
                    <Play className="w-3.5 h-3.5 mr-2" />
                    Start Now
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {mockScheduled.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No scheduled streams</h3>
            <p className="text-white/50 mb-6">Schedule your next stream to get started</p>
            <Button 
              onClick={() => navigate("/studio/video")}
              className="bg-gradient-to-r from-green-500 to-emerald-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Stream
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
