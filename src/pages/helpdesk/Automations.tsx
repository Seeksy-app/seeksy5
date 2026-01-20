import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Zap, Clock, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";

export default function Automations() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAutomation, setNewAutomation] = useState({
    name: "",
    description: "",
    trigger_type: "ticket_created",
    conditions: {},
    actions: {},
  });

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ["ticket-automations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_automations")
        .select("*")
        .order("priority", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const toggleAutomation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("ticket_automations")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-automations"] });
      toast.success("Automation updated");
    },
  });

  const createAutomation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("ticket_automations")
        .insert(newAutomation);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-automations"] });
      toast.success("Automation created");
      setShowCreateModal(false);
      setNewAutomation({
        name: "",
        description: "",
        trigger_type: "ticket_created",
        conditions: {},
        actions: {},
      });
    },
    onError: () => {
      toast.error("Failed to create automation");
    },
  });

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case "ticket_created": return <Plus className="h-4 w-4" />;
      case "ticket_updated": return <ArrowRight className="h-4 w-4" />;
      case "sla_breach": return <AlertTriangle className="h-4 w-4" />;
      case "time_based": return <Clock className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case "ticket_created": return "When ticket is created";
      case "ticket_updated": return "When ticket is updated";
      case "sla_breach": return "When SLA is breached";
      case "time_based": return "Time-based trigger";
      default: return type;
    }
  };

  const defaultAutomations = [
    { name: "Auto-assign by category", trigger: "ticket_created", description: "Automatically assign tickets to team members based on category" },
    { name: "SLA breach alert", trigger: "sla_breach", description: "Send notification when SLA is about to be breached" },
    { name: "Auto-close after 7 days", trigger: "time_based", description: "Close resolved tickets after 7 days of inactivity" },
    { name: "Priority escalation", trigger: "time_based", description: "Escalate priority if ticket is open for more than 24 hours" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Automations</h1>
          <p className="text-muted-foreground">Set up rules to automatically handle tickets</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Automation
        </Button>
      </div>

      {/* Active Automations */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Active Automations</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : automations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No automations created yet</p>
              <p className="text-sm">Create your first automation to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {automations.map((automation: any) => (
              <Card key={automation.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {getTriggerIcon(automation.trigger_type)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{automation.name}</CardTitle>
                        <CardDescription>{automation.description}</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={automation.is_active}
                      onCheckedChange={(checked) => toggleAutomation.mutate({ id: automation.id, is_active: checked })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{getTriggerLabel(automation.trigger_type)}</Badge>
                    {automation.is_active ? (
                      <Badge className="bg-green-100 text-green-700">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Automations */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Suggested Automations</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {defaultAutomations.map((auto, i) => (
            <Card key={i} className="border-dashed">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    {getTriggerIcon(auto.trigger)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{auto.name}</CardTitle>
                    <CardDescription>{auto.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add This
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Automation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Automation name"
                value={newAutomation.name}
                onChange={(e) => setNewAutomation({ ...newAutomation, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What does this automation do?"
                value={newAutomation.description}
                onChange={(e) => setNewAutomation({ ...newAutomation, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select
                value={newAutomation.trigger_type}
                onValueChange={(v) => setNewAutomation({ ...newAutomation, trigger_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ticket_created">When ticket is created</SelectItem>
                  <SelectItem value="ticket_updated">When ticket is updated</SelectItem>
                  <SelectItem value="sla_breach">When SLA is breached</SelectItem>
                  <SelectItem value="time_based">Time-based</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={() => createAutomation.mutate()} disabled={!newAutomation.name || createAutomation.isPending}>
              {createAutomation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}