/**
 * SeoGbpLinkBadge - Compact badge showing GBP link status for SEO pages
 * 
 * Used in SEO list to show if a page is linked to a GBP location
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MapPin, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type SyncStatus = 'linked' | 'warning' | 'out_of_sync';

interface SeoGbpLinkBadgeProps {
  gbpLocationId: string;
  gbpLocationTitle: string;
  syncStatus: SyncStatus;
  compact?: boolean;
}

export function SeoGbpLinkBadge({ 
  gbpLocationId, 
  gbpLocationTitle, 
  syncStatus,
  compact = false 
}: SeoGbpLinkBadgeProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/admin/gbp/location/${gbpLocationId}`);
  };

  const statusColors = {
    linked: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
    out_of_sync: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "cursor-pointer gap-1 transition-colors",
              statusColors[syncStatus]
            )}
            onClick={handleClick}
          >
            <MapPin className="h-3 w-3" />
            {!compact && "GBP"}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium text-sm">Linked to GBP Location</p>
            <p className="text-xs text-muted-foreground">{gbpLocationTitle}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              Click to open GBP location
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
