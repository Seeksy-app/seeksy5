import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, FileText, Type, BarChart3, Clock, Users } from "lucide-react";
import { toast } from "sonner";

interface AddBlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  nextOrder: number;
}

const blockTypes = [
  {
    type: "video",
    label: "Video",
    description: "Embed a demo video or YouTube link",
    icon: Video,
    defaultContent: { url: "", description: "" },
  },
  {
    type: "document",
    label: "Document",
    description: "Upload PDF, proposal, or link to document",
    icon: FileText,
    defaultContent: { url: "", filename: "", description: "" },
  },
  {
    type: "text",
    label: "Rich Text",
    description: "Add formatted text, headings, and lists",
    icon: Type,
    defaultContent: { content: "" },
  },
  {
    type: "metrics",
    label: "Key Metrics",
    description: "Display important numbers and KPIs",
    icon: BarChart3,
    defaultContent: { metrics: [] },
  },
  {
    type: "timeline",
    label: "Timeline",
    description: "Show project phases or milestones",
    icon: Clock,
    defaultContent: { items: [] },
  },
  {
    type: "team",
    label: "Team Members",
    description: "Introduce team members with photos and bios",
    icon: Users,
    defaultContent: { members: [] },
  },
];

export function AddBlockModal({ open, onOpenChange, pageId, nextOrder }: AddBlockModalProps) {
  const queryClient = useQueryClient();

  const createBlockMutation = useMutation({
    mutationFn: async (blockType: string) => {
      const blockConfig = blockTypes.find((b) => b.type === blockType);
      const { error } = await supabase.from("admin_share_page_blocks").insert({
        page_id: pageId,
        block_type: blockType,
        content: blockConfig?.defaultContent || {},
        display_order: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-share-page-blocks", pageId] });
      toast.success("Block added");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to add block");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Content Block</DialogTitle>
          <DialogDescription>
            Choose a block type to add to your share page
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          {blockTypes.map((block) => (
            <Button
              key={block.type}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-accent"
              onClick={() => createBlockMutation.mutate(block.type)}
              disabled={createBlockMutation.isPending}
            >
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <block.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">{block.label}</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                {block.description}
              </p>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
