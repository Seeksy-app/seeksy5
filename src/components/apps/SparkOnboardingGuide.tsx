import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, ArrowRight, Check, ChevronRight, 
  Mic, Scissors, Calendar, Megaphone, Shield, PieChart,
  Wand2
} from "lucide-react";
import { USER_INTENTS, UserIntent } from "@/config/moduleRelationships";
import { SEEKSY_MODULES } from "@/components/modules/moduleData";
import { cn } from "@/lib/utils";

interface SparkOnboardingGuideProps {
  onSelectIntent: (intent: UserIntent) => void;
  onSkip: () => void;
  installedModuleIds?: string[];
}

export function SparkOnboardingGuide({ 
  onSelectIntent, 
  onSkip,
  installedModuleIds = []
}: SparkOnboardingGuideProps) {
  const [hoveredIntent, setHoveredIntent] = useState<string | null>(null);
  const [selectedIntent, setSelectedIntent] = useState<UserIntent | null>(null);

  const handleIntentClick = (intent: UserIntent) => {
    setSelectedIntent(intent);
  };

  const handleConfirm = () => {
    if (selectedIntent) {
      onSelectIntent(selectedIntent);
    }
  };

  const getModuleName = (moduleId: string) => {
    return SEEKSY_MODULES.find(m => m.id === moduleId)?.name || moduleId;
  };

  return (
    <div className="relative">
      {/* Animated Spark Avatar */}
      <motion.div 
        className="flex items-center gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="relative"
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <motion.div
            className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-amber-400/30 via-orange-500/30 to-rose-500/30 -z-10 blur-sm"
            animate={{ 
              opacity: [0.5, 0.8, 0.5],
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Hi! I'm Spark</h2>
          <p className="text-muted-foreground">Let's build your perfect workspace together</p>
        </div>
      </motion.div>

      {/* Intent Question */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-6"
      >
        <h3 className="text-xl font-semibold text-foreground mb-2">
          What do you want to do?
        </h3>
        <p className="text-muted-foreground text-sm">
          I'll suggest the right tools for your workflow
        </p>
      </motion.div>

      {/* Intent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {USER_INTENTS.map((intent, index) => {
          const Icon = intent.icon;
          const isSelected = selectedIntent?.id === intent.id;
          const isHovered = hoveredIntent === intent.id;
          
          return (
            <motion.div
              key={intent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
            >
              <Card
                className={cn(
                  "relative p-5 cursor-pointer transition-all duration-300 overflow-hidden group",
                  "border-2",
                  isSelected 
                    ? "border-primary bg-primary/5 shadow-lg" 
                    : "border-border/50 hover:border-primary/50 hover:shadow-md"
                )}
                onClick={() => handleIntentClick(intent)}
                onMouseEnter={() => setHoveredIntent(intent.id)}
                onMouseLeave={() => setHoveredIntent(null)}
              >
                {/* Gradient Background on Hover/Select */}
                <motion.div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300",
                    intent.color
                  )}
                  animate={{ opacity: isSelected ? 0.05 : isHovered ? 0.03 : 0 }}
                />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <motion.div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                        isSelected 
                          ? `bg-gradient-to-br ${intent.color} text-white shadow-lg` 
                          : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      )}
                      animate={{ scale: isSelected ? 1.1 : 1 }}
                    >
                      <Icon className="w-6 h-6" />
                    </motion.div>
                    
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </motion.div>
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-foreground mb-1">{intent.label}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{intent.description}</p>
                  
                  {/* Suggested Modules Preview */}
                  <AnimatePresence>
                    {(isHovered || isSelected) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2"
                      >
                        <div className="flex flex-wrap gap-1.5">
                          {intent.suggestedModules.slice(0, 3).map(moduleId => (
                            <Badge 
                              key={moduleId} 
                              variant="secondary" 
                              className="text-xs"
                            >
                              {getModuleName(moduleId)}
                            </Badge>
                          ))}
                          {intent.suggestedModules.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{intent.suggestedModules.length - 3}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Wand2 className="w-3 h-3" />
                          {intent.workflow}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-between"
      >
        <Button 
          variant="ghost" 
          onClick={onSkip}
          className="text-muted-foreground"
        >
          Skip, I'll browse manually
        </Button>
        
        <Button
          onClick={handleConfirm}
          disabled={!selectedIntent}
          className={cn(
            "gap-2 transition-all duration-300",
            selectedIntent 
              ? `bg-gradient-to-r ${selectedIntent.color} hover:opacity-90` 
              : ""
          )}
        >
          {selectedIntent ? (
            <>
              Set up {selectedIntent.label}
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            "Select what you want to do"
          )}
        </Button>
      </motion.div>
    </div>
  );
}
