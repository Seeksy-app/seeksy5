import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Play, Video, Settings, Mic, 
  Clock, ChevronRight, Plus,
  FolderOpen, Image, Film, Palette,
  Calendar, Radio, Youtube, Instagram,
  Tv, Music, DollarSign, Megaphone,
  FileVideo, Layers, Type, ImageIcon,
  LayoutTemplate, Sparkles, ExternalLink
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LivestreamControls } from "@/components/studio/LivestreamControls";

// Studio card component
function StudioCard({ 
  studio, 
  onEnter, 
  onRecord, 
  onEdit, 
  onManageAssets 
}: { 
  studio: any;
  onEnter: () => void;
  onRecord: () => void;
  onEdit: () => void;
  onManageAssets: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-200 group"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-primary/20 via-primary/10 to-muted relative overflow-hidden">
        {studio.thumbnail_url ? (
          <img 
            src={studio.thumbnail_url} 
            alt={studio.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="w-12 h-12 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" onClick={onEnter} className="flex-1 bg-primary hover:bg-primary/90">
            <Play className="w-3 h-3 mr-1" /> Enter
          </Button>
          <Button size="sm" variant="secondary" onClick={onRecord}>
            <Mic className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">{studio.name}</h3>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {studio.last_session_at 
            ? `Last session ${formatDistanceToNow(new Date(studio.last_session_at), { addSuffix: true })}`
            : "No sessions yet"}
        </p>
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={onEdit} className="flex-1 text-xs">
            <Settings className="w-3 h-3 mr-1" /> Edit Template
          </Button>
          <Button size="sm" variant="ghost" onClick={onManageAssets} className="text-xs">
            <FolderOpen className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Menu section component
function MenuSection({ 
  title, 
  items, 
  delay = 0 
}: { 
  title: string;
  items: { icon: any; label: string; path: string; badge?: string; }[];
  delay?: number;
}) {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="space-y-2"
    >
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="text-[10px]">{item.badge}</Badge>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// Channel card component
function ChannelCard({ 
  name, 
  icon: Icon, 
  connected, 
  color 
}: { 
  name: string;
  icon: any;
  connected: boolean;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", color)}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground">
          {connected ? "Connected" : "Not connected"}
        </p>
      </div>
      <Badge variant={connected ? "default" : "outline"} className="text-[10px]">
        {connected ? "Active" : "Connect"}
      </Badge>
    </div>
  );
}

export default function StudioHubPremium() {
  const navigate = useNavigate();

  // Fetch user's studios from studio_templates table
  const { data: studios, isLoading: studiosLoading } = useQuery({
    queryKey: ["my-studios"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("studio_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) {
        console.error("Error fetching studios:", error);
        return [];
      }

      return (data || []).map((template: any) => ({
        id: template.id,
        name: template.session_name,
        description: template.description,
        thumbnail_url: template.thumbnail_url,
        last_session_at: template.updated_at,
      }));
    },
  });

  // Fetch recordings
  const { data: recordings, isLoading: recordingsLoading } = useQuery({
    queryKey: ["studio-recordings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from("media_files")
        .select("*")
        .eq("user_id", user.id)
        .in("file_type", ["video", "audio"])
        .order("created_at", { ascending: false })
        .limit(5);

      return data || [];
    },
  });

  // Fetch scheduled streams
  const { data: scheduledStreams } = useQuery({
    queryKey: ["scheduled-streams"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from("studio_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "scheduled")
        .order("scheduled_at", { ascending: true })
        .limit(3);

      return data || [];
    },
  });

  const studioMediaItems = [
    { icon: Film, label: "B-roll", path: "/studio/media?type=broll" },
    { icon: Image, label: "Uploaded Media", path: "/studio/media?type=uploads" },
    { icon: Sparkles, label: "AI-Generated Assets", path: "/studio/media?type=ai" },
    { icon: Video, label: "In-Studio Shots", path: "/studio/media?type=shots" },
  ];

  const creativeAssets = [
    { icon: FileVideo, label: "Intro Videos", path: "/studio/assets?type=intro" },
    { icon: FileVideo, label: "Outro Videos", path: "/studio/assets?type=outro" },
    { icon: ImageIcon, label: "Logos", path: "/studio/assets?type=logos" },
    { icon: Layers, label: "Overlays", path: "/studio/assets?type=overlays" },
    { icon: Type, label: "Lower Thirds", path: "/studio/assets?type=lower-thirds" },
    { icon: LayoutTemplate, label: "Templates", path: "/studio/templates" },
    { icon: Palette, label: "Font & Color Presets", path: "/studio/branding" },
  ];

  const advertisingItems = [
    { icon: Mic, label: "Host-Read Opportunities", path: "/studio/advertising/host-read" },
    { icon: Video, label: "Video Ad Opportunities", path: "/studio/advertising/video-ads" },
    { icon: Megaphone, label: "Shout-outs", path: "/studio/advertising/shoutouts" },
    { icon: Film, label: "Sponsored Clips", path: "/studio/advertising/sponsored" },
    { icon: Radio, label: "Dynamic Ad Insertion", path: "/studio/advertising/dai", badge: "Pro" },
    { icon: DollarSign, label: "Connect Advertiser Tools", path: "/monetization" },
  ];

  const channels = [
    { name: "YouTube Shorts", icon: Youtube, connected: false, color: "bg-red-500" },
    { name: "YouTube Longform", icon: Youtube, connected: false, color: "bg-red-600" },
    { name: "Instagram Reels", icon: Instagram, connected: false, color: "bg-gradient-to-br from-purple-500 to-pink-500" },
    { name: "Spotify Podcast", icon: Music, connected: false, color: "bg-green-500" },
    { name: "Seeksy TV", icon: Tv, connected: true, color: "bg-[#2C6BED]" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <span>Media & Content</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Studio Hub</span>
        </nav>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">Studio Hub</h1>
            <p className="text-muted-foreground mt-1">Your creative production environment</p>
          </div>
          <Button onClick={() => navigate("/studio/new")} className="bg-[#2C6BED] hover:bg-[#053877]">
            <Plus className="w-4 h-4 mr-2" /> Create New Studio
          </Button>
        </motion.div>

        {/* My Studios Section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">My Studios</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/studio/all")}>
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {studiosLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
              ))}
            </div>
          ) : studios && studios.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {studios.map((studio: any) => (
                <StudioCard
                  key={studio.id}
                  studio={studio}
                  onEnter={() => navigate(`/studio/video?template=${studio.id}`)}
                  onRecord={() => navigate(`/studio/video?template=${studio.id}`)}
                  onEdit={() => navigate(`/studio/templates?edit=${studio.id}`)}
                  onManageAssets={() => navigate(`/media-library?studio=${studio.id}`)}
                />
              ))}
              {/* Add new studio card */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate("/studio/new")}
                className="aspect-[4/3] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-accent/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  Create New Studio
                </span>
              </motion.button>
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Video className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground mb-1">No studios yet</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Create your first persistent studio environment
                </p>
                <Button onClick={() => navigate("/studio/new")} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" /> Create Your First Studio
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.section>

        {/* Main Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Menu Sections */}
          <div className="lg:col-span-2 space-y-8">
            {/* Studio Media Library */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-primary" />
                  Studio Media Library
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {studioMediaItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.path)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                    >
                      <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm text-foreground">{item.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Creative Assets */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="w-5 h-5 text-amber-500" />
                  Creative Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {creativeAssets.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.path)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                    >
                      <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                      <span className="text-sm text-foreground">{item.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Advertising Opportunities */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  Advertising
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {advertisingItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.path)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                    >
                      <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-green-500 transition-colors" />
                      <span className="text-sm text-foreground flex-1">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-[10px]">{item.badge}</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recordings */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Film className="w-5 h-5 text-primary" />
                  Recordings
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/studio/recordings")}>
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {recordingsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                  </div>
                ) : recordings && recordings.length > 0 ? (
                  <div className="space-y-2">
                    {recordings.map((recording: any) => (
                      <div
                        key={recording.id}
                        onClick={() => navigate(`/studio/media/${recording.id}`)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Video className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{recording.title || "Untitled"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(recording.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {recording.file_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No recordings yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Livestream Channels */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Radio className="w-5 h-5 text-red-500" />
                  Livestreaming
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <LivestreamControls />
              </CardContent>
            </Card>

            {/* Scheduled Streams */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Scheduled Streams
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {scheduledStreams && scheduledStreams.length > 0 ? (
                  <div className="space-y-2">
                    {scheduledStreams.map((stream: any) => (
                      <div key={stream.id} className="p-3 rounded-lg bg-muted/30">
                        <p className="text-sm font-medium text-foreground">{stream.room_name}</p>
                        <p className="text-xs text-muted-foreground">{stream.scheduled_at}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-3">No scheduled streams</p>
                    <Button variant="outline" size="sm" onClick={() => navigate("/studio/schedule")}>
                      <Calendar className="w-4 h-4 mr-2" /> Schedule Stream
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Channels */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-purple-500" />
                  Channels
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {channels.map((channel) => (
                  <ChannelCard
                    key={channel.name}
                    name={channel.name}
                    icon={channel.icon}
                    connected={channel.connected}
                    color={channel.color}
                  />
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => navigate("/integrations")}
                >
                  Manage Channels <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
