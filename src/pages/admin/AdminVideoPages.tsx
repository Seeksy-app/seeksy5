import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Settings, Lock, Globe, Video, Users, ExternalLink, Eye, EyeOff, Trash2, GripVertical } from "lucide-react";
import { Link } from "react-router-dom";

interface VideoPage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
}

interface DemoVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
}

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

interface VideoCategory {
  id: string;
  name: string;
  display_order: number;
  is_visible: boolean;
  description: string | null;
}

export default function AdminVideoPages() {
  const queryClient = useQueryClient();
  const [editingPage, setEditingPage] = useState<VideoPage | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPage, setNewPage] = useState({ slug: "", title: "", description: "", is_private: false });
  const [newCategoryName, setNewCategoryName] = useState("");

  // Main page settings
  const { data: settings } = useQuery({
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

  const { data: categories = [] } = useQuery({
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
  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["admin-video-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_pages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as VideoPage[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (page: typeof newPage) => {
      const { error } = await supabase.from("video_pages").insert({
        slug: page.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        title: page.title,
        description: page.description || null,
        is_private: page.is_private,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-pages"] });
      setIsCreateOpen(false);
      setNewPage({ slug: "", title: "", description: "", is_private: false });
      toast.success("Video page created");
    },
    onError: () => toast.error("Failed to create page"),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Video Pages</h1>
          <p className="text-muted-foreground">Manage the main /videos page and gated collections</p>
        </div>
        <Link to="/videos" target="_blank">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Preview /videos
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="main-page" className="space-y-6">
        <TabsList>
          <TabsTrigger value="main-page">Main Page Settings</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="collections">Gated Collections</TabsTrigger>
        </TabsList>

        {/* Main Page Settings Tab */}
        <TabsContent value="main-page" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Content</CardTitle>
              <CardDescription>Edit the main content displayed on /videos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Page Title</Label>
                  <Input
                    defaultValue={settings?.page_title || ""}
                    onBlur={(e) => handleSaveSettings("page_title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Header Button Text</Label>
                  <Input
                    defaultValue={settings?.header_button_text || ""}
                    onBlur={(e) => handleSaveSettings("header_button_text", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Page Subtitle</Label>
                <Textarea
                  defaultValue={settings?.page_subtitle || ""}
                  onBlur={(e) => handleSaveSettings("page_subtitle", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Header Button Link</Label>
                <Input
                  defaultValue={settings?.header_button_link || ""}
                  onBlur={(e) => handleSaveSettings("header_button_link", e.target.value)}
                  placeholder="/platform"
                />
              </div>
              <div className="pt-4 space-y-4 border-t">
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video Categories</CardTitle>
              <CardDescription>Manage and reorder video categories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <Input
                    defaultValue={category.name}
                    onBlur={(e) => updateCategoryMutation.mutate({ id: category.id, updates: { name: e.target.value } })}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateCategoryMutation.mutate({ id: category.id, updates: { is_visible: !category.is_visible } })}
                  >
                    {category.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteCategoryMutation.mutate(category.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="New category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && newCategoryName.trim() && addCategoryMutation.mutate(newCategoryName.trim())}
                />
                <Button onClick={() => newCategoryName.trim() && addCategoryMutation.mutate(newCategoryName.trim())} disabled={!newCategoryName.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gated Collections Tab */}
        <TabsContent value="collections" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Collection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Video Collection</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Slug</Label>
                    <Input
                      value={newPage.slug}
                      onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                      placeholder="alchify-demos"
                    />
                    <p className="text-xs text-muted-foreground mt-1">URL: /videos/{newPage.slug || "slug"}</p>
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input value={newPage.title} onChange={(e) => setNewPage({ ...newPage, title: e.target.value })} placeholder="Alchify Demo Videos" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={newPage.description} onChange={(e) => setNewPage({ ...newPage, description: e.target.value })} placeholder="Private demos for partners..." />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={newPage.is_private} onCheckedChange={(checked) => setNewPage({ ...newPage, is_private: checked })} />
                    <Label>Private (requires email access)</Label>
                  </div>
                  <Button onClick={() => createMutation.mutate(newPage)} disabled={!newPage.slug || !newPage.title}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No video collections yet. Create one to get started.
            </div>
          ) : (
            <div className="grid gap-4">
              {pages.map((page) => (
                <VideoPageCard
                  key={page.id}
                  page={page}
                  onEdit={() => setEditingPage(page)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {editingPage && (
        <VideoPageEditor
          page={editingPage}
          onClose={() => setEditingPage(null)}
        />
      )}
    </div>
  );
}

function VideoPageCard({ page, onEdit }: { page: VideoPage; onEdit: () => void }) {
  const { data: stats } = useQuery({
    queryKey: ["video-page-stats", page.id],
    queryFn: async () => {
      const [videosRes, accessRes] = await Promise.all([
        supabase.from("video_page_videos").select("id", { count: "exact" }).eq("page_id", page.id),
        supabase.from("video_page_access").select("id", { count: "exact" }).eq("page_id", page.id),
      ]);
      return {
        videoCount: videosRes.count || 0,
        accessCount: accessRes.count || 0,
      };
    },
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${page.is_private ? "bg-amber-500/10" : "bg-green-500/10"}`}>
              {page.is_private ? (
                <Lock className="w-5 h-5 text-amber-500" />
              ) : (
                <Globe className="w-5 h-5 text-green-500" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{page.title}</h3>
              <p className="text-sm text-muted-foreground">/videos/{page.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Video className="w-4 h-4" />
              <span>{stats?.videoCount || 0} videos</span>
            </div>
            {page.is_private && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{stats?.accessCount || 0} allowed</span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VideoPageEditor({ page, onClose }: { page: VideoPage; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [isPrivate, setIsPrivate] = useState(page.is_private);
  const [emails, setEmails] = useState("");
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);

  useQuery({
    queryKey: ["video-page-access", page.id],
    queryFn: async () => {
      const { data } = await supabase.from("video_page_access").select("email").eq("page_id", page.id);
      const emailList = (data || []).map((a) => a.email);
      setEmails(emailList.join("\n"));
      return emailList;
    },
  });

  const { data: allVideos = [] } = useQuery({
    queryKey: ["all-demo-videos"],
    queryFn: async () => {
      const { data } = await supabase.from("demo_videos").select("id, title, thumbnail_url").order("title");
      return data as DemoVideo[];
    },
  });

  useQuery({
    queryKey: ["video-page-videos-edit", page.id],
    queryFn: async () => {
      const { data } = await supabase.from("video_page_videos").select("video_id").eq("page_id", page.id);
      const ids = (data || []).map((v) => v.video_id);
      setSelectedVideoIds(ids);
      return ids;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("video_pages").update({ is_private: isPrivate }).eq("id", page.id);

      await supabase.from("video_page_access").delete().eq("page_id", page.id);
      const emailList = emails.split("\n").map((e) => e.trim().toLowerCase()).filter(Boolean);
      if (emailList.length > 0) {
        await supabase.from("video_page_access").insert(
          emailList.map((email) => ({ page_id: page.id, email }))
        );
      }

      await supabase.from("video_page_videos").delete().eq("page_id", page.id);
      if (selectedVideoIds.length > 0) {
        await supabase.from("video_page_videos").insert(
          selectedVideoIds.map((video_id, index) => ({
            page_id: page.id,
            video_id,
            display_order: index,
          }))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-pages"] });
      queryClient.invalidateQueries({ queryKey: ["video-page-stats"] });
      toast.success("Page settings saved");
      onClose();
    },
    onError: () => toast.error("Failed to save"),
  });

  const toggleVideo = (videoId: string) => {
    setSelectedVideoIds((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId]
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit: {page.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-base font-medium">Private Access</Label>
              <p className="text-sm text-muted-foreground">
                Require email verification to view
              </p>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>

          {isPrivate && (
            <div>
              <Label>Allowed Emails (one per line)</Label>
              <Textarea
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="user@example.com&#10;partner@company.com"
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          )}

          <div>
            <Label className="mb-2 block">Videos in Collection</Label>
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {allVideos.length === 0 ? (
                <p className="p-4 text-muted-foreground text-center">No videos available</p>
              ) : (
                allVideos.map((video) => (
                  <label
                    key={video.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                  >
                    <Checkbox
                      checked={selectedVideoIds.includes(video.id)}
                      onCheckedChange={() => toggleVideo(video.id)}
                    />
                    {video.thumbnail_url && (
                      <img
                        src={video.thumbnail_url}
                        alt=""
                        className="w-12 h-8 object-cover rounded"
                      />
                    )}
                    <span className="text-sm">{video.title}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedVideoIds.length} video(s) selected
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
