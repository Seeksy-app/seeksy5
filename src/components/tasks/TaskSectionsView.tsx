import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, GripVertical, Plus, MoreHorizontal, Eye } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  section: string | null;
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
  assignee?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Section {
  id: string;
  name: string;
  color: string;
  display_order: number;
}

interface TaskSectionsViewProps {
  tasks: Task[];
  sections: Section[];
  onTaskMove: (taskId: string, newSection: string) => Promise<void>;
  onTaskClick: (task: Task) => void;
  onAddTask: (sectionName: string) => void;
  onAddSection: () => void;
}

// Droppable section component
function DroppableSection({ 
  section, 
  tasks, 
  onTaskClick, 
  onAddTask,
  isOver 
}: { 
  section: Section; 
  tasks: Task[]; 
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
  isOver: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const { setNodeRef } = useDroppable({ id: section.name });

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div 
        ref={setNodeRef}
        className={cn(
          "border rounded-lg mb-4 bg-card transition-colors",
          isOver && "ring-2 ring-primary/50 bg-primary/5"
        )}
      >
        {/* Section Header */}
        <CollapsibleTrigger asChild>
          <div 
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 rounded-t-lg"
            style={{ borderLeft: `4px solid ${section.color}` }}
          >
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-semibold">{section.name}</span>
              <span className="text-muted-foreground text-sm">({tasks.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTask();
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* Table Header */}
          {tasks.length > 0 && (
            <div className="grid grid-cols-12 gap-2 px-4 py-2 border-t text-sm font-medium text-muted-foreground bg-muted/30">
              <div className="col-span-1"></div>
              <div className="col-span-3 flex items-center gap-1">
                <GripVertical className="h-3 w-3" /> Task
              </div>
              <div className="col-span-1 flex items-center gap-1">
                <GripVertical className="h-3 w-3" /> Status
              </div>
              <div className="col-span-1 flex items-center gap-1">
                <GripVertical className="h-3 w-3" /> Priority
              </div>
              <div className="col-span-2 flex items-center gap-1">
                <GripVertical className="h-3 w-3" /> Assignees
              </div>
              <div className="col-span-1 flex items-center gap-1">
                <GripVertical className="h-3 w-3" /> Due
              </div>
              <div className="col-span-2 flex items-center gap-1">
                <GripVertical className="h-3 w-3" /> Area
              </div>
              <div className="col-span-1 flex items-center gap-1">
                <GripVertical className="h-3 w-3" /> Added
              </div>
            </div>
          )}

          {/* Task Rows */}
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="divide-y">
              {tasks.map((task) => (
                <SortableTaskRow 
                  key={task.id} 
                  task={task} 
                  onClick={() => onTaskClick(task)} 
                />
              ))}
            </div>
          </SortableContext>

          {/* Empty State */}
          {tasks.length === 0 && (
            <div className="py-8 text-center text-muted-foreground border-t">
              Drop tasks here
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Sortable task row
function SortableTaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      high: "bg-red-100 text-red-700 border-red-200",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
      low: "bg-green-100 text-green-700 border-green-200",
    };
    const labels: Record<string, string> = {
      high: "P1 – High",
      medium: "P2 – Normal",
      low: "P3 – Low",
    };
    return (
      <Badge variant="outline" className={cn("text-xs", styles[priority])}>
        {labels[priority] || priority}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      backlog: "bg-gray-100 text-gray-700",
      todo: "bg-gray-100 text-gray-700",
      in_progress: "bg-orange-100 text-orange-700 border-orange-300",
      done: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      backlog: "Backlog",
      todo: "Not Started",
      in_progress: "In Progress",
      done: "Complete",
      cancelled: "Cancelled",
    };
    return (
      <Badge variant="outline" className={cn("text-xs", styles[status])}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/50 cursor-pointer transition-colors",
        isDragging && "opacity-50 bg-muted"
      )}
      onClick={onClick}
    >
      {/* Drag Handle */}
      <div className="col-span-1">
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Task Title */}
      <div className="col-span-3 font-medium truncate">{task.title}</div>

      {/* Status */}
      <div className="col-span-1">{getStatusBadge(task.status)}</div>

      {/* Priority */}
      <div className="col-span-1">{getPriorityBadge(task.priority)}</div>

      {/* Assignees */}
      <div className="col-span-2">
        {task.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignee.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {task.assignee.full_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm truncate">{task.assignee.full_name}</span>
            <Eye className="h-3 w-3 text-muted-foreground" />
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Unassigned</span>
        )}
      </div>

      {/* Due Date */}
      <div className="col-span-1">
        {task.due_date ? (
          <span className={cn(
            "text-sm",
            new Date(task.due_date) < new Date() && task.status !== "done" && "text-red-500 font-medium"
          )}>
            {format(new Date(task.due_date), "MMM d")}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </div>

      {/* Category/Area */}
      <div className="col-span-2">
        <span className="text-sm capitalize">{task.category?.replace(/-/g, " ") || "—"}</span>
      </div>

      {/* Added Date */}
      <div className="col-span-1">
        <span className="text-sm text-muted-foreground">
          {format(new Date(task.created_at), "MMM d")}
        </span>
      </div>
    </div>
  );
}

export function TaskSectionsView({
  tasks,
  sections,
  onTaskMove,
  onTaskClick,
  onAddTask,
  onAddSection,
}: TaskSectionsViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: any) => {
    setOverId(event.over?.id || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const taskId = active.id as string;
    const newSection = over.id as string;

    // Find if dropped on a section
    const droppedSection = sections.find(s => s.name === newSection);
    if (droppedSection) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.section !== newSection) {
        await onTaskMove(taskId, newSection);
      }
    }
  };

  // Group tasks by section
  const getTasksBySection = (sectionName: string) => {
    return tasks.filter(t => t.section === sectionName);
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-2">
        {sections.map((section) => (
          <DroppableSection
            key={section.id}
            section={section}
            tasks={getTasksBySection(section.name)}
            onTaskClick={onTaskClick}
            onAddTask={() => onAddTask(section.name)}
            isOver={overId === section.name}
          />
        ))}

        {/* Add Section Button */}
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={onAddSection}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <Card className="opacity-90 cursor-grabbing shadow-lg">
            <CardContent className="p-3">
              <span className="font-medium">{activeTask.title}</span>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
