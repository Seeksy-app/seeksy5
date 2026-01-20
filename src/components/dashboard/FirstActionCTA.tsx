import { Button } from "@/components/ui/button";
import { ArrowRight, Plus, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface FirstActionCTAProps {
  hasModules: boolean;
  primaryAction?: {
    label: string;
    route: string;
    icon?: React.ReactNode;
  };
}

export const FirstActionCTA = ({ hasModules, primaryAction }: FirstActionCTAProps) => {
  const navigate = useNavigate();

  // If no modules, show "Add your first app" CTA
  if (!hasModules) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full mb-6"
      >
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Ready to get started?</h3>
                <p className="text-sm text-muted-foreground">
                  Add your first Seeksy to unlock your workspace potential.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/apps?view=modules")}
              className="gap-2 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Browse Apps
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // If modules exist and a primary action is provided
  if (primaryAction) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full mb-4"
      >
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate(primaryAction.route)}
          className="w-full sm:w-auto gap-2 justify-center sm:justify-start bg-card hover:bg-accent/50 border-border/50"
        >
          {primaryAction.icon}
          {primaryAction.label}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </motion.div>
    );
  }

  return null;
};
