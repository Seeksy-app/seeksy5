import { Check, Plus, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type SeeksyCollection } from "./collectionData";
import { SEEKSY_MODULES } from "./moduleData";

interface CollectionCardProps {
  collection: SeeksyCollection;
  isInstalled?: boolean;
  isInstalling?: boolean;
  onInstall: () => void;
  onClick: () => void;
}

export function CollectionCard({
  collection,
  isInstalled,
  isInstalling,
  onInstall,
  onClick,
}: CollectionCardProps) {
  const Icon = collection.icon;
  
  // Get the actual module data for included apps
  const includedModules = collection.includedApps
    .map(id => SEEKSY_MODULES.find(m => m.id === id))
    .filter(Boolean);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 cursor-pointer",
        "hover:shadow-xl hover:-translate-y-1 hover:border-primary/30",
        isInstalled && "border-emerald-200 dark:border-emerald-800/50"
      )}
      onClick={onClick}
    >
      {/* Gradient Header */}
      <div className={cn("h-28 relative", collection.bgGradient)}>
        {/* Popular badge */}
        {collection.isPopular && (
          <Badge className="absolute top-3 left-3 bg-amber-500 text-white border-0 text-[10px] shadow-lg">
            ⭐ Popular
          </Badge>
        )}
        
        {/* Users count */}
        {collection.usersCount && (
          <div className="absolute top-3 right-3 flex items-center gap-1 text-xs font-medium text-muted-foreground/80 bg-white/80 dark:bg-black/30 rounded-full px-2 py-1">
            <Users className="h-3 w-3" />
            {(collection.usersCount / 1000).toFixed(1)}K
          </div>
        )}
        
        {/* Large Icon */}
        <div className="absolute -bottom-6 left-5">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ring-4 ring-background"
            style={{ backgroundColor: collection.color }}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5 pt-9">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-base">{collection.name}</h3>
          {isInstalled && (
            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] shrink-0">
              <Check className="h-3 w-3 mr-0.5" />
              Added
            </Badge>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {collection.description}
        </p>
        
        {/* Included apps preview */}
        <div className="space-y-2 mb-4">
          <p className="text-xs font-medium text-muted-foreground">
            Includes {collection.includedApps.length} apps:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {includedModules.slice(0, 4).map((module) => {
              if (!module) return null;
              const ModuleIcon = module.icon;
              return (
                <div
                  key={module.id}
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center",
                    module.bgGradient || "bg-muted"
                  )}
                  title={module.name}
                >
                  <ModuleIcon className={cn("h-3.5 w-3.5", module.iconColor || "text-primary")} />
                </div>
              );
            })}
            {includedModules.length > 4 && (
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                +{includedModules.length - 4}
              </div>
            )}
          </div>
        </div>
        
        {/* Action button */}
        <Button
          size="sm"
          className="w-full gap-1.5"
          variant={isInstalled ? "secondary" : "default"}
          onClick={(e) => {
            e.stopPropagation();
            if (!isInstalled) onInstall();
          }}
          disabled={isInstalling || isInstalled}
        >
          {isInstalling ? (
            <>
              <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Adding...
            </>
          ) : isInstalled ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Collection Added
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              Use Collection
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
