import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Mic, Video, Scissors, Upload, BarChart3, ArrowRight, 
  Sparkles, Play, Clock, CheckCircle2, ChevronRight, 
  FolderOpen, Send, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: "completed" | "current" | "upcoming";
  route: string;
}

const workflowSteps: WorkflowStep[] = [
  { id: "record", title: "Record", description: "Create your content", icon: Video, status: "completed", route: "/studio/video" },
  { id: "clips", title: "Auto-Clips", description: "AI-generated highlights", icon: Sparkles, status: "completed", route: "/clips" },
  { id: "edit", title: "Edit", description: "Polish your clips", icon: Scissors, status: "current", route: "/clips" },
  { id: "publish", title: "Publish", description: "Share everywhere", icon: Send, status: "upcoming", route: "/publish" },
  { id: "insights", title: "Insights", description: "Track performance", icon: BarChart3, status: "upcoming", route: "/insights" },
];

const recentSessions = [
  { id: "1", title: "Episode 45: AI Future", duration: "42:30", clips: 8, status: "editing" },
  { id: "2", title: "Quick Tips Series", duration: "15:20", clips: 3, status: "published" },
  { id: "3", title: "Live Q&A Recap", duration: "1:24:15", clips: 12, status: "processing" },
];

const quickStats = [
  { label: "Total Recordings", value: "24", change: "+3 this week" },
  { label: "Auto-Clips Created", value: "156", change: "+28 this week" },
  { label: "Published Content", value: "89", change: "+12 this week" },
  { label: "Total Views", value: "45.2K", change: "+2.1K this week" },
];

export default function MasterSuitePremium() {
  const navigate = useNavigate();
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 container max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-4">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-white/70">Seeksy Master Suite</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Creator Workspace</h1>
          <p className="text-lg text-white/60">Record → Edit → Publish → Grow</p>
        </div>

        {/* Workflow Pipeline */}
        <Card className="p-6 bg-white/5 border-white/10 mb-8">
          <h2 className="text-lg font-semibold text-white mb-6">Your Workflow</h2>
          
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-white/10">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-violet-500" style={{ width: "40%" }} />
            </div>

            {workflowSteps.map((step, index) => (
              <div
                key={step.id}
                className="relative flex flex-col items-center z-10"
                onMouseEnter={() => setHoveredStep(step.id)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <button
                  onClick={() => navigate(step.route)}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    step.status === "completed" && "bg-emerald-500 text-white",
                    step.status === "current" && "bg-violet-500 text-white ring-4 ring-violet-500/30",
                    step.status === "upcoming" && "bg-white/10 text-white/50"
                  )}
                >
                  {step.status === "completed" ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </button>
                
                <div className={cn(
                  "mt-3 text-center transition-all",
                  hoveredStep === step.id && "transform -translate-y-1"
                )}>
                  <p className={cn(
                    "text-sm font-medium",
                    step.status === "upcoming" ? "text-white/50" : "text-white"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat) => (
            <Card key={stat.label} className="p-4 bg-white/5 border-white/10">
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-white/60">{stat.label}</p>
              <p className="text-xs text-emerald-400 mt-2">{stat.change}</p>
            </Card>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/studio")}
                className="w-full h-14 justify-start gap-3 bg-gradient-to-r from-violet-600/20 to-purple-600/20 hover:from-violet-600/30 hover:to-purple-600/30 text-white border border-violet-500/30"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/30 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">New Recording</p>
                  <p className="text-xs text-white/50">Start a new session</p>
                </div>
              </Button>

              <Button
                onClick={() => navigate("/clips")}
                className="w-full h-14 justify-start gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Scissors className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Edit Clips</p>
                  <p className="text-xs text-white/50">Continue editing</p>
                </div>
              </Button>

              <Button
                onClick={() => navigate("/media-library")}
                className="w-full h-14 justify-start gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Media Library</p>
                  <p className="text-xs text-white/50">Browse your vault</p>
                </div>
              </Button>
            </div>
          </Card>

          {/* Recent Sessions */}
          <Card className="p-6 bg-white/5 border-white/10 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Sessions</h3>
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="w-16 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white/40" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{session.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {session.clips} clips
                      </span>
                    </div>
                  </div>

                  <Badge className={cn(
                    "border-0 text-xs",
                    session.status === "editing" && "bg-amber-500/20 text-amber-400",
                    session.status === "published" && "bg-emerald-500/20 text-emerald-400",
                    session.status === "processing" && "bg-blue-500/20 text-blue-400"
                  )}>
                    {session.status}
                  </Badge>

                  <Button variant="ghost" size="icon" className="text-white/40 hover:text-white">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Module Cards */}
        <div className="grid md:grid-cols-5 gap-4 mt-8">
          {[
            { title: "Studio", icon: Video, route: "/studio", color: "from-violet-500/20 to-purple-500/20" },
            { title: "Clips", icon: Scissors, route: "/clips", color: "from-blue-500/20 to-cyan-500/20" },
            { title: "Publish", icon: Send, route: "/publish", color: "from-emerald-500/20 to-teal-500/20" },
            { title: "Library", icon: FolderOpen, route: "/media-library", color: "from-amber-500/20 to-orange-500/20" },
            { title: "Insights", icon: BarChart3, route: "/insights", color: "from-pink-500/20 to-rose-500/20" },
          ].map((module) => (
            <Card
              key={module.title}
              onClick={() => navigate(module.route)}
              className={cn(
                "p-4 cursor-pointer transition-all border-white/10",
                "bg-gradient-to-br hover:scale-105",
                module.color
              )}
            >
              <module.icon className="w-8 h-8 text-white/80 mb-3" />
              <p className="font-medium text-white">{module.title}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
