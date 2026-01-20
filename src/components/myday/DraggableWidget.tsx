import { ReactNode } from "react";
import { GripVertical, X, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MyDayWidget } from "./myDayWidgets";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DraggableWidgetProps {
  widget: MyDayWidget;
  children: ReactNode;
  isCustomizing: boolean;
  onHide?: () => void;
}

export function DraggableWidget({
  widget,
  children,
  isCustomizing,
  onHide,
}: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
    disabled: !isCustomizing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative transition-all duration-200",
        isDragging && "opacity-50 scale-[0.98] z-50",
        isCustomizing && "ring-2 ring-dashed ring-primary/30 rounded-lg"
      )}
    >
      {isCustomizing && (
        <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1">
          {widget.isHideable && onHide && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6 rounded-full shadow-md bg-background border"
                  onClick={onHide}
                >
                  <EyeOff className="h-3 w-3 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Hide widget</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
      
      {isCustomizing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1 rounded-md bg-background/80 backdrop-blur-sm shadow-sm hover:bg-muted transition-colors"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      
      {children}
    </div>
  );
}
