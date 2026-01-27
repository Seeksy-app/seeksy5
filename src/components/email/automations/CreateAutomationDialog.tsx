import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TRIGGER_TYPES = [
  { value: "new_subscriber", label: "New Subscriber" },
  { value: "event_registration", label: "Event Registration" },
  { value: "meeting_booked", label: "Meeting Booked" },
  { value: "podcast_published", label: "Podcast Published" },
  { value: "identity_verified", label: "Identity Verified" },
];

export function CreateAutomationDialog({ open, onOpenChange, onSuccess }: CreateAutomationDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("new_subscriber");

  const createAutomation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await (supabase as any)
        .from("automations")
        .insert({
          user_id: user.id,
          name,
          description,
          trigger_type: triggerType,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Automation created");
      setName("");
      setDescription("");
      setTriggerType("new_subscriber");
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to create automation");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Automation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Automation Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Welcome New Subscribers"
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
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_TYPES.map((trigger) => (
                  <SelectItem key={trigger.value} value={trigger.value}>
                    {trigger.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createAutomation.mutate()}
            disabled={!name || createAutomation.isPending}
          >
            Create Automation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
