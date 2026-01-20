import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, Video, Upload, Scissors, Radio, Clock, 
  HardDrive, Film, Calendar, FolderOpen, FileText, 
  Wand2, Volume2, Subtitles, LayoutGrid, Sparkles,
  ChevronRight, Play, TrendingUp
} from "lucide-react";

const StudioHome = () => {
  const navigate = useNavigate();

  // Mock data for recent sessions
  const recentSessions = [
    { id: "1", title: "Weekly Creator Roundtable", duration: "45:32", status: "Completed", thumbnail: null },
    { id: "2", title: "Product Launch Interview", duration: "28:15", status: "Active", thumbnail: null },
    { id: "3", title: "Holiday Special Episode", duration: "52:08", status: "Completed", thumbnail: null }
  ];

  // Mock metrics
  const metrics = {
    sessionsRecorded: 12,
    clipsGenerated: 47,
    storageUsed: "2.4 GB",
    activeFormat: "Short-form"
  };

  // Studio tools menu items
  const studioTools = [
    { icon: Video, label: "Past Streams", description: "View recorded streams", href: "/studio/streams" },
    { icon: Calendar, label: "Scheduled Streams", description: "Upcoming broadcasts", href: "/studio/scheduled", badge: "2 upcoming" },
    { icon: HardDrive, label: "Storage Manager", description: "Manage your files", href: "/studio/storage" },
    { icon: Scissors, label: "Clips & Highlights", description: "Generated clips", href: "/studio/ai-clips" },
    { icon: FolderOpen, label: "Media Library", description: "All your media", href: "/studio/media" },
    { icon: FileText, label: "Templates", description: "Scripts & Ad Reads", href: "/studio/templates" },
    { icon: Wand2, label: "AI Automation", description: "Coming Soon", href: "#", disabled: true }
  ];

  // AI quick actions
  const aiQuickActions = [
    { icon: Scissors, label: "Auto-clip Recent Upload", description: "Generate clips from your latest video" },
    { icon: Volume2, label: "Enhance Audio", description: "Clean up and enhance audio quality" },
    { icon: Subtitles, label: "Generate SRT Captions", description: "Create subtitles for accessibility" },
    { icon: LayoutGrid, label: "Create Social Cuts", description: "9:16, 1:1, 16:9 variations" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[hsl(var(--brand-navy))] to-[hsl(var(--brand-blue))] text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Radio className="w-5 h-5" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  Seeksy AI Powered
                </Badge>
              </div>
              <h1 className="text-4xl font-bold">Studio</h1>
              <p className="text-white/80 text-lg max-w-xl">
                Professional content creation suite powered by Seeksy AI. Record, edit, and publish all in one place.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                size="lg" 
                className="bg-white text-[hsl(var(--brand-navy))] hover:bg-white/90"
                onClick={() => navigate("/podcast-studio/mic-setup")}
              >
                <Mic className="w-4 h-4 mr-2" />
                Create New Studio
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => navigate("/studio/ai-post-production")}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Media
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => navigate("/studio/ai-clips")}
              >
                <Scissors className="w-4 h-4 mr-2" />
                Generate AI Clips
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 opacity-60"
                disabled
              >
                <Video className="w-4 h-4 mr-2" />
                Go Live
                <Badge variant="secondary" className="ml-2 text-xs bg-white/20 border-0">Soon</Badge>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Creator Metrics Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessions Recorded</CardTitle>
              <Mic className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.sessionsRecorded}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Clips Generated</CardTitle>
              <Scissors className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.clipsGenerated}</div>
              <p className="text-xs text-muted-foreground">Total clips</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.storageUsed}</div>
              <p className="text-xs text-muted-foreground">of 10 GB</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Active Format</CardTitle>
              <Film className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeFormat}</div>
              <p className="text-xs text-muted-foreground">Based on recent uploads</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Sessions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Sessions</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("/studio/media")}>
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <Card key={session.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Play className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{session.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.duration}
                          </span>
                          <Badge 
                            variant={session.status === "Active" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Open Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* AI Quick Actions */}
            <div className="pt-4">
              <h2 className="text-lg font-semibold mb-4">AI Tools Quick Actions</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {aiQuickActions.map((action) => (
                  <Card 
                    key={action.label}
                    className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
                    onClick={() => navigate("/studio/ai-post-production")}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <action.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{action.label}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Studio Tools Sidebar */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Studio Tools</h2>
            <div className="space-y-2">
              {studioTools.map((tool) => (
                <Card 
                  key={tool.label}
                  className={`cursor-pointer transition-all ${
                    tool.disabled 
                      ? "opacity-50 cursor-not-allowed" 
                      : "hover:shadow-md hover:border-primary/50"
                  }`}
                  onClick={() => !tool.disabled && navigate(tool.href)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <tool.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm">{tool.label}</h3>
                          {tool.badge && (
                            <Badge variant="secondary" className="text-xs">{tool.badge}</Badge>
                          )}
                          {tool.disabled && (
                            <Badge variant="outline" className="text-xs">Soon</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Seasonal Insight Card */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-1">
                      🔥 Holiday Trend
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Short-form content demand is up <span className="font-semibold text-amber-600">41%</span> in December. 
                      Creators publishing 5 clips weekly see <span className="font-semibold text-amber-600">+22% growth</span>.
                    </p>
                    <Button variant="link" size="sm" className="p-0 h-auto text-xs text-amber-600 mt-2">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      View Market Intelligence
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioHome;
