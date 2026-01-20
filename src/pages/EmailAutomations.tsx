import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Zap, Play, Pause } from "lucide-react";
import { AutomationList } from "@/components/email/automations/AutomationList";
import { AutomationBuilder } from "@/components/email/automations/AutomationBuilder";
import { CreateAutomationDialog } from "@/components/email/automations/CreateAutomationDialog";

export default function EmailAutomations() {
  const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: automations, refetch } = useQuery({
    queryKey: ["automations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("automations")
        .select("*, automation_actions(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const selectedAutomation = automations?.find(a => a.id === selectedAutomationId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="h-[72px] border-b bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-orange-950/20">
        <div className="container mx-auto h-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">Automations</h1>
              <p className="text-sm text-muted-foreground">Trigger-based workflows</p>
            </div>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Automation
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-8">
          {/* Left: Automation List */}
          <div>
            <AutomationList
              automations={automations || []}
              selectedId={selectedAutomationId}
              onSelect={setSelectedAutomationId}
              onRefresh={refetch}
            />
          </div>

          {/* Right: Automation Builder */}
          <div>
            {selectedAutomation ? (
              <AutomationBuilder
                automation={selectedAutomation}
                onUpdate={refetch}
              />
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-12 text-center border shadow-sm">
                <Zap className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No automation selected</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Create a new automation or select one from the list
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Automation
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateAutomationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          refetch();
          setCreateDialogOpen(false);
        }}
      />
    </div>
  );
}
