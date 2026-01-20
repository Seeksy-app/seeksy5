import { motion, AnimatePresence } from "framer-motion";
import { X, Pin, PinOff, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore, ContextColumn } from "@/stores/workspaceStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ContextColumnPanelProps {
  column: ContextColumn;
  index: number;
}

function ContextColumnPanel({ column, index }: ContextColumnPanelProps) {
  const { closeContextColumn, pinContextColumn, unpinContextColumn } = useWorkspaceStore();

  const getTypeStyles = (type: ContextColumn['type']) => {
    switch (type) {
      case 'detail':
        return 'border-l-blue-500';
      case 'edit':
        return 'border-l-green-500';
      case 'analytics':
        return 'border-l-purple-500';
      case 'calendar':
        return 'border-l-amber-500';
      case 'notes':
        return 'border-l-pink-500';
      default:
        return 'border-l-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className={cn(
        "w-[400px] h-full flex flex-col bg-card border-l-4 shadow-xl",
        getTypeStyles(column.type)
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          {column.isPinned && (
            <Pin className="w-3 h-3 text-primary" />
          )}
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <span className="text-xs text-muted-foreground capitalize px-1.5 py-0.5 bg-muted rounded">
            {column.type}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => column.isPinned 
              ? unpinContextColumn(column.id) 
              : pinContextColumn(column.id)
            }
          >
            {column.isPinned ? (
              <PinOff className="w-3.5 h-3.5" />
            ) : (
              <Pin className="w-3.5 h-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => closeContextColumn(column.id)}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Placeholder content - will be replaced with actual panel content */}
          <div className="space-y-4">
            <div className="h-32 bg-muted/50 rounded-lg flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {column.type.charAt(0).toUpperCase() + column.type.slice(1)} Panel Content
              </p>
            </div>
            
            {column.entityType && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Entity Type</p>
                <p className="text-sm font-medium">{column.entityType}</p>
              </div>
            )}
            
            {column.entityId && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Entity ID</p>
                <p className="text-sm font-mono">{column.entityId}</p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
}

interface ContextColumnsContainerProps {
  className?: string;
}

export function ContextColumnsContainer({ className }: ContextColumnsContainerProps) {
  const { contextColumns } = useWorkspaceStore();

  return (
    <div className={cn("flex h-full", className)}>
      <AnimatePresence mode="popLayout">
        {contextColumns.map((column, index) => (
          <ContextColumnPanel key={column.id} column={column} index={index} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook to open context columns from anywhere
export function useContextColumns() {
  const { openContextColumn, closeContextColumn, contextColumns } = useWorkspaceStore();

  const openDetailPanel = (title: string, entityType: string, entityId: string, data?: Record<string, any>) => {
    openContextColumn({ type: 'detail', title, entityType, entityId, data });
  };

  const openEditPanel = (title: string, entityType: string, entityId: string, data?: Record<string, any>) => {
    openContextColumn({ type: 'edit', title, entityType, entityId, data });
  };

  const openAnalyticsPanel = (title: string, data?: Record<string, any>) => {
    openContextColumn({ type: 'analytics', title, data });
  };

  const openCalendarPanel = (title: string = 'Calendar') => {
    openContextColumn({ type: 'calendar', title });
  };

  const openNotesPanel = (title: string = 'Notes') => {
    openContextColumn({ type: 'notes', title });
  };

  return {
    openDetailPanel,
    openEditPanel,
    openAnalyticsPanel,
    openCalendarPanel,
    openNotesPanel,
    closeContextColumn,
    contextColumns,
  };
}
