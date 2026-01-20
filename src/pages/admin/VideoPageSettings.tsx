import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Eye, EyeOff, GripVertical, Plus, Trash2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface VideoPageSettings {
  id: string;
  page_key: string;
  page_title: string;
  page_subtitle: string | null;
  header_button_text: string | null;
  header_button_link: string | null;
  show_featured_section: boolean;
  show_categories: boolean;
  is_published: boolean;
}

interface VideoCategory {
  id: string;
  name: string;
  display_order: number;
  is_visible: boolean;
  description: string | null;
}

export default function VideoPageSettings() {
  const queryClient = useQueryClient();
  const [newCategoryName, setNewCategoryName] = useState("");

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["video-page-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_page_settings")
        .select("*")
        .eq("page_key", "main")
        .maybeSingle();
      if (error) throw error;
      return data as VideoPageSettings | null;
    },
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["video-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_categories")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as VideoCategory[];
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<VideoPageSettings>) => {
      const { error } = await supabase
        .from("video_page_settings")
        .update(updates)
        .eq("page_key", "main");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-page-settings"] });
      toast.success("Settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<VideoCategory> }) => {
      const { error } = await supabase
        .from("video_categories")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-categories"] });
      toast.success("Category updated");
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const maxOrder = Math.max(...categories.map((c) => c.display_order), 0);
      const { error } = await supabase
        .from("video_categories")
        .insert({ name, display_order: maxOrder + 1 });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-categories"] });
      setNewCategoryName("");
      toast.success("Category added");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("video_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-categories"] });
      toast.success("Category deleted");
    },
  });

  const handleSaveSettings = (field: keyof VideoPageSettings, value: any) => {
    updateSettingsMutation.mutate({ [field]: value });
  };

  if (settingsLoading || categoriesLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Video Page Settings</h1>
          <p className="text-muted-foreground">Control the appearance and content of the /videos page</p>
        </div>
        <Link to="/videos" target="_blank">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Preview Page
          </Button>
        </Link>
      </div>

      {/* Page Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Page Content</CardTitle>
          <CardDescription>Edit the main content displayed on the videos page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="page_title">Page Title</Label>
              <Input
                id="page_title"
                defaultValue={settings?.page_title || ""}
                onBlur={(e) => handleSaveSettings("page_title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="header_button_text">Header Button Text</Label>
              <Input
                id="header_button_text"
                defaultValue={settings?.header_button_text || ""}
                onBlur={(e) => handleSaveSettings("header_button_text", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="page_subtitle">Page Subtitle</Label>
            <Textarea
              id="page_subtitle"
              defaultValue={settings?.page_subtitle || ""}
              onBlur={(e) => handleSaveSettings("page_subtitle", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="header_button_link">Header Button Link</Label>
            <Input
              id="header_button_link"
              defaultValue={settings?.header_button_link || ""}
              onBlur={(e) => handleSaveSettings("header_button_link", e.target.value)}
              placeholder="/platform"
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card>
        <CardHeader>
          <CardTitle>Display Options</CardTitle>
          <CardDescription>Toggle visibility of page sections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Featured Section</Label>
              <p className="text-sm text-muted-foreground">Display featured videos at the top</p>
            </div>
            <Switch
              checked={settings?.show_featured_section ?? true}
              onCheckedChange={(checked) => handleSaveSettings("show_featured_section", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show Category Sections</Label>
              <p className="text-sm text-muted-foreground">Group videos by category</p>
            </div>
            <Switch
              checked={settings?.show_categories ?? true}
              onCheckedChange={(checked) => handleSaveSettings("show_categories", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Page Published</Label>
              <p className="text-sm text-muted-foreground">Make the videos page publicly accessible</p>
            </div>
            <Switch
              checked={settings?.is_published ?? true}
              onCheckedChange={(checked) => handleSaveSettings("is_published", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Video Categories</CardTitle>
          <CardDescription>Manage and reorder video categories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
              <Input
                value={category.name}
                onChange={(e) =>
                  updateCategoryMutation.mutate({ id: category.id, updates: { name: e.target.value } })
                }
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  updateCategoryMutation.mutate({
                    id: category.id,
                    updates: { is_visible: !category.is_visible },
                  })
                }
              >
                {category.is_visible ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteCategoryMutation.mutate(category.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}

          <div className="flex gap-2">
            <Input
              placeholder="New category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCategoryName.trim()) {
                  addCategoryMutation.mutate(newCategoryName.trim());
                }
              }}
            />
            <Button
              onClick={() => newCategoryName.trim() && addCategoryMutation.mutate(newCategoryName.trim())}
              disabled={!newCategoryName.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
