import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, Users, Sparkles, Check, Plus, 
  ArrowRight, Eye
} from "lucide-react";
import { SeeksyCollection } from "@/components/modules/collectionData";
import { SEEKSY_MODULES } from "@/components/modules/moduleData";
import { cn } from "@/lib/utils";

interface AnimatedCollectionCardProps {
  collection: SeeksyCollection;
  isInstalled: boolean;
  onPreview: () => void;
}

export function AnimatedCollectionCard({
  collection,
  isInstalled,
  onPreview,
}: AnimatedCollectionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const Icon = collection.icon;
  
  // Get module details for included apps
  const includedModules = collection.includedApps
    .map(id => SEEKSY_MODULES.find(m => m.id === id))
    .filter(Boolean);

  return (
    <motion.div
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsExpanded(false);
      }}
    >
      <Card 
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all duration-300",
          "border-2",
          isHovered ? "border-primary/50 shadow-xl" : "border-border/50",
          isInstalled && "ring-2 ring-emerald-500/30"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Animated Gradient Background */}
        <motion.div
          className={cn(
            "absolute inset-0 opacity-0 transition-opacity duration-500",
            collection.bgGradient
          )}
          animate={{ opacity: isHovered ? 0.5 : 0 }}
        />
        
        {/* Floating Particles */}
        <AnimatePresence>
          {isHovered && (
            <>
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{ backgroundColor: collection.color }}
                  initial={{ 
                    opacity: 0, 
                    x: Math.random() * 100 + "%", 
                    y: "100%",
                    scale: 0
                  }}
                  animate={{ 
                    opacity: [0, 0.6, 0],
                    y: "-20%",
                    scale: [0, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 2,
                    delay: i * 0.2,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
        
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <motion.div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300",
                isHovered ? "scale-110" : ""
              )}
              style={{ backgroundColor: collection.color }}
              animate={{ 
                boxShadow: isHovered 
                  ? `0 20px 40px -10px ${collection.color}50` 
                  : "0 4px 6px rgba(0,0,0,0.1)"
              }}
            >
              <Icon className="w-7 h-7 text-white" />
            </motion.div>
            
            <div className="flex items-center gap-2">
              {collection.isPopular && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              )}
              {isInstalled && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <Check className="w-3 h-3 mr-1" />
                  Installed
                </Badge>
              )}
            </div>
          </div>
          
          {/* Title & Description */}
          <h3 className="text-xl font-bold text-foreground mb-2">{collection.name}</h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {collection.description}
          </p>
          
          {/* Module Preview - Animated */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex -space-x-2">
              {includedModules.slice(0, 4).map((module, i) => {
                if (!module) return null;
                const ModIcon = module.icon;
                return (
                  <motion.div
                    key={module.id}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center border-2 border-background",
                      module.bgGradient || "bg-muted"
                    )}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.2, zIndex: 10 }}
                  >
                    <ModIcon className={cn("w-4 h-4", module.iconColor || "text-foreground")} />
                  </motion.div>
                );
              })}
              {includedModules.length > 4 && (
                <motion.div
                  className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border-2 border-background text-xs font-medium text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  +{includedModules.length - 4}
                </motion.div>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {collection.includedApps.length} modules
            </span>
          </div>
          
          {/* Expanded Module List */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-4 overflow-hidden"
              >
                <div className="grid gap-2 pt-2 border-t border-border/50">
                  {includedModules.map((module, i) => {
                    if (!module) return null;
                    const ModIcon = module.icon;
                    return (
                      <motion.div
                        key={module.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          module.bgGradient || "bg-muted"
                        )}>
                          <ModIcon className={cn("w-4 h-4", module.iconColor)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground">{module.name}</span>
                          {module.isAIPowered && (
                            <Badge variant="secondary" className="ml-2 text-xs">AI</Badge>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{collection.usersCount?.toLocaleString() || 0} users</span>
            </div>
            
            {/* Always show Preview button - bundles never auto-install */}
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              style={{ 
                backgroundColor: isInstalled ? undefined : collection.color,
                color: isInstalled ? undefined : "white"
              }}
              variant={isInstalled ? "outline" : "default"}
              className={isInstalled ? "" : "hover:opacity-90"}
            >
              <Eye className="w-4 h-4 mr-1" />
              {isInstalled ? "View Bundle" : "View & Install"}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
