import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Video, Radio, Bot, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudioOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  route: string;
  features: string[];
  comingSoon?: boolean;
}

const studioOptions: StudioOption[] = [
  {
    id: "audio",
    title: "Audio Podcast Studio",
    description: "Professional audio recording with AI enhancement, real-time transcription, and auto-clips.",
    icon: Mic,
    gradient: "from-violet-500/20 to-purple-600/20",
    route: "/studio/audio",
    features: ["Multi-track recording", "AI noise removal", "Live transcription", "Auto-clips"],
  },
  {
    id: "video",
    title: "Video Podcast Studio",
    description: "Cinematic video podcasts with multi-guest support, scene presets, and AI editing.",
    icon: Video,
    gradient: "from-blue-500/20 to-cyan-500/20",
    route: "/studio/video",
    features: ["Multi-guest recording", "Scene presets", "Real-time captions", "Auto zoom"],
  },
  {
    id: "livestream",
    title: "Livestream Studio",
    description: "Go live to multiple platforms with real-time engagement and stream overlays.",
    icon: Radio,
    gradient: "from-red-500/20 to-orange-500/20",
    route: "/studio/live",
    features: ["Multi-platform", "Live chat", "Stream overlays", "Real-time analytics"],
  },
  {
    id: "ai-cohost",
    title: "AI Co-Host Studio",
    description: "Record with an AI co-host that responds naturally and keeps the conversation flowing.",
    icon: Bot,
    gradient: "from-emerald-500/20 to-teal-500/20",
    route: "/studio/ai-cohost",
    features: ["AI conversation", "Topic suggestions", "Auto-research", "Dynamic responses"],
    comingSoon: true,
  },
];

export default function StudioSelector() {
  const navigate = useNavigate();
  const [hoveredStudio, setHoveredStudio] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 container max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-white/70">Seeksy Pro Studios</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Studio
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Professional-grade recording environments powered by AI. 
            Create podcasts, videos, and livestreams with studio-quality results.
          </p>
        </div>

        {/* Studio Options Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {studioOptions.map((studio) => (
            <Card
              key={studio.id}
              className={cn(
                "relative overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl cursor-pointer transition-all duration-500",
                "hover:border-white/20 hover:bg-white/[0.08]",
                hoveredStudio === studio.id && "scale-[1.02] border-white/25",
                studio.comingSoon && "opacity-60 cursor-not-allowed"
              )}
              onMouseEnter={() => setHoveredStudio(studio.id)}
              onMouseLeave={() => setHoveredStudio(null)}
              onClick={() => !studio.comingSoon && navigate(studio.route)}
            >
              {/* Gradient overlay */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500",
                studio.gradient,
                hoveredStudio === studio.id && "opacity-100"
              )} />

              <div className="relative p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center",
                    "bg-gradient-to-br",
                    studio.gradient.replace("/20", "/30")
                  )}>
                    <studio.icon className="w-7 h-7 text-white" />
                  </div>
                  {studio.comingSoon && (
                    <Badge className="bg-white/10 text-white/70 border-0">
                      Coming Soon
                    </Badge>
                  )}
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">
                  {studio.title}
                </h3>
                <p className="text-white/60 mb-6 leading-relaxed">
                  {studio.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {studio.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 text-xs font-medium text-white/70 bg-white/5 rounded-full border border-white/10"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <Button
                  variant="ghost"
                  className={cn(
                    "group text-white/80 hover:text-white hover:bg-white/10 px-0",
                    studio.comingSoon && "pointer-events-none"
                  )}
                >
                  {studio.comingSoon ? "Notify Me" : "Enter Studio"}
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-white/40 text-sm">
            Need help choosing? <button className="text-white/60 hover:text-white underline">View comparison</button>
          </p>
        </div>
      </div>
    </div>
  );
}
