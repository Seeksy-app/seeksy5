import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface RecommendedModulesBarProps {
  recommendations?: { id: string; label: string; route: string }[];
}

export const RecommendedModulesBar = ({ recommendations }: RecommendedModulesBarProps) => {
  // Default recommendations if none provided
  const defaultRecommendations = [
    { id: "events", label: "Events", route: "/events" },
  ];

  const modules = recommendations?.length ? recommendations : defaultRecommendations;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="mb-8 p-4 rounded-xl bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 border border-primary/10"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-purple-500 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Recommended Seeksies</h4>
            <p className="text-xs text-muted-foreground">Add these modules to unlock more features for your workspace</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {modules.map((mod) => (
            <Button
              key={mod.id}
              variant="outline"
              size="sm"
              className="gap-1.5 bg-white hover:bg-white hover:shadow-sm"
              onClick={() => window.location.href = mod.route}
            >
              <Calendar className="h-3.5 w-3.5" />
              {mod.label}
              <ArrowRight className="h-3 w-3" />
            </Button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
