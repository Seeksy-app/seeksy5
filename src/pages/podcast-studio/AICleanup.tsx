import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Zap, ArrowRight } from "lucide-react";
import { applyAICleanup, type AudioTrack, type CleanupOptions } from "@/lib/api/podcastStudioAPI";

const AICleanup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tracks, duration, micSettings, adReadEvents } = location.state || {};

  const [selectedLevel, setSelectedLevel] = useState<"basic" | "advanced" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectLevel = (level: "basic" | "advanced") => {
    setSelectedLevel(level);
  };

  const handleContinue = async () => {
    if (!selectedLevel || !tracks) return;

    setIsProcessing(true);

    const cleanupOptions: CleanupOptions = {
      level: selectedLevel,
      removeBackground: true,
      enhanceVoice: true,
      normalizeVolume: selectedLevel === "advanced",
    };

    try {
      const { cleanedTracks } = await applyAICleanup(tracks, cleanupOptions);

      navigate("/podcast-studio/save", {
        state: {
          tracks: cleanedTracks,
          duration,
          micSettings,
          cleanupMethod: selectedLevel,
          adReadEvents,
        },
      });
    } catch (error) {
      console.error("Cleanup failed:", error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl p-8 bg-white/95 backdrop-blur">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-[#053877]">
              AI Cleanup Options
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose your audio enhancement level
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Basic Cleanup */}
            <button
              onClick={() => handleSelectLevel("basic")}
              disabled={isProcessing}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                selectedLevel === "basic"
                  ? "border-[#2C6BED] bg-[#2C6BED]/5"
                  : "border-border hover:border-[#2C6BED]/50"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#053877] to-[#2C6BED] flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#053877]">Basic Cleanup</h3>
                    <p className="text-xs text-muted-foreground">Fast & efficient</p>
                  </div>
                </div>

                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2C6BED]" />
                    Remove background noise
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2C6BED]" />
                    Enhance voice clarity
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2C6BED]" />
                    Quick processing
                  </li>
                </ul>
              </div>
            </button>

            {/* Advanced Cleanup */}
            <button
              onClick={() => handleSelectLevel("advanced")}
              disabled={isProcessing}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                selectedLevel === "advanced"
                  ? "border-[#2C6BED] bg-[#2C6BED]/5"
                  : "border-border hover:border-[#2C6BED]/50"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#053877] to-[#2C6BED] flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#053877]">Advanced Cleanup</h3>
                    <p className="text-xs text-muted-foreground">Studio quality</p>
                  </div>
                </div>

                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2C6BED]" />
                    Deep noise reduction
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2C6BED]" />
                    Volume normalization
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2C6BED]" />
                    Professional enhancement
                  </li>
                </ul>
              </div>
            </button>
          </div>

          <Button
            onClick={handleContinue}
            disabled={!selectedLevel || isProcessing}
            className="w-full bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white h-12"
          >
            {isProcessing ? "Processing..." : "Continue"}
            {!isProcessing && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AICleanup;
