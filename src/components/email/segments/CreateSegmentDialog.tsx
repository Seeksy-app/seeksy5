import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateSegmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateSegmentDialog({ open, onOpenChange, onSuccess }: CreateSegmentDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createSegment = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("segments")
        .insert({
          user_id: user.id,
          name,
          description,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Segment created");
      setName("");
      setDescription("");
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to create segment");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Segment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Segment Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Active Subscribers"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe who should be in this segment"
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createSegment.mutate()}
            disabled={!name || createSegment.isPending}
          >
            Create Segment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
