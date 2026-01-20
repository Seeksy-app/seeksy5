import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, Mail, Tags, Bell } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AutomationBuilderProps {
  automation: any;
  onUpdate: () => void;
}

const ACTION_TYPES = [
  { value: "send_email", label: "Send Email", icon: Mail },
  { value: "add_to_list", label: "Add to List", icon: Tags },
  { value: "add_tag", label: "Add Tag", icon: Tags },
  { value: "notify_admin", label: "Notify Admin", icon: Bell },
];

export function AutomationBuilder({ automation, onUpdate }: AutomationBuilderProps) {
  const [name, setName] = useState(automation.name);
  const [description, setDescription] = useState(automation.description || "");
  const [actions, setActions] = useState(automation.automation_actions || []);

  const updateAutomation = useMutation({
    mutationFn: async () => {
      const { error: automationError } = await supabase
        .from("automations")
        .update({ name, description })
        .eq("id", automation.id);

      if (automationError) throw automationError;

      // Delete existing actions
      await supabase
        .from("automation_actions")
        .delete()
        .eq("automation_id", automation.id);

      // Insert new actions
      if (actions.length > 0) {
        const { error: actionsError } = await supabase
          .from("automation_actions")
          .insert(
            actions.map((a: any, index: number) => ({
              automation_id: automation.id,
              action_type: a.action_type,
              action_config: a.action_config,
              action_order: index,
              delay_minutes: a.delay_minutes || 0,
            }))
          );

        if (actionsError) throw actionsError;
      }
    },
    onSuccess: () => {
      toast.success("Automation updated");
      onUpdate();
    },
    onError: () => {
      toast.error("Failed to update automation");
    },
  });

  const addAction = () => {
    setActions([...actions, { action_type: "send_email", action_config: {}, delay_minutes: 0 }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border shadow-sm p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Automation Details</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Automation name"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this automation does"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Trigger</label>
            <div className="p-3 bg-muted rounded-lg text-sm">
              When: <span className="font-medium">{automation.trigger_type.replace(/_/g, " ")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="font-medium mb-4">Actions</h4>
        <div className="space-y-3">
          {actions.map((action: any, index: number) => {
            const ActionIcon = ACTION_TYPES.find(t => t.value === action.action_type)?.icon || Mail;
            return (
              <div key={index} className="flex gap-2 items-start p-4 border rounded-lg">
                <ActionIcon className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <Select
                    value={action.action_type}
                    onValueChange={(value) => {
                      const newActions = [...actions];
                      newActions[index] = { ...newActions[index], action_type: value };
                      setActions(newActions);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground mt-2">
                    Step {index + 1}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAction(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>

        <Button
          variant="outline"
          onClick={addAction}
          className="w-full mt-3"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Action
        </Button>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          onClick={() => updateAutomation.mutate()}
          disabled={updateAutomation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Automation
        </Button>
      </div>
    </div>
  );
}
