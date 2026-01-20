import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Video, Radio, HelpCircle, ArrowRight, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StudioSetupStepProps {
  onSelect: (studioType: string) => void;
  onContinue: () => void;
}

const studioOptions = [
  {
    id: "audio",
    title: "Audio Podcast Studio",
    description: "Best for classic podcasting, interviews, and narration.",
    icon: Mic,
    color: "from-teal-500 to-cyan-400",
    glowColor: "shadow-teal-500/20",
  },
  {
    id: "video",
    title: "Video Podcast Studio",
    description: "Best for YouTube shows, visual podcasts, and multi-guest interviews.",
    icon: Video,
    color: "from-blue-500 to-indigo-400",
    glowColor: "shadow-blue-500/20",
  },
  {
    id: "livestream",
    title: "Livestream Studio",
    description: "Best for live events, webinars, and real-time audience engagement.",
    icon: Radio,
    color: "from-purple-500 to-violet-400",
    glowColor: "shadow-purple-500/20",
  },
  {
    id: "unsure",
    title: "I'm Not Sure Yet",
    description: "Seeksy chooses defaults and guides you to your ideal setup later.",
    icon: HelpCircle,
    color: "from-white/20 to-white/10",
    glowColor: "shadow-white/10",
  },
];

export function StudioSetupStep({ onSelect, onContinue }: StudioSetupStepProps) {
  const [selectedStudio, setSelectedStudio] = useState<string | null>(null);

  const handleSelect = (studioId: string) => {
    setSelectedStudio(studioId);
    onSelect(studioId);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-white/70">Studio Setup</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">
          🎛 Let's Set Up Your Studio
        </h2>
        <p className="text-lg text-white/50">
          How do you plan to create your content?
        </p>
      </motion.div>

      <div className="grid gap-4 mb-8">
        {studioOptions.map((studio, index) => (
          <motion.div
            key={studio.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card
              onClick={() => handleSelect(studio.id)}
              className={cn(
                "relative overflow-hidden border-0 bg-white/[0.03] backdrop-blur-xl cursor-pointer transition-all duration-300 p-6",
                "hover:bg-white/[0.06]",
                selectedStudio === studio.id && `bg-white/[0.08] ring-2 ring-white/20 ${studio.glowColor}`
              )}
            >
              {/* Selection indicator */}
              {selectedStudio === studio.id && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              <div className="flex items-start gap-5">
                {/* Icon */}
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
                  "bg-gradient-to-br",
                  studio.color
                )}>
                  <studio.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {studio.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {studio.description}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center"
      >
        <Button
          onClick={onContinue}
          disabled={!selectedStudio}
          size="lg"
          className={cn(
            "px-8 py-6 h-auto text-base font-medium transition-all",
            selectedStudio
              ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
              : "bg-white/10 text-white/50 cursor-not-allowed"
          )}
        >
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
