import { Badge } from "@/components/ui/badge";
import { Smartphone, Monitor, Square } from "lucide-react";
import { VideoOrientation, getOrientationBadgeColor, getOrientationLabel } from "@/utils/videoOrientation";

interface VideoOrientationBadgeProps {
  orientation: VideoOrientation;
  className?: string;
}

export function VideoOrientationBadge({ orientation, className = "" }: VideoOrientationBadgeProps) {
  const Icon = orientation === 'portrait' ? Smartphone : orientation === 'square' ? Square : Monitor;
  const colorClass = getOrientationBadgeColor(orientation);
  const label = getOrientationLabel(orientation);
  
  return (
    <Badge variant="outline" className={`${colorClass} ${className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}
