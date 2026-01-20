import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type ExternalIntegration } from "./collectionData";
import { Link2, Check } from "lucide-react";

interface IntegrationCardProps {
  integration: ExternalIntegration;
  isConnected?: boolean;
  onConnect: () => void;
}

export function IntegrationCard({
  integration,
  isConnected,
  onConnect,
}: IntegrationCardProps) {
  const categoryLabels: Record<string, string> = {
    calendar: "Calendar",
    communication: "Communication",
    storage: "Storage",
    analytics: "Analytics",
    payment: "Payment",
    social: "Social",
  };

  return (
    <Card
      className={cn(
        "group relative p-5 transition-all duration-200 cursor-pointer",
        "hover:shadow-md hover:border-primary/30",
        isConnected && "border-emerald-200 dark:border-emerald-800/50"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div 
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0",
            integration.bgColor
          )}
        >
          {integration.logoIcon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm">{integration.name}</h3>
            {isConnected && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">
                <Check className="h-3 w-3 mr-0.5" />
                Connected
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {integration.description}
          </p>
          
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[10px] capitalize">
              {categoryLabels[integration.category]}
            </Badge>
            
            <Button
              size="sm"
              variant={isConnected ? "secondary" : "outline"}
              className="h-7 text-xs gap-1"
              onClick={(e) => {
                e.stopPropagation();
                onConnect();
              }}
              disabled={isConnected}
            >
              {isConnected ? (
                <>
                  <Check className="h-3 w-3" />
                  Connected
                </>
              ) : (
                <>
                  <Link2 className="h-3 w-3" />
                  Connect
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
