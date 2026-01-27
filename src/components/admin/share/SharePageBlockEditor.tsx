import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Block {
  id: string;
  block_type: string;
  title: string | null;
  content: any;
  display_order: number;
  is_visible: boolean;
}

interface SharePageBlockEditorProps {
  block: Block;
  pageId: string;
  onUpdate: () => void;
}

export function SharePageBlockEditor({ block, pageId, onUpdate }: SharePageBlockEditorProps) {
  const [content, setContent] = useState(block.content);
  const [title, setTitle] = useState(block.title || "");

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("admin_share_page_blocks")
        .update({ content, title: title || null })
        .eq("id", block.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Block saved");
      onUpdate();
    },
    onError: () => {
      toast.error("Failed to save block");
    },
  });

  const renderEditor = () => {
    switch (block.block_type) {
      case "video":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Block Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Product Demo"
              />
            </div>
            <div className="space-y-2">
              <Label>Video URL</Label>
              <Input
                value={content.url || ""}
                onChange={(e) => setContent({ ...content, url: e.target.value })}
                placeholder="https://youtube.com/watch?v=... or video file URL"
              />
              <p className="text-xs text-muted-foreground">
                Supports YouTube, Vimeo, or direct video URLs
              </p>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={content.description || ""}
                onChange={(e) => setContent({ ...content, description: e.target.value })}
                placeholder="Brief description of the video..."
                rows={2}
              />
            </div>
          </div>
        );

      case "document":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Block Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Project Proposal"
              />
            </div>
            <div className="space-y-2">
              <Label>Document URL</Label>
              <Input
                value={content.url || ""}
                onChange={(e) => setContent({ ...content, url: e.target.value })}
                placeholder="https://... (PDF, Google Doc, etc.)"
              />
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={content.filename || ""}
                onChange={(e) => setContent({ ...content, filename: e.target.value })}
                placeholder="VPA_Proposal_2024.pdf"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={content.description || ""}
                onChange={(e) => setContent({ ...content, description: e.target.value })}
                placeholder="What's in this document..."
                rows={2}
              />
            </div>
          </div>
        );

      case "text":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Block Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Project Overview"
              />
            </div>
            <div className="space-y-2">
              <Label>Content (Markdown supported)</Label>
              <Textarea
                value={content.content || ""}
                onChange={(e) => setContent({ ...content, content: e.target.value })}
                placeholder="Write your content here... You can use **bold**, *italic*, and other Markdown formatting."
                rows={8}
              />
            </div>
          </div>
        );

      case "metrics":
        const metrics = content.metrics || [];
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Block Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Key Results"
              />
            </div>
            <div className="space-y-3">
              <Label>Metrics</Label>
              {metrics.map((metric: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={metric.label}
                    onChange={(e) => {
                      const newMetrics = [...metrics];
                      newMetrics[index].label = e.target.value;
                      setContent({ ...content, metrics: newMetrics });
                    }}
                    placeholder="Label"
                    className="flex-1"
                  />
                  <Input
                    value={metric.value}
                    onChange={(e) => {
                      const newMetrics = [...metrics];
                      newMetrics[index].value = e.target.value;
                      setContent({ ...content, metrics: newMetrics });
                    }}
                    placeholder="Value"
                    className="w-32"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newMetrics = metrics.filter((_: any, i: number) => i !== index);
                      setContent({ ...content, metrics: newMetrics });
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setContent({ ...content, metrics: [...metrics, { label: "", value: "" }] })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Metric
              </Button>
            </div>
          </div>
        );

      case "timeline":
        const items = content.items || [];
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Block Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Project Timeline"
              />
            </div>
            <div className="space-y-3">
              <Label>Timeline Items</Label>
              {items.map((item: any, index: number) => (
                <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={item.date}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].date = e.target.value;
                        setContent({ ...content, items: newItems });
                      }}
                      placeholder="Date/Phase"
                    />
                    <Input
                      value={item.title}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].title = e.target.value;
                        setContent({ ...content, items: newItems });
                      }}
                      placeholder="Title"
                    />
                    <Textarea
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].description = e.target.value;
                        setContent({ ...content, items: newItems });
                      }}
                      placeholder="Description"
                      rows={2}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newItems = items.filter((_: any, i: number) => i !== index);
                      setContent({ ...content, items: newItems });
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setContent({ ...content, items: [...items, { date: "", title: "", description: "" }] })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        );

      case "team":
        const members = content.members || [];
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Block Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Meet the Team"
              />
            </div>
            <div className="space-y-3">
              <Label>Team Members</Label>
              {members.map((member: any, index: number) => (
                <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={member.name}
                      onChange={(e) => {
                        const newMembers = [...members];
                        newMembers[index].name = e.target.value;
                        setContent({ ...content, members: newMembers });
                      }}
                      placeholder="Name"
                    />
                    <Input
                      value={member.role}
                      onChange={(e) => {
                        const newMembers = [...members];
                        newMembers[index].role = e.target.value;
                        setContent({ ...content, members: newMembers });
                      }}
                      placeholder="Role"
                    />
                    <Input
                      value={member.image}
                      onChange={(e) => {
                        const newMembers = [...members];
                        newMembers[index].image = e.target.value;
                        setContent({ ...content, members: newMembers });
                      }}
                      placeholder="Photo URL"
                    />
                    <Textarea
                      value={member.bio}
                      onChange={(e) => {
                        const newMembers = [...members];
                        newMembers[index].bio = e.target.value;
                        setContent({ ...content, members: newMembers });
                      }}
                      placeholder="Short bio"
                      rows={2}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newMembers = members.filter((_: any, i: number) => i !== index);
                      setContent({ ...content, members: newMembers });
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setContent({ ...content, members: [...members, { name: "", role: "", image: "", bio: "" }] })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          </div>
        );

      default:
        return <p className="text-muted-foreground">Unknown block type</p>;
    }
  };

  return (
    <div className="space-y-4">
      {renderEditor()}
      <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
        <Save className="h-4 w-4 mr-2" />
        Save Block
      </Button>
    </div>
  );
}
