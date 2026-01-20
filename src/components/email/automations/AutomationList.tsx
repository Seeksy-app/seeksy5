import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Search, Zap, Clock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AutomationStatusBadge } from "./AutomationStatusBadge";
import { formatDistanceToNow } from "date-fns";

interface Automation {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  trigger_type: string;
  created_at: string;
  updated_at: string;
  automation_actions: any[];
}

interface AutomationListProps {
  automations: Automation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
}

export function AutomationList({ automations, selectedId, onSelect, onRefresh }: AutomationListProps) {
  const [search, setSearch] = useState("");

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("automations")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      onRefresh();
      toast.success("Automation updated");
    },
  });

  const filteredAutomations = automations.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Your Automations</h3>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search automations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {filteredAutomations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No automations found
          </div>
        ) : (
          filteredAutomations.map((automation) => (
            <button
              key={automation.id}
              onClick={() => onSelect(automation.id)}
              className={cn(
                "w-full text-left p-4 rounded-lg border transition-all hover:bg-muted/50",
                selectedId === automation.id && "bg-primary/10 border-primary"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium">{automation.name}</div>
                    <AutomationStatusBadge isActive={automation.is_active} />
                  </div>
                  {automation.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {automation.description}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {automation.trigger_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    {automation.updated_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Updated {formatDistanceToNow(new Date(automation.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Switch
                  checked={automation.is_active}
                  onCheckedChange={(checked) => {
                    toggleActive.mutate({ id: automation.id, is_active: checked });
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
