import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { 
  X, 
  FolderInput, 
  CheckCircle2, 
  Calendar,
  Trash2,
  ChevronDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface Section {
  id: string;
  name: string;
  color: string;
}

interface TaskBulkActionsProps {
  selectedIds: string[];
  sections: Section[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

const STATUS_OPTIONS = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

export function TaskBulkActions({ 
  selectedIds, 
  sections, 
  onClearSelection,
  onRefresh 
}: TaskBulkActionsProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  const handleBulkSectionChange = async (sectionName: string) => {
    if (selectedIds.length === 0) return;
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ section: sectionName })
        .in("id", selectedIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Moved ${selectedIds.length} task(s) to "${sectionName}"`,
      });
      onRefresh();
      onClearSelection();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedIds.length === 0) return;
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status })
        .in("id", selectedIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated status for ${selectedIds.length} task(s)`,
      });
      onRefresh();
      onClearSelection();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDueDateChange = async (date: Date | undefined) => {
    if (selectedIds.length === 0 || !date) return;
    setIsUpdating(true);
    setDueDateOpen(false);
    
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ due_date: format(date, "yyyy-MM-dd") })
        .in("id", selectedIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Set due date for ${selectedIds.length} task(s)`,
      });
      onRefresh();
      onClearSelection();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} task(s)?`)) {
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Deleted ${selectedIds.length} task(s)`,
      });
      onRefresh();
      onClearSelection();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 bg-background border rounded-lg shadow-lg px-4 py-2">
        <Badge variant="secondary" className="font-medium">
          {selectedIds.length} selected
        </Badge>

        {/* Move to Section */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isUpdating}>
              <FolderInput className="h-4 w-4 mr-2" />
              Move to Section
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuLabel>Select Section</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {sections.map((section) => (
              <DropdownMenuItem
                key={section.id}
                onClick={() => handleBulkSectionChange(section.name)}
              >
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: section.color }}
                />
                {section.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Set Status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isUpdating}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Set Status
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuLabel>Select Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {STATUS_OPTIONS.map((status) => (
              <DropdownMenuItem
                key={status.value}
                onClick={() => handleBulkStatusChange(status.value)}
              >
                {status.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Set Due Date */}
        <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" disabled={isUpdating}>
              <Calendar className="h-4 w-4 mr-2" />
              Set Due Date
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <CalendarComponent
              mode="single"
              onSelect={handleBulkDueDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Delete */}
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isUpdating}
          onClick={handleBulkDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>

        {/* Clear Selection */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 ml-2"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
