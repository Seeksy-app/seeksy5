import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, ChevronRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CreateListDialog } from "./CreateListDialog";

interface ListDirectoryProps {
  lists: any[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedListId: string | null;
  onSelectList: (id: string) => void;
}

export function ListDirectory({
  lists,
  isLoading,
  searchQuery,
  onSearchChange,
  selectedListId,
  onSelectList,
}: ListDirectoryProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)] h-fit sticky top-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[18px] font-semibold text-foreground">Your Subscriber Lists</h3>
        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] hover:from-[#1e40af] hover:to-[#1e3a8a]"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New List
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search lists..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-1">
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Loading lists...
          </div>
        ) : lists.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            {searchQuery ? "No lists found" : "No lists yet. Create one to get started."}
          </div>
        ) : (
          lists.map((list) => {
            const memberCount = list.contact_list_members?.[0]?.count || 0;
            const isSelected = selectedListId === list.id;

            return (
              <button
                key={list.id}
                onClick={() => onSelectList(list.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-all",
                  "hover:bg-muted/50",
                  isSelected && "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-sm text-foreground truncate">
                        {list.name}
                      </h4>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {memberCount} {memberCount === 1 ? "subscriber" : "subscribers"}
                      </span>
                      {list.created_at && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(list.created_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <CreateListDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}
