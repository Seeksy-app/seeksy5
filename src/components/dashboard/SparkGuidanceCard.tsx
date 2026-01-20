import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SparkGuidanceCardProps {
  firstName?: string;
  modulesCount?: number;
}

export const SparkGuidanceCard = ({ firstName, modulesCount = 0 }: SparkGuidanceCardProps) => {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem("spark-guidance-dismissed") === "true";
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("spark-guidance-dismissed", "true");
  };

  const handleAskSpark = () => {
    const event = new CustomEvent("open-spark-chat");
    window.dispatchEvent(event);
  };

  // Only show for users with few modules (new users)
  if (isDismissed || modulesCount > 5) return null;

  const getMessage = () => {
    if (modulesCount === 0) {
      return "Head to Apps to add your first Seeksy and unlock your dashboard.";
    }
    if (modulesCount <= 2) {
      return "Great start! I can help you set up your newly added apps.";
    }
    return "Need help getting the most out of your workspace? Just ask!";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="w-full mb-6"
      >
        <div className="relative bg-gradient-to-r from-cyan-500/10 via-primary/10 to-purple-500/10 border border-primary/20 rounded-xl p-4 overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 blur-xl" />
          
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-primary shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {firstName ? `Hey ${firstName}!` : "Hey there!"} 
                  <span className="text-muted-foreground font-normal ml-1">
                    {getMessage()}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleAskSpark}
                className="gap-1.5 bg-background/80 hover:bg-background"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Ask Spark
                <ArrowRight className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
