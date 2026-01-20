import { useState } from "react";
import { Plus, Briefcase, Puzzle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface AddNewDropdownProps {
  onAddWorkspace: () => void;
  onAddApps: () => void;
}

export function AddNewDropdown({ onAddWorkspace, onAddApps }: AddNewDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          className="h-9 w-9 shrink-0 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          title="Add new"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover border shadow-lg z-50">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Add new
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => {
            onAddWorkspace();
            setOpen(false);
          }}
          className="cursor-pointer"
        >
          <Briefcase className="h-4 w-4 mr-2" />
          Workspace
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => {
            onAddApps();
            setOpen(false);
          }}
          className="cursor-pointer"
        >
          <Puzzle className="h-4 w-4 mr-2" />
          Apps
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
