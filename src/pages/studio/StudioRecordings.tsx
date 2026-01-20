import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  ChevronRight, Video, Clock, Search,
  Filter, Download, Trash2, MoreVertical,
  Play, Film, Mic
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function StudioRecordings() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: recordings, isLoading } = useQuery({
    queryKey: ["all-studio-recordings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from("media_files")
        .select("*")
        .eq("user_id", user.id)
        .in("file_type", ["video", "audio"])
        .order("created_at", { ascending: false });

      return data || [];
    },
  });

  const filteredRecordings = recordings?.filter((rec: any) =>
    rec.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => navigate("/studio")} className="hover:text-foreground transition-colors">
            Studio Hub
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Recordings</span>
        </nav>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Recordings</h1>
            <p className="text-muted-foreground mt-1">All recordings from your studios</p>
          </div>
          <Button onClick={() => navigate("/studio/video")} className="bg-primary hover:bg-primary/90">
            <Play className="w-4 h-4 mr-2" /> New Recording
          </Button>
        </motion.div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search recordings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
        </div>

        {/* Recordings List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredRecordings.length > 0 ? (
          <div className="space-y-3">
            {filteredRecordings.map((recording: any, index: number) => (
              <motion.div
                key={recording.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => navigate(`/studio/media/${recording.id}`)}
              >
                {/* Thumbnail */}
                <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center overflow-hidden shrink-0">
                  {recording.thumbnail_url ? (
                    <img 
                      src={recording.thumbnail_url} 
                      alt={recording.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : recording.file_type === "audio" ? (
                    <Mic className="w-6 h-6 text-primary/50" />
                  ) : (
                    <Video className="w-6 h-6 text-primary/50" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {recording.title || "Untitled Recording"}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {recording.duration_seconds 
                        ? `${Math.floor(recording.duration_seconds / 60)}:${(recording.duration_seconds % 60).toString().padStart(2, '0')}`
                        : "0:00"}
                    </span>
                    <span>{format(new Date(recording.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>

                {/* Type Badge */}
                <Badge variant="outline" className="capitalize shrink-0">
                  {recording.file_type === "audio" ? (
                    <><Mic className="w-3 h-3 mr-1" /> Audio</>
                  ) : (
                    <><Film className="w-3 h-3 mr-1" /> Video</>
                  )}
                </Badge>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/studio/media/${recording.id}`);
                    }}>
                      <Play className="w-4 h-4 mr-2" /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                      <Download className="w-4 h-4 mr-2" /> Download
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => e.stopPropagation()}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Video className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-1">No recordings yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Start recording in your studio to see them here
            </p>
            <Button onClick={() => navigate("/studio/video")} className="bg-primary hover:bg-primary/90">
              <Play className="w-4 h-4 mr-2" /> Start Recording
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
