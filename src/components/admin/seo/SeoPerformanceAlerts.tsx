import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface PerformanceAlertConfig {
  ctrDrop: boolean;
  positionDrop: boolean;
  trafficSpike: boolean;
}

interface Props {
  metrics7d: {
    clicks?: number;
    ctr?: number;
    position?: number;
  } | null;
  metrics28d: {
    clicks?: number;
    ctr?: number;
    position?: number;
  } | null;
}

export function detectPerformanceAlerts(
  metrics7d: Props['metrics7d'],
  metrics28d: Props['metrics28d']
): PerformanceAlertConfig {
  const result: PerformanceAlertConfig = {
    ctrDrop: false,
    positionDrop: false,
    trafficSpike: false
  };

  if (!metrics7d || !metrics28d) return result;

  // CTR drop: ctr_7d < ctr_28d * 0.85
  if (
    metrics7d.ctr != null && 
    metrics28d.ctr != null && 
    metrics28d.ctr > 0 &&
    metrics7d.ctr < metrics28d.ctr * 0.85
  ) {
    result.ctrDrop = true;
  }

  // Position drop: position_7d > position_28d + 2
  if (
    metrics7d.position != null && 
    metrics28d.position != null &&
    metrics28d.position > 0 &&
    metrics7d.position > metrics28d.position + 2
  ) {
    result.positionDrop = true;
  }

  // Traffic spike: clicks_7d > clicks_28d * 1.3
  // Normalize 28d clicks to 7d equivalent
  if (
    metrics7d.clicks != null && 
    metrics28d.clicks != null &&
    metrics28d.clicks > 0
  ) {
    const clicks28dNormalized = metrics28d.clicks / 4; // 28 days -> 7 day average
    if (metrics7d.clicks > clicks28dNormalized * 1.3) {
      result.trafficSpike = true;
    }
  }

  return result;
}

export function SeoPerformanceAlertBadges({ 
  metrics7d, 
  metrics28d 
}: Props) {
  const alerts = detectPerformanceAlerts(metrics7d, metrics28d);
  
  const hasAlerts = alerts.ctrDrop || alerts.positionDrop || alerts.trafficSpike;
  if (!hasAlerts) return null;

  return (
    <TooltipProvider>
      <div className="flex gap-1 flex-wrap">
        {alerts.ctrDrop && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-orange-300 text-orange-600 bg-orange-50">
                🔻 CTR
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              CTR dropped vs last 28 days
            </TooltipContent>
          </Tooltip>
        )}
        {alerts.positionDrop && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-red-300 text-red-600 bg-red-50">
                🔻 Pos
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Position dropped vs last 28 days
            </TooltipContent>
          </Tooltip>
        )}
        {alerts.trafficSpike && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-green-300 text-green-600 bg-green-50">
                🔺 Traffic
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Traffic spike vs last 28 days
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
