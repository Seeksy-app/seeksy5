import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, FolderPlus } from "lucide-react";
import { toast } from "sonner";

const PRESET_COLORS = [
  "#0064B1", // Primary Blue
  "#053877", // Navy Blue
  "#F0A71F", // Accent Orange
  "#ED1C24", // Destructive Red
  "#10B981", // Green
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F59E0B", // Amber
];

export function CreateListDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const queryClient = useQueryClient();

  const createList = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const result = await (supabase as any).from("contact_lists").insert([
        {
          user_id: user.id,
          name,
          description: description || null,
          color,
        },
      ]);

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact_lists"] });
      toast.success("List created successfully");
      setOpen(false);
      setName("");
      setDescription("");
      setColor(PRESET_COLORS[0]);
    },
    onError: (error) => {
      toast.error("Failed to create list");
      console.error(error);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FolderPlus className="w-4 h-4" />
          New List
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">List Name</Label>
            <Input
              id="name"
              placeholder="e.g., VIP Clients, Newsletter Subscribers"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What's this list for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: presetColor,
                    borderColor: color === presetColor ? "hsl(var(--foreground))" : "transparent",
                  }}
                  onClick={() => setColor(presetColor)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createList.mutate()}
              disabled={!name.trim() || createList.isPending}
            >
              Create List
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
