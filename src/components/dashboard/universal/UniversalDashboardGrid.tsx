import { useMemo } from "react";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { DashboardWidget } from "./types";
import { WidgetCard } from "./WidgetCard";

// Widget components
import { StudioToolsWidget } from "./widgets/StudioToolsWidget";
import { UpcomingMeetingsWidget } from "./widgets/UpcomingMeetingsWidget";
import { LatestRecordingsWidget } from "./widgets/LatestRecordingsWidget";
import { AIQuickActionsWidget } from "./widgets/AIQuickActionsWidget";
import { PerformanceOverviewWidget } from "./widgets/PerformanceOverviewWidget";
import { TasksNotesWidget } from "./widgets/TasksNotesWidget";
import { MarketingPublishingWidget } from "./widgets/MarketingPublishingWidget";
import { RecommendedActionsWidget } from "./widgets/RecommendedActionsWidget";
import { IdentityVerificationWidget } from "./widgets/IdentityVerificationWidget";

interface UniversalDashboardGridProps {
  widgets: DashboardWidget[];
  onWidgetsChange: (widgets: DashboardWidget[]) => void;
  data?: {
    meetings?: any[];
    recordings?: any[];
    stats?: any;
    connectedAccounts?: string[];
    completedSteps?: string[];
  };
}

export function UniversalDashboardGrid({ widgets, onWidgetsChange, data = {} }: UniversalDashboardGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const enabledWidgets = useMemo(() => 
    widgets.filter(w => w.enabled).sort((a, b) => a.order - b.order),
    [widgets]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = enabledWidgets.findIndex(w => w.id === active.id);
      const newIndex = enabledWidgets.findIndex(w => w.id === over.id);
      
      const reorderedEnabled = arrayMove(enabledWidgets, oldIndex, newIndex);
      
      // Update order values
      const updatedWidgets = widgets.map(widget => {
        const newOrderIndex = reorderedEnabled.findIndex(w => w.id === widget.id);
        if (newOrderIndex !== -1) {
          return { ...widget, order: newOrderIndex };
        }
        return widget;
      });
      
      onWidgetsChange(updatedWidgets);
    }
  };

  const handleToggleExpand = (widgetId: string) => {
    onWidgetsChange(
      widgets.map(w => w.id === widgetId ? { ...w, expanded: !w.expanded } : w)
    );
  };

  const handleRemoveWidget = (widgetId: string) => {
    onWidgetsChange(
      widgets.map(w => w.id === widgetId ? { ...w, enabled: false } : w)
    );
  };

  const renderWidgetContent = (widget: DashboardWidget) => {
    switch (widget.id) {
      case "studio-tools":
        return <StudioToolsWidget />;
      case "upcoming-meetings":
        return <UpcomingMeetingsWidget meetings={data.meetings} />;
      case "latest-recordings":
        return <LatestRecordingsWidget recordings={data.recordings} />;
      case "ai-quick-actions":
        return <AIQuickActionsWidget />;
      case "performance-overview":
        return <PerformanceOverviewWidget stats={data.stats} />;
      case "tasks-notes":
        return <TasksNotesWidget />;
      case "marketing-publishing":
        return <MarketingPublishingWidget connectedAccounts={data.connectedAccounts} />;
      case "recommended-actions":
        return <RecommendedActionsWidget completedSteps={data.completedSteps} />;
      case "identity-verification":
        return <IdentityVerificationWidget />;
      default:
        return <div className="text-sm text-muted-foreground">Widget content coming soon...</div>;
    }
  };

  if (enabledWidgets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No widgets enabled. Click "Add Widgets" to customize your dashboard.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={enabledWidgets.map(w => w.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enabledWidgets.map((widget) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              onToggleExpand={() => handleToggleExpand(widget.id)}
              onRemove={() => handleRemoveWidget(widget.id)}
            >
              {renderWidgetContent(widget)}
            </WidgetCard>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
