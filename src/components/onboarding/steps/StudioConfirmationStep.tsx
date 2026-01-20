import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Mic, Video, Radio, Scissors, FolderOpen, Layout, 
  Fingerprint, Check, ArrowRight, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StudioConfirmationStepProps {
  selectedStudio: string;
  onComplete: () => void;
}

const getStudioDetails = (studioId: string) => {
  switch (studioId) {
    case "audio":
      return {
        title: "Audio Podcast Studio",
        icon: Mic,
        color: "from-teal-500 to-cyan-400",
      };
    case "video":
      return {
        title: "Video Podcast Studio",
        icon: Video,
        color: "from-blue-500 to-indigo-400",
      };
    case "livestream":
      return {
        title: "Livestream Studio",
        icon: Radio,
        color: "from-purple-500 to-violet-400",
      };
    default:
      return {
        title: "Recommended Setup",
        icon: Sparkles,
        color: "from-amber-500 to-yellow-400",
      };
  }
};

const recommendedTools = [
  { icon: Mic, label: "Studio Shortcuts", description: "Quick access to your preferred studio" },
  { icon: FolderOpen, label: "Media Library", description: "Organize all your recordings" },
  { icon: Scissors, label: "Clips Suite", description: "AI-powered clip creation" },
  { icon: Layout, label: "Page Builder", description: "Your public creator page" },
  { icon: Fingerprint, label: "Identity Verification", description: "Voice & face verification" },
];

export function StudioConfirmationStep({ selectedStudio, onComplete }: StudioConfirmationStepProps) {
  const studioDetails = getStudioDetails(selectedStudio);
  const StudioIcon = studioDetails.icon;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center mx-auto mb-6"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
            <Check className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        <h2 className="text-3xl font-bold text-white mb-3">
          Great! We'll customize your dashboard
        </h2>
        <p className="text-lg text-white/50">
          with the tools you need to get started.
        </p>
      </motion.div>

      {/* Selected studio */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-8"
      >
        <Card className="p-6 bg-white/[0.05] border-white/10">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br",
              studioDetails.color
            )}>
              <StudioIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/50 mb-1">Your primary studio</p>
              <h3 className="text-xl font-semibold text-white">{studioDetails.title}</h3>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Recommended tools */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-10"
      >
        <p className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">
          We'll set up these tools for you:
        </p>
        <div className="space-y-3">
          {recommendedTools.map((tool, index) => (
            <motion.div
              key={tool.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5"
            >
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <tool.icon className="w-5 h-5 text-white/70" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{tool.label}</p>
                <p className="text-xs text-white/40">{tool.description}</p>
              </div>
              <Check className="w-5 h-5 text-emerald-400" />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex justify-center"
      >
        <Button
          onClick={onComplete}
          size="lg"
          className="px-8 py-6 h-auto text-base font-medium bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
        >
          Go to My Dashboard
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
