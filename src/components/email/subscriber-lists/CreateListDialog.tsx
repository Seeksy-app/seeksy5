import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateListDialog({ open, onOpenChange }: CreateListDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createList = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const result = await (supabase as any)
        .from("contact_lists")
        .insert({
          name,
          description: description || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
      toast.success("List created successfully");
      setName("");
      setDescription("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create list");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>List Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Newsletter Subscribers"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this list"
              rows={3}
              className="mt-1.5"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createList.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createList.mutate()}
              disabled={!name || createList.isPending}
            >
              {createList.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create List
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
