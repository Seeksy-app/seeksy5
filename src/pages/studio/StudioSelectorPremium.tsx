import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Video, Radio, Sparkles, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StudioOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
  glowColor: string;
  route: string;
  comingSoon?: boolean;
}

const studioOptions: StudioOption[] = [
  {
    id: "audio",
    title: "Audio Podcast Studio",
    description: "Record crystal-clear audio with live transcription, voice enhancement, and automatic clipping.",
    icon: Mic,
    accentColor: "from-teal-500 to-cyan-400",
    glowColor: "shadow-teal-500/20",
    route: "/studio/audio-premium",
  },
  {
    id: "video",
    title: "Video Podcast Studio",
    description: "Cinematic multi-camera video recording with AI-powered live editing and auto-clip creation.",
    icon: Video,
    accentColor: "from-blue-500 to-indigo-400",
    glowColor: "shadow-blue-500/20",
    route: "/studio/video-premium",
  },
  {
    id: "livestream",
    title: "Livestream Studio",
    description: "Go live to multiple platforms with transitions, overlays, and real-time engagement tools.",
    icon: Radio,
    accentColor: "from-purple-500 to-violet-400",
    glowColor: "shadow-purple-500/20",
    route: "/studio/live",
  },
  {
    id: "ai-cohost",
    title: "AI Co-Host Studio",
    description: "Record episodes with an AI co-host that helps with topics, pacing, and conversation flow.",
    icon: Sparkles,
    accentColor: "from-amber-500 to-yellow-400",
    glowColor: "shadow-amber-500/20",
    route: "/studio/ai-cohost",
    comingSoon: true,
  },
];

export default function StudioSelectorPremium() {
  const navigate = useNavigate();
  const [hoveredStudio, setHoveredStudio] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#0D1117] to-[#11151C]">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/3 rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10 container max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-white/70">Seeksy Studio Suite</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Choose Your Studio
          </h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
            Professional-grade recording environments powered by AI. 
            Create content that stands out.
          </p>
        </motion.div>

        {/* Studio Options Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {studioOptions.map((studio, index) => (
            <motion.div
              key={studio.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                className={cn(
                  "relative overflow-hidden border-0 bg-white/[0.03] backdrop-blur-xl cursor-pointer transition-all duration-500 group",
                  "hover:bg-white/[0.06]",
                  hoveredStudio === studio.id && `shadow-2xl ${studio.glowColor}`,
                  studio.comingSoon && "opacity-60 cursor-not-allowed"
                )}
                onMouseEnter={() => setHoveredStudio(studio.id)}
                onMouseLeave={() => setHoveredStudio(null)}
                onClick={() => !studio.comingSoon && navigate(studio.route)}
              >
                {/* Glow effect on hover */}
                <div className={cn(
                  "absolute inset-0 opacity-0 transition-opacity duration-500 bg-gradient-to-br",
                  studio.accentColor,
                  hoveredStudio === studio.id && "opacity-[0.08]"
                )} />
                
                {/* Border glow */}
                <div className={cn(
                  "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500",
                  "ring-1 ring-inset",
                  hoveredStudio === studio.id && "opacity-100 ring-white/20"
                )} />

                <div className="relative p-8">
                  <div className="flex items-start justify-between mb-6">
                    {/* Icon container with gradient */}
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center",
                      "bg-gradient-to-br",
                      studio.accentColor,
                      "shadow-lg",
                      studio.glowColor
                    )}>
                      <studio.icon className="w-8 h-8 text-white" />
                    </div>
                    {studio.comingSoon && (
                      <Badge className="bg-white/10 text-white/70 border-0 px-3 py-1">
                        Coming Soon
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-2xl font-semibold text-white mb-3">
                    {studio.title}
                  </h3>
                  <p className="text-white/50 leading-relaxed mb-6">
                    {studio.description}
                  </p>

                  {/* CTA */}
                  <div className={cn(
                    "flex items-center gap-2 text-white/60 transition-all duration-300",
                    !studio.comingSoon && "group-hover:text-white group-hover:gap-3"
                  )}>
                    <span className="text-sm font-medium">
                      {studio.comingSoon ? "Notify Me" : "Enter Studio"}
                    </span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom hint */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-white/30 text-sm mt-12"
        >
          Need help choosing? <button className="text-white/50 hover:text-white underline underline-offset-4">View comparison</button>
        </motion.p>
      </div>
    </div>
  );
}
