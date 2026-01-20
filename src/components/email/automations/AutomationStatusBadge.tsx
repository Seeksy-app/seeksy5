import { Badge } from "@/components/ui/badge";
import { Play, Pause } from "lucide-react";

interface AutomationStatusBadgeProps {
  isActive: boolean;
}

export const AutomationStatusBadge = ({ isActive }: AutomationStatusBadgeProps) => {
  if (isActive) {
    return (
      <Badge variant="default" className="gap-1">
        <Play className="h-3 w-3" />
        Running
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <Pause className="h-3 w-3" />
      Paused
    </Badge>
  );
};
