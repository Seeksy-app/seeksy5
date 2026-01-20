import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GripVertical, Calendar, Clock, Users, Link2, Vote, Radio, FileText, Info } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface ProfileSection {
  id: string;
  type: string; // 'events', 'meetings', 'signup_sheets', 'polls', 'podcasts', 'blog', or 'custom_section:section_name'
  label: string;
  isVisible: boolean;
  displayOrder: number;
}

interface ProfileSectionOrderingProps {
  sections: ProfileSection[];
  onSectionsChange: (sections: ProfileSection[]) => void;
}

interface SortableSectionProps {
  section: ProfileSection;
  onToggleVisibility: (id: string) => void;
}

const SortableSection = ({ section, onToggleVisibility }: SortableSectionProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getIcon = (type: string) => {
    if (type === 'events') return <Calendar className="h-5 w-5 text-primary" />;
    if (type === 'meetings') return <Clock className="h-5 w-5 text-primary" />;
    if (type === 'signup_sheets') return <Users className="h-5 w-5 text-primary" />;
    if (type === 'polls') return <Vote className="h-5 w-5 text-primary" />;
    if (type === 'podcasts') return <Radio className="h-5 w-5 text-primary" />;
    if (type === 'blog') return <FileText className="h-5 w-5 text-primary" />;
    return <Link2 className="h-5 w-5 text-primary" />;
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="p-4 hover:border-primary/50 transition-colors">
        <div className="flex items-center gap-3">
          <button
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <div className="flex items-center gap-3 flex-1">
            {getIcon(section.type)}
            <span className="font-medium">{section.label}</span>
            {section.type === 'blog' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>See blog settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor={`visible-${section.id}`} className="text-sm text-muted-foreground cursor-pointer">
              {section.isVisible ? "Visible" : "Hidden"}
            </Label>
            <Switch
              id={`visible-${section.id}`}
              checked={section.isVisible}
              onCheckedChange={() => onToggleVisibility(section.id)}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export const ProfileSectionOrdering = ({ sections, onSectionsChange }: ProfileSectionOrderingProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(sections, oldIndex, newIndex);
      
      // Update display_order for all items
      const updated = reordered.map((item, index) => ({
        ...item,
        displayOrder: index,
      }));
      
      onSectionsChange(updated);
    }
  };

  const handleToggleVisibility = (id: string) => {
    const updated = sections.map(section =>
      section.id === id
        ? { ...section, isVisible: !section.isVisible }
        : section
    );
    onSectionsChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Section Order</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag sections to reorder how they appear on your profile page. Toggle visibility to show or hide sections.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onToggleVisibility={handleToggleVisibility}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
