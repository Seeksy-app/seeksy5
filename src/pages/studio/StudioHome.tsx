import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, Upload, Scissors, Clock, 
  Play, History, Calendar, HardDrive,
  FolderOpen, FileText, MoreHorizontal,
  Radio, TrendingUp
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function StudioHome() {
  const navigate = useNavigate();

  // Fetch recent sessions
  const { data: recentSessions } = useQuery({
    queryKey: ["studio-recent-sessions"],
    queryFn: async (): Promise<any[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("studio_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        console.error("Error fetching sessions:", error);
        return [];
      }
      return data || [];
    },
  });

  // Fetch studio stats
  const { data: stats } = useQuery({
    queryKey: ["studio-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { totalSessions: 0, totalClips: 0, totalHours: 0, lastSession: null };

      const [sessionsResult, clipsResult, durationsResult] = await Promise.all([
        supabase.from("studio_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase.from("clips")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase.from("studio_sessions")
          .select("duration_seconds, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      ]);

      const totalSeconds = (durationsResult.data || []).reduce((acc: number, s: any) => acc + (s.duration_seconds || 0), 0);
      const lastSession = durationsResult.data?.[0]?.created_at || null;

      return {
        totalSessions: sessionsResult.count || 0,
        totalClips: clipsResult.count || 0,
        totalHours: Math.round((totalSeconds / 3600) * 10) / 10,
        lastSession,
      };
    },
  });

  // Fetch live sessions count
  const { data: liveCount } = useQuery({
    queryKey: ["studio-live-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count } = await supabase.from("studio_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active");

      return count || 0;
    },
  });

  const quickActions = [
    { 
      icon: Video, 
      label: "Create New Session", 
      bgClass: "bg-[hsl(208,93%,24%)]",
      hoverClass: "hover:bg-[hsl(208,93%,20%)]",
      path: "/studio/video" 
    },
    { 
      icon: Upload, 
      label: "Upload Media", 
      bgClass: "bg-[hsl(38,100%,55%)]",
      hoverClass: "hover:bg-[hsl(38,100%,50%)]",
      path: "/studio/media?upload=true" 
    },
    { 
      icon: Scissors, 
      label: "Generate Clips", 
      bgClass: "bg-gradient-to-r from-[hsl(330,80%,55%)] to-[hsl(280,70%,55%)]",
      hoverClass: "hover:opacity-90",
      path: "/studio/clips" 
    },
  ];

  const studioTools = [
    { icon: History, label: "Past Streams", desc: "View previous recordings", path: "/studio/past-streams" },
    { icon: Calendar, label: "Scheduled Streams", desc: "Upcoming recording times", path: "/studio/scheduled" },
    { icon: HardDrive, label: "Storage", desc: "All media files & assets", path: "/studio/storage" },
    { icon: Scissors, label: "Clips & Highlights", desc: "Auto-generated clips from sessions", path: "/studio/clips" },
    { icon: FolderOpen, label: "Media Library", desc: "Uploaded files + recordings", path: "/studio/media" },
    { icon: FileText, label: "Templates", desc: "Scripts, ad reads, show templates", path: "/studio/templates" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white border-0">Active</Badge>;
      case 'ended':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const getThumbnail = (session: any) => {
    if (session.thumbnail_url) {
      return session.thumbnail_url;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Studio Hub</h1>
            <p className="text-muted-foreground mt-1">Your home for recording, editing, and managing content</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>{liveCount || 0} Live Sessions</span>
            </div>
            <span className="text-border">|</span>
            <span>{stats?.totalSessions || 0} Past Streams</span>
            <span className="text-border">|</span>
            <span>{stats?.totalClips || 0} Auto Clips Generated</span>
          </div>
        </div>

        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`h-14 text-base font-medium gap-3 ${action.bgClass} ${action.hoverClass} text-white shadow-md`}
              >
                <action.icon className="w-5 h-5" />
                {action.label}
              </Button>
            ))}
          </div>
        </section>

        {/* Studio Overview Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Studio Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <p className="text-3xl font-bold text-foreground">{stats?.totalSessions || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Recordings</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <p className="text-3xl font-bold text-foreground">{stats?.totalHours || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Hours Created</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <p className="text-3xl font-bold text-foreground">{stats?.totalClips || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Clips Generated</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <p className="text-sm font-medium text-foreground">
                  {stats?.lastSession 
                    ? format(new Date(stats.lastSession), "MMM d, yyyy")
                    : "—"
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-1">Last Session</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Recent Sessions</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/studio/recordings")}>
              View All
            </Button>
          </div>
          
          {recentSessions && recentSessions.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {recentSessions.map((session: any) => (
                <Card 
                  key={session.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/studio/session/${session.id}`)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-muted relative">
                    {getThumbnail(session) ? (
                      <img 
                        src={getThumbnail(session)} 
                        alt={session.room_name || "Session"} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <Video className="w-10 h-10 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(session.status)}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm truncate">
                          {session.room_name || "Untitled Session"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}</span>
                          <span className="text-border">•</span>
                          <span className="tabular-nums">
                            {session.duration_seconds 
                              ? `${Math.floor(session.duration_seconds / 60)}:${(session.duration_seconds % 60).toString().padStart(2, '0')}`
                              : "0:00"}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/studio/session/${session.id}`); }}>
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                    <Video className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">No recent sessions</h3>
                    <p className="text-sm text-muted-foreground">
                      Start by creating your first recording.
                    </p>
                  </div>
                  <Button onClick={() => navigate("/studio/video")} className="bg-primary hover:bg-primary/90">
                    <Play className="w-4 h-4 mr-2" />
                    Create Your First Recording
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Studio Tools */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Studio Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {studioTools.map((tool) => (
              <Card 
                key={tool.label}
                className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
                onClick={() => navigate(tool.path)}
              >
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <tool.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors">{tool.label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{tool.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
