/**
 * SeoLinkStatusChip - Compact status chip for SEO/GBP link status
 * 
 * Used in both GBP locations list and SEO pages list
 * Clickable to navigate to the linked page
 */

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link2, Link2Off, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type LinkStatus = 'linked' | 'warning' | 'out_of_sync' | 'not_linked';

interface SeoLinkStatusChipProps {
  status: LinkStatus;
  targetType: 'seo' | 'gbp';
  targetId?: string;
  targetTitle?: string;
  onClick?: () => void;
}

export function SeoLinkStatusChip({ 
  status, 
  targetType,
  targetId,
  targetTitle,
  onClick
}: SeoLinkStatusChipProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else if (targetId) {
      if (targetType === 'seo') {
        navigate(`/admin/seo/${targetId}`);
      } else {
        navigate(`/admin/gbp/location/${targetId}`);
      }
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'linked':
        return {
          icon: CheckCircle2,
          label: '🟢',
          className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
          tooltip: 'Linked & In Sync'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          label: '🟡',
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
          tooltip: 'Linked with Drift'
        };
      case 'out_of_sync':
        return {
          icon: AlertCircle,
          label: '🔴',
          className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
          tooltip: 'Out of Sync'
        };
      case 'not_linked':
      default:
        return {
          icon: Link2Off,
          label: '⚪',
          className: 'bg-muted text-muted-foreground border-muted hover:bg-muted/80',
          tooltip: 'Not Linked'
        };
    }
  };

  const config = getStatusConfig();
  const isClickable = status !== 'not_linked' && (targetId || onClick);

  const chipContent = (
    <Badge
      variant="outline"
      className={cn(
        "text-xs px-1.5 py-0.5 font-normal transition-colors",
        config.className,
        isClickable && "cursor-pointer"
      )}
      onClick={isClickable ? handleClick : undefined}
    >
      <span className="text-xs">{config.label}</span>
    </Badge>
  );

  if (!isClickable) {
    return chipContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {chipContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium text-sm">{config.tooltip}</p>
            {targetTitle && (
              <p className="text-xs text-muted-foreground">
                {targetType === 'seo' ? 'SEO Page: ' : 'GBP Location: '}
                {targetTitle}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Click to view {targetType === 'seo' ? 'SEO page' : 'GBP location'}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
