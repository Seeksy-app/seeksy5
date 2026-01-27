import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, GripVertical, Settings } from "lucide-react";
import { toast } from "sonner";
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
import { MyPageSection, SECTION_TYPE_INFO, SectionType } from "@/lib/mypage/sectionTypes";
import { SectionConfigDrawer } from "./SectionConfigDrawer";
import { AddSectionDialog } from "./AddSectionDialog";

interface SectionsManagerProps {
  userId: string;
}

function SortableSection({ section, onToggle, onConfigure }: {
  section: MyPageSection;
  onToggle: (id: string, enabled: boolean) => void;
  onConfigure: (section: MyPageSection) => void;
}) {
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

  const sectionInfo = SECTION_TYPE_INFO[section.section_type];

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-4 mb-2 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </div>
          
          <span className="text-2xl">{sectionInfo.icon}</span>
          
          <div className="flex-1">
            <p className="font-medium">{sectionInfo.label}</p>
            <p className="text-sm text-muted-foreground">{sectionInfo.description}</p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onConfigure(section)}
          >
            <Settings className="w-4 h-4" />
          </Button>

          <Switch
            checked={section.is_enabled}
            onCheckedChange={(enabled) => onToggle(section.id, enabled)}
          />
        </div>
      </Card>
    </div>
  );
}

export function SectionsManager({ userId }: SectionsManagerProps) {
  const queryClient = useQueryClient();
  const [selectedSection, setSelectedSection] = useState<MyPageSection | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["my-page-sections", userId],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("my_page_sections")
        .select("*")
        .eq("user_id", userId)
        .order("display_order");
      
      if (result.error) throw result.error;
      return (result.data || []) as MyPageSection[];
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (newSections: MyPageSection[]) => {
      const updates = newSections.map((section, index) => ({
        id: section.id,
        display_order: index,
      }));

      for (const update of updates) {
        const { error } = await (supabase as any)
          .from("my_page_sections")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-page-sections", userId] });
      toast.success("Section order updated");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await (supabase as any)
        .from("my_page_sections")
        .update({ is_enabled: enabled })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-page-sections", userId] });
    },
  });

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
      
      const newSections = arrayMove(sections, oldIndex, newIndex);
      reorderMutation.mutate(newSections);
    }
  };

  if (isLoading) {
    return <div>Loading sections...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Page Sections</h3>
          <p className="text-sm text-muted-foreground">
            Drag to reorder, toggle to show/hide, configure each section
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </Button>
      </div>

      {sections.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onToggle={(id, enabled) => toggleMutation.mutate({ id, enabled })}
                onConfigure={setSelectedSection}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No sections yet</p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Section
          </Button>
        </Card>
      )}

      <SectionConfigDrawer
        section={selectedSection}
        onClose={() => setSelectedSection(null)}
        userId={userId}
      />

      <AddSectionDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        userId={userId}
      />
    </div>
  );
}
