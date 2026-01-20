import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Edit2, LucideIcon } from "lucide-react";
import { AppAudioPlayer } from "@/components/apps/AppAudioPlayer";

interface IntegrationCardProps {
  id: string;
  icon: LucideIcon;
  iconGradient: string;
  title: string;
  subtitle?: string;
  description: string;
  tooltip?: string;
  isActive: boolean;
  isAdmin: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  actionLabel?: string;
  audioUrl?: string | null;
  avatarUrl?: string | null;
}

export function IntegrationCard({
  id,
  icon: Icon,
  iconGradient,
  title,
  subtitle = "By Seeksy",
  description,
  tooltip,
  isActive,
  isAdmin,
  onToggle,
  onEdit,
  actionLabel,
  audioUrl,
  avatarUrl,
}: IntegrationCardProps) {
  return (
    <Card className="p-6 hover:border-primary/50 transition-all flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${iconGradient} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onEdit}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
          <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{title}</h3>
                  <AppAudioPlayer appId={id} audioUrl={audioUrl} avatarUrl={avatarUrl} size="sm" />
                </div>
              </TooltipTrigger>
              {tooltip && (
                <TooltipContent className="max-w-xs bg-popover border shadow-md z-50">
                  <p className="text-sm">{tooltip}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      
      <Button 
        onClick={onToggle}
        variant={isActive ? "outline" : "default"}
        size="sm"
        className="w-full mt-4"
      >
        {actionLabel || (isActive ? "Deactivate" : "Activate")}
      </Button>
    </Card>
  );
}
