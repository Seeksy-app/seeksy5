import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Package, ArrowRight } from "lucide-react";
import { SeeksyCollection } from "@/components/modules/collectionData";
import { cn } from "@/lib/utils";

interface CollectionCardProps {
  collection: SeeksyCollection;
  isInstalled?: boolean;
  onPreview: (collectionId: string) => void;
  compact?: boolean;
}

/**
 * Card component for displaying a collection in the App Store.
 */
export function CollectionCard({
  collection,
  isInstalled = false,
  onPreview,
  compact = false,
}: CollectionCardProps) {
  const CollectionIcon = collection.icon;

  return (
    <Card 
      className={cn(
        "group overflow-hidden transition-all hover:shadow-lg cursor-pointer border-2",
        isInstalled 
          ? "border-primary/30 bg-primary/5" 
          : "border-transparent hover:border-primary/20"
      )}
      onClick={() => onPreview(collection.id)}
    >
      <CardHeader className={cn("pb-2", compact && "p-4")}>
        <div className="flex items-start justify-between">
          <div 
            className={cn(
              "rounded-xl flex items-center justify-center",
              collection.bgGradient,
              compact ? "w-10 h-10" : "w-14 h-14"
            )}
          >
            <CollectionIcon 
              className={cn(compact ? "h-5 w-5" : "h-7 w-7")} 
              style={{ color: collection.color }} 
            />
          </div>
          
          <div className="flex items-center gap-2">
            {collection.isPopular && (
              <Badge 
                variant="secondary" 
                className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs"
              >
                Popular
              </Badge>
            )}
            {isInstalled && (
              <Badge variant="outline" className="text-primary border-primary/30 text-xs">
                Installed
              </Badge>
            )}
          </div>
        </div>

        <CardTitle className={cn("mt-3", compact ? "text-base" : "text-lg")}>
          {collection.name}
        </CardTitle>
        
        <CardDescription className={cn("line-clamp-2", compact && "text-xs")}>
          {collection.description}
        </CardDescription>
      </CardHeader>

      <CardContent className={cn("pt-0", compact && "p-4 pt-0")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Package className="h-3.5 w-3.5" />
              {collection.includedApps.length} apps
            </span>
            {collection.usersCount && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {collection.usersCount.toLocaleString()}
              </span>
            )}
          </div>

          <Button 
            variant="ghost" 
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isInstalled ? 'View' : 'Preview'}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
