import { Grid3x3, User, Users, Pin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type VideoLayout = "speaker" | "grid" | "gallery" | "pinned";

interface VideoLayoutSelectorProps {
  currentLayout: VideoLayout;
  onLayoutChange: (layout: VideoLayout) => void;
  participantCount: number;
}

export const VideoLayoutSelector = ({
  currentLayout,
  onLayoutChange,
  participantCount,
}: VideoLayoutSelectorProps) => {
  const layouts = [
    {
      value: "speaker" as VideoLayout,
      label: "Speaker View",
      icon: User,
      description: "Highlights the active speaker",
    },
    {
      value: "grid" as VideoLayout,
      label: "Grid View",
      icon: Grid3x3,
      description: "Shows all participants equally",
    },
    {
      value: "gallery" as VideoLayout,
      label: "Gallery View",
      icon: Users,
      description: "Customizable participant tiles",
    },
    {
      value: "pinned" as VideoLayout,
      label: "Pin View",
      icon: Pin,
      description: "Lock focus on specific participant",
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Layout:</span>
      
      {/* Desktop: Individual buttons */}
      <div className="hidden md:flex gap-1">
        {layouts.map((layout) => {
          const Icon = layout.icon;
          return (
            <Button
              key={layout.value}
              variant={currentLayout === layout.value ? "default" : "outline"}
              size="sm"
              onClick={() => onLayoutChange(layout.value)}
              title={`${layout.label}: ${layout.description}`}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden lg:inline">{layout.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Mobile: Dropdown */}
      <div className="md:hidden">
        <Select value={currentLayout} onValueChange={(value) => onLayoutChange(value as VideoLayout)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {layouts.map((layout) => {
              const Icon = layout.icon;
              return (
                <SelectItem key={layout.value} value={layout.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{layout.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <span className="text-xs text-muted-foreground ml-2">
        {participantCount} {participantCount === 1 ? "participant" : "participants"}
      </span>
    </div>
  );
};
