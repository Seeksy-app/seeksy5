import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ChecklistItem } from "@/config/dashboardConfig";

interface SetupChecklistProps {
  items: ChecklistItem[];
  completedItems: string[];
  onDismiss?: () => void;
}

export function SetupChecklist({ items, completedItems, onDismiss }: SetupChecklistProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const completedCount = items.filter(item => completedItems.includes(item.id)).length;
  const progress = (completedCount / items.length) * 100;
  const allComplete = completedCount === items.length;

  // Auto-hide after all complete
  useEffect(() => {
    if (allComplete) {
      const timer = setTimeout(() => setDismissed(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [allComplete]);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">Setup Checklist</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {completedCount} of {items.length} complete
                </span>
              </div>
              <div className="flex items-center gap-2">
                {allComplete && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-sm text-emerald-600 font-medium"
                  >
                    All done! 🎉
                  </motion.span>
                )}
                <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Progress value={progress} className="h-1.5 mt-2" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {items.map((item, index) => {
                const isComplete = completedItems.includes(item.id);
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => !isComplete && navigate(item.route)}
                    disabled={isComplete}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                      isComplete
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "bg-card border border-border hover:border-primary/50 hover:bg-accent/50 cursor-pointer"
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-sm",
                        isComplete && "line-through text-muted-foreground"
                      )}>
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>
                    {!isComplete && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
