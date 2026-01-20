import { ReactNode } from "react";
import { GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MyDaySection as SectionType } from "./myDayWidgets";

interface MyDaySectionProps {
  section: SectionType;
  children: ReactNode;
  isCustomizing: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function MyDaySection({ 
  section, 
  children, 
  isCustomizing,
  isOpen = true,
  onToggle,
}: MyDaySectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: section.id,
    disabled: !isCustomizing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = section.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-full mb-8 transition-all duration-200",
        isDragging && "opacity-50 scale-[0.98]",
        isCustomizing && "ring-2 ring-dashed ring-primary/20 rounded-xl p-4 bg-muted/30"
      )}
    >
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <div className="flex items-center gap-3 mb-4">
          {isCustomizing && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          
          <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary transition-colors">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          
          <Icon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
        </div>

        <CollapsibleContent className="transition-all">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
