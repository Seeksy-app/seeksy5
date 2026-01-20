import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Play, Search, ArrowLeft, Bell, Calendar,
  Tv, Users, Clock
} from "lucide-react";
import { TVFooter } from "@/components/tv/TVFooter";
import { IVSPlayer } from "@/components/tv/IVSPlayer";
import { useLiveChannels } from "@/hooks/useLiveChannels";

// Mock upcoming/past data (real live streams from database)
const upcomingStreams = [
  { id: "5", title: "CES 2025 Coverage", creator: "The Daily Tech", category: "Technology", scheduledFor: "Tomorrow at 10:00 AM", thumbnail: "/placeholder.svg" },
  { id: "6", title: "Fitness Friday Challenge", creator: "Health & Wellness", category: "Health", scheduledFor: "Friday at 9:00 AM", thumbnail: "/placeholder.svg" },
  { id: "7", title: "Weekly Q&A Session", creator: "Business Insider Pod", category: "Business", scheduledFor: "Saturday at 2:00 PM", thumbnail: "/placeholder.svg" },
  { id: "8", title: "Art & Design Showcase", creator: "Creative Minds", category: "Design", scheduledFor: "Sunday at 11:00 AM", thumbnail: "/placeholder.svg" },
];

const pastStreams = [
  { id: "9", title: "Year End Wrap Up", creator: "The Daily Tech", category: "Technology", views: "15K", duration: "1:45:32", thumbnail: "/placeholder.svg" },
  { id: "10", title: "Holiday Special", creator: "True Crime Weekly", category: "True Crime", views: "28K", duration: "2:12:15", thumbnail: "/placeholder.svg" },
  { id: "11", title: "Logo Design Marathon", creator: "Creative Minds", category: "Design", views: "8.2K", duration: "3:00:00", thumbnail: "/placeholder.svg" },
  { id: "12", title: "Investment Strategies 2025", creator: "Business Insider Pod", category: "Business", views: "12K", duration: "1:30:00", thumbnail: "/placeholder.svg" },
];

export default function SeeksyTVLive() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { channels: liveChannels, isLoading: liveLoading } = useLiveChannels();

  // Filter live channels by search
  const filteredLive = liveChannels.filter(channel => 
    channel.channel_name.toLowerCase().includes(searchQuery.toLowerCase())
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

            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search live streams..."
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
        {/* Live Now Section - Real IVS Streams */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <h2 className="text-2xl font-bold">Live Now</h2>
            <Badge className="bg-red-600 text-white">{filteredLive.length} streams</Badge>
          </div>
          
          {liveLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="aspect-video bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredLive.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredLive.map((channel) => (
                <div
                  key={channel.id}
                  className="group relative rounded-xl overflow-hidden"
                >
                  <IVSPlayer 
                    playbackUrl={channel.playback_url}
                    channelName={channel.channel_name}
                    viewerCount={channel.viewer_count}
                    isLive={true}
                    className="aspect-video"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white/5 rounded-xl">
              <Tv className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No live streams right now</h3>
              <p className="text-gray-500 mb-4">Check back later or browse upcoming streams below</p>
            </div>
          )}
        </section>

        {/* Upcoming Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-6 w-6 text-amber-400" />
            <h2 className="text-2xl font-bold">Upcoming Streams</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingStreams.map((stream) => (
              <div
                key={stream.id}
                className="group rounded-xl overflow-hidden bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900">
                  <img src={stream.thumbnail} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-blue-600 text-white text-xs">UPCOMING</Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold group-hover:text-amber-400 transition-colors line-clamp-1 mb-1">
                    {stream.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">{stream.creator}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {stream.scheduledFor}
                  </div>
                  <Button size="sm" variant="outline" className="mt-3 w-full border-white/20 text-white hover:bg-white/10">
                    <Bell className="h-3 w-3 mr-2" /> Remind Me
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Past Streams Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-6 w-6 text-amber-400" />
            <h2 className="text-2xl font-bold">Past Streams</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pastStreams.map((stream) => (
              <div
                key={stream.id}
                className="group cursor-pointer"
                onClick={() => navigate(`/tv/watch/${stream.id}`)}
              >
                <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-gray-800 to-gray-900">
                  <img src={stream.thumbnail} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-gray-700 text-white text-xs">REPLAY</Badge>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                      {stream.duration}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <div className="w-12 h-12 rounded-full bg-amber-500/90 flex items-center justify-center">
                      <Play className="h-5 w-5 text-white fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold group-hover:text-amber-400 transition-colors line-clamp-1 mb-1">
                  {stream.title}
                </h3>
                <p className="text-sm text-gray-400">{stream.creator}</p>
                <p className="text-xs text-gray-500 mt-1">{stream.views} views</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <TVFooter />
    </div>
  );
}
