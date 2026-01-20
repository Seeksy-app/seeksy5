import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Edit, Plus } from "lucide-react";

export default function PersonaManagement() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    tagline: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    display_order: 0,
  });

  const queryClient = useQueryClient();

  const { data: personas } = useQuery({
    queryKey: ["admin-personas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_personas")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("ai_personas").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-personas"] });
      toast.success("Persona created successfully");
      resetForm();
    },
    onError: () => {
      toast.error("Failed to create persona");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("ai_personas").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-personas"] });
      toast.success("Persona updated successfully");
      resetForm();
    },
    onError: () => {
      toast.error("Failed to update persona");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_personas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-personas"] });
      toast.success("Persona deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete persona");
    },
  });

  // Helper function to extract URL from iframe embed code
  const extractUrlFromIframe = (input: string): string => {
    // If input looks like an iframe, extract the src URL
    const iframeMatch = input.match(/src=["']([^"']+)["']/);
    if (iframeMatch) {
      return iframeMatch[1];
    }
    // Otherwise return as-is
    return input;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      tagline: "",
      description: "",
      video_url: "",
      thumbnail_url: "",
      display_order: 0,
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (persona: any) => {
    setFormData({
      name: persona.name,
      role: persona.role,
      tagline: persona.tagline,
      description: persona.description,
      video_url: persona.video_url,
      thumbnail_url: persona.thumbnail_url || "",
      display_order: persona.display_order,
    });
    setEditingId(persona.id);
    setIsCreating(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">AI Persona Management</h1>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <Plus className="w-4 h-4 mr-2" />
          {isCreating ? "Cancel" : "Add Persona"}
        </Button>
      </div>

      {isCreating && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  placeholder="creator, advertiser, agency"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="video_url">Video URL or Embed Code</Label>
              <Input
                id="video_url"
                placeholder="Paste iframe embed code or direct URL"
                value={formData.video_url}
                onChange={(e) => 
                  setFormData({ 
                    ...formData, 
                    video_url: extractUrlFromIframe(e.target.value) 
                  })
                }
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste the entire iframe embed code from HeyGen, or just the URL
              </p>
            </div>

            <div>
              <Label htmlFor="thumbnail_url">Thumbnail URL (Optional)</Label>
              <Input
                id="thumbnail_url"
                type="url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">{editingId ? "Update" : "Create"} Persona</Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas?.map((persona) => (
          <Card key={persona.id} className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{persona.name}</h3>
                <p className="text-sm text-muted-foreground">{persona.role}</p>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => handleEdit(persona)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(persona.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm">{persona.tagline}</p>
            {persona.video_url.includes('heygen.com/embedded-player') ? (
              <iframe
                src={persona.video_url}
                className="w-full rounded aspect-video"
                allow="encrypted-media; fullscreen;"
                allowFullScreen
              />
            ) : (
              <video src={persona.video_url} className="w-full rounded aspect-video" controls />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}