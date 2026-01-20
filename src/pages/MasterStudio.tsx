import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Video, User, Radio, FolderOpen, Scissors, Wand2, FileAudio, BookOpen, Award, Sparkles, Palette } from "lucide-react";
import { StudioModeSelector } from "@/components/studio/StudioModeSelector";
import { RecentProjectsFeed } from "@/components/studio/RecentProjectsFeed";
import { useState } from "react";

export default function MasterStudio() {
  const navigate = useNavigate();
  const [showModeSelector, setShowModeSelector] = useState(false);

  // Fetch user's podcasts for audio podcast routing
  const { data: podcasts } = useQuery({
    queryKey: ["user-podcasts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data;
    },
  });

  const handleAudioPodcast = () => {
    if (!podcasts || podcasts.length === 0) {
      navigate("/podcasts");
      return;
    }
    
    if (podcasts.length === 1) {
      navigate(`/podcasts/${podcasts[0].id}?tab=studio`);
    } else {
      // Multiple podcasts - let user choose
      navigate("/podcasts");
    }
  };

  const creationOptions = [
    {
      title: "Audio Podcast Episode",
      description: "Record, edit, and publish audio-only podcast episodes",
      icon: Mic,
      color: "from-purple-500 to-purple-600",
      action: handleAudioPodcast,
    },
    {
      title: "Video Podcast (Remote Guests)",
      description: "Record video podcasts with remote guests, multi-camera layouts",
      icon: Video,
      color: "from-blue-500 to-blue-600",
      action: () => navigate("/studio/video"),
    },
    {
      title: "Solo Video Recording",
      description: "Record yourself with professional video tools",
      icon: User,
      color: "from-green-500 to-green-600",
      action: () => navigate("/studio/video?mode=solo"),
    },
    {
      title: "Live Stream",
      description: "Go live to multiple platforms simultaneously",
      icon: Radio,
      color: "from-red-500 to-red-600",
      action: () => navigate("/studio/live"),
    },
  ];

  const studioTools = [
    {
      title: "Media Library",
      description: "Browse all your recordings",
      icon: FolderOpen,
      route: "/media-library",
    },
    {
      title: "Create Clips",
      description: "Edit and create clips",
      icon: Scissors,
      route: "/create-clips",
    },
    {
      title: "AI Audio Cleanup",
      description: "Enhance audio quality",
      icon: Wand2,
      route: "/media-library",
    },
    {
      title: "AI Script Generator",
      description: "Generate podcast scripts",
      icon: FileAudio,
      route: "/podcasts",
    },
    {
      title: "Tutorials",
      description: "Learn studio features",
      icon: BookOpen,
      route: "#",
    },
    {
      title: "Voice Certification",
      description: "Certify your voice",
      icon: Award,
      route: "/voice-certification-flow",
    },
    {
      title: "Voice Credentials",
      description: "Manage voice profiles",
      icon: Sparkles,
      route: "/voice-credentials",
    },
    {
      title: "Templates",
      description: "Studio templates",
      icon: Palette,
      route: "#",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <StudioModeSelector open={showModeSelector} onOpenChange={setShowModeSelector} />
      
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            What do you want to create today?
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose your creation mode and start producing professional content with Seeksy's unified studio experience.
          </p>
        </div>

        {/* Creation Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {creationOptions.map((option, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
              onClick={option.action}
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <CardHeader className="relative">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <option.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                  {option.title}
                </CardTitle>
                <CardDescription className="text-base">
                  {option.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative">
                <Button
                  variant="ghost"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Action Button */}
        <div className="flex justify-center mt-8">
          <Button
            size="lg"
            onClick={() => setShowModeSelector(true)}
            className="gap-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 hover:from-primary/90 hover:via-purple-600 hover:to-pink-600"
          >
            <Sparkles className="w-5 h-5" />
            Quick Start: Choose Mode
          </Button>
        </div>

        {/* Studio Tools Panel */}
        <div className="mt-16 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Studio Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {studioTools.map((tool, index) => (
              <Card
                key={index}
                className="group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 hover:border-primary/50"
                onClick={() => tool.route !== "#" && navigate(tool.route)}
              >
                <CardHeader className="text-center pb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <tool.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-sm">{tool.title}</CardTitle>
                  <CardDescription className="text-xs">{tool.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="mt-16 max-w-6xl mx-auto">
          <RecentProjectsFeed />
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            All your creation tools in one place • Professional quality • Easy to use
          </p>
        </div>
      </div>
    </div>
  );
}
