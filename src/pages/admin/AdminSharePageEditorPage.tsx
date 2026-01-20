import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Save, Eye, Loader2, GripVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SharePageBlockEditor } from "@/components/admin/share/SharePageBlockEditor";
import { AddBlockModal } from "@/components/admin/share/AddBlockModal";

interface Block {
  id: string;
  block_type: string;
  title: string | null;
  content: any;
  display_order: number;
  is_visible: boolean;
}

export default function AdminSharePageEditorPage() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);

  const { data: page, isLoading: pageLoading } = useQuery({
    queryKey: ["admin-share-page", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_share_pages")
        .select("*")
        .eq("id", pageId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!pageId,
  });

  const { data: blocks, isLoading: blocksLoading } = useQuery({
    queryKey: ["admin-share-page-blocks", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_share_page_blocks")
        .select("*")
        .eq("page_id", pageId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Block[];
    },
    enabled: !!pageId,
  });

  const updatePageMutation = useMutation({
    mutationFn: async (updates: Partial<typeof page>) => {
      const { error } = await supabase
        .from("admin_share_pages")
        .update(updates)
        .eq("id", pageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-share-page", pageId] });
      toast.success("Page settings saved");
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase
        .from("admin_share_page_blocks")
        .delete()
        .eq("id", blockId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-share-page-blocks", pageId] });
      toast.success("Block deleted");
    },
  });

  if (pageLoading || blocksLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Share page not found</p>
            <Button className="mt-4" onClick={() => navigate("/admin/share")}>
              Back to Share Pages
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/share")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{page.title}</h1>
            <p className="text-sm text-muted-foreground font-mono">/share/{page.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.open(`/share/${page.slug}`, "_blank")}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList>
          <TabsTrigger value="content">Content Blocks</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Content Blocks</h2>
            <Button onClick={() => setIsAddBlockOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Block
            </Button>
          </div>

          {blocks?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No content blocks yet. Add your first block to get started.
                </p>
                <Button onClick={() => setIsAddBlockOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Block
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {blocks?.map((block) => (
                <Card key={block.id} className={!block.is_visible ? "opacity-50" : ""}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <div>
                          <CardTitle className="text-base">
                            {block.title || getBlockTypeLabel(block.block_type)}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground capitalize">
                            {block.block_type} block
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={block.is_visible}
                          onCheckedChange={async (checked) => {
                            await supabase
                              .from("admin_share_page_blocks")
                              .update({ is_visible: checked })
                              .eq("id", block.id);
                            queryClient.invalidateQueries({ queryKey: ["admin-share-page-blocks", pageId] });
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this block?")) {
                              deleteBlockMutation.mutate(block.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SharePageBlockEditor
                      block={block}
                      pageId={pageId!}
                      onUpdate={() => queryClient.invalidateQueries({ queryKey: ["admin-share-page-blocks", pageId] })}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Page Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    defaultValue={page.title}
                    onBlur={(e) => updatePageMutation.mutate({ title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <Input
                    defaultValue={page.slug}
                    onBlur={(e) => updatePageMutation.mutate({ slug: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  defaultValue={page.description || ""}
                  onBlur={(e) => updatePageMutation.mutate({ description: e.target.value || null })}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-muted-foreground">
                    When disabled, the page cannot be accessed
                  </p>
                </div>
                <Switch
                  checked={page.is_active}
                  onCheckedChange={(checked) => updatePageMutation.mutate({ is_active: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Page Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-3xl font-bold">{page.view_count}</p>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-3xl font-bold">
                    {page.created_at ? new Date(page.created_at).toLocaleDateString() : "-"}
                  </p>
                  <p className="text-sm text-muted-foreground">Created</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-3xl font-bold">
                    {page.expires_at ? new Date(page.expires_at).toLocaleDateString() : "Never"}
                  </p>
                  <p className="text-sm text-muted-foreground">Expires</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddBlockModal
        open={isAddBlockOpen}
        onOpenChange={setIsAddBlockOpen}
        pageId={pageId!}
        nextOrder={blocks?.length || 0}
      />
    </div>
  );
}

function getBlockTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    video: "Video",
    document: "Document",
    text: "Text Content",
    metrics: "Key Metrics",
    timeline: "Timeline",
    team: "Team Members",
  };
  return labels[type] || type;
}
