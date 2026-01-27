import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Tag as TagIcon } from "lucide-react";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagManagerProps {
  tags: Tag[];
}

const PRESET_COLORS = [
  "#0064B1", "#053877", "#F0A71F", "#ED1C24",
  "#10B981", "#8B5CF6", "#EC4899", "#F59E0B",
];

export function TagManager({ tags }: TagManagerProps) {
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const queryClient = useQueryClient();

  const createTag = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const result = await (supabase as any).from("contact_tags").insert([
        {
          user_id: user.id,
          name: newTagName,
          color: selectedColor,
        },
      ]);

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact_tags"] });
      toast.success("Tag created");
      setNewTagName("");
    },
    onError: () => {
      toast.error("Failed to create tag");
    },
  });

  const deleteTag = useMutation({
    mutationFn: async (tagId: string) => {
      const result = await (supabase as any)
        .from("contact_tags")
        .delete()
        .eq("id", tagId);

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact_tags"] });
      toast.success("Tag deleted");
    },
    onError: () => {
      toast.error("Failed to delete tag");
    },
  });

  return (
    <div className="max-w-4xl">
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TagIcon className="w-5 h-5" />
          Create New Tag
        </h3>
        <div className="flex gap-4">
          <Input
            placeholder="Tag name..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTagName.trim()) {
                createTag.mutate();
              }
            }}
          />
          <div className="flex gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                style={{
                  backgroundColor: color,
                  borderColor: selectedColor === color ? "hsl(var(--foreground))" : "transparent",
                }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
          <Button
            onClick={() => createTag.mutate()}
            disabled={!newTagName.trim() || createTag.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Your Tags ({tags.length})
        </h3>
        
        {tags.length === 0 ? (
          <Card className="p-8 text-center">
            <TagIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No tags yet. Create tags to organize your contacts.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tags.map((tag) => (
              <Card
                key={tag.id}
                className="p-4 flex items-center justify-between group hover:shadow-md transition-all"
              >
                <Badge
                  style={{
                    backgroundColor: tag.color + "20",
                    color: tag.color,
                    borderColor: tag.color,
                  }}
                  className="border"
                >
                  {tag.name}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  onClick={() => deleteTag.mutate(tag.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
