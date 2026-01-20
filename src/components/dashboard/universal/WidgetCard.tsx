import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, ChevronDown, ChevronUp, X, GripVertical, Settings } from "lucide-react";
import { DashboardWidget } from "./types";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface WidgetCardProps {
  widget: DashboardWidget;
  children: React.ReactNode;
  onToggleExpand: () => void;
  onRemove: () => void;
  isDragging?: boolean;
}

export function WidgetCard({ widget, children, onToggleExpand, onRemove, isDragging }: WidgetCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = widget.icon;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "transition-all duration-200",
        isDragging && "opacity-50 shadow-lg scale-[1.02]"
      )}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-muted"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-sm font-medium">{widget.name}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggleExpand}
          >
            {widget.expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onToggleExpand}>
                {widget.expanded ? "Collapse" : "Expand"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRemove} className="text-destructive">
                <X className="h-4 w-4 mr-2" />
                Remove from Dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      {widget.expanded && (
        <CardContent className="pt-2">
          {children}
        </CardContent>
      )}
    </Card>
  );
}
