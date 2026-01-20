import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, GripVertical } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export interface WidgetConfig {
  id: string;
  label: string;
  enabled: boolean;
  category: "mypage" | "engagement" | "email" | "seekies" | "media" | "revenue";
  requiredModule?: string; // Optional module requirement for widget visibility
}

interface DashboardCustomizerProps {
  widgets: WidgetConfig[];
  onSave: (widgets: WidgetConfig[]) => void;
}

interface SortableWidgetItemProps {
  widget: WidgetConfig;
  onToggle: (id: string) => void;
}

const SortableWidgetItem = ({ widget, onToggle }: SortableWidgetItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 py-2 bg-background rounded border"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing px-2 py-1 hover:bg-accent rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Label htmlFor={widget.id} className="cursor-pointer flex-1">
        {widget.label}
      </Label>
      <div className="pr-2">
        <Switch
          id={widget.id}
          checked={widget.enabled}
          onCheckedChange={() => onToggle(widget.id)}
        />
      </div>
    </div>
  );
};

interface CategoryData {
  id: string;
  label: string;
}

interface SortableCategoryProps {
  category: CategoryData;
  widgets: WidgetConfig[];
  onToggle: (id: string) => void;
  onWidgetDragEnd: (event: DragEndEvent, categoryId: string) => void;
}

const SortableCategory = ({ category, widgets, onToggle, onWidgetDragEnd }: SortableCategoryProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div ref={setNodeRef} style={style} className="mb-6">
      <div 
        {...attributes}
        {...listeners}
        className="flex items-center gap-2 mb-3 cursor-grab active:cursor-grabbing hover:bg-accent/50 rounded p-2 -ml-2"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold text-muted-foreground">{category.label}</h4>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => onWidgetDragEnd(event, category.id)}
      >
        <SortableContext
          items={widgets.map(w => w.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 ml-4">
            {widgets.map(widget => (
              <SortableWidgetItem
                key={widget.id}
                widget={widget}
                onToggle={onToggle}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export const DashboardCustomizer = ({ widgets, onSave }: DashboardCustomizerProps) => {
  const [localWidgets, setLocalWidgets] = useState(widgets);
  const [open, setOpen] = useState(false);

  // Always show all categories - no module filtering for customizer
  const [categoryOrder, setCategoryOrder] = useState<CategoryData[]>([
    { id: "mypage", label: "My Page & Profile" },
    { id: "engagement", label: "Engagement & Traffic" },
    { id: "email", label: "Email Analytics" },
    { id: "seekies", label: "Seekies & Content" },
    { id: "media", label: "Media & Podcasts" },
    { id: "revenue", label: "Revenue" },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleWidget = (id: string) => {
    setLocalWidgets(prev =>
      prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w)
    );
  };

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategoryOrder((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleWidgetDragEnd = (event: DragEndEvent, categoryId: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalWidgets((items) => {
        // Only reorder within the same category
        const categoryWidgets = items.filter(w => w.category === categoryId);
        const oldIndex = categoryWidgets.findIndex((item) => item.id === active.id);
        const newIndex = categoryWidgets.findIndex((item) => item.id === over.id);
        
        if (oldIndex === -1 || newIndex === -1) return items;
        
        const reorderedCategoryWidgets = arrayMove(categoryWidgets, oldIndex, newIndex);
        
        // Replace the category widgets in the full list
        return items.map(widget => {
          if (widget.category === categoryId) {
            const newIndex = reorderedCategoryWidgets.findIndex(w => w.id === widget.id);
            return reorderedCategoryWidgets[newIndex];
          }
          return widget;
        });
      });
    }
  };

  const handleSave = () => {
    onSave(localWidgets);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Customize Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Customize Your Dashboard</DialogTitle>
          <DialogDescription>
            Drag sections to reorder, toggle widgets, and drag widgets within sections.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[500px] pr-4">
          <div className="py-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCategoryDragEnd}
            >
              <SortableContext
                items={categoryOrder.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {categoryOrder.map((category) => {
                  const categoryWidgets = localWidgets.filter(w => w.category === category.id);
                  if (categoryWidgets.length === 0) return null;
                  
                  return (
                    <SortableCategory
                      key={category.id}
                      category={category}
                      widgets={categoryWidgets}
                      onToggle={toggleWidget}
                      onWidgetDragEnd={handleWidgetDragEnd}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
