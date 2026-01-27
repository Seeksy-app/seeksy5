import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, GripVertical } from "lucide-react";

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  display_order: number;
  is_system: boolean;
}

export const PipelineStagesManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [stageName, setStageName] = useState("");
  const [stageColor, setStageColor] = useState("#3b82f6");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: stages, isLoading } = useQuery({
    queryKey: ["pipeline-stages", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const result = await (supabase as any)
        .from("pipeline_stages")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true });
      
      if (result.error) throw result.error;
      return result.data as PipelineStage[];
    },
    enabled: !!user,
  });

  const createStageMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      if (!user) throw new Error("User not authenticated");

      const maxOrder = Math.max(...(stages?.map(s => s.display_order) || [0]));
      
      const result = await (supabase as any)
        .from("pipeline_stages")
        .insert({
          user_id: user.id,
          name,
          color,
          display_order: maxOrder + 1,
          is_system: false,
        });

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      toast({
        title: "Stage created",
        description: "Pipeline stage has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["pipeline-stages"] });
      setShowCreateDialog(false);
      setStageName("");
      setStageColor("#3b82f6");
    },
    onError: (error: any) => {
      toast({
        title: "Error creating stage",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name: string; color: string }) => {
      const result = await (supabase as any)
        .from("pipeline_stages")
        .update({ name, color })
        .eq("id", id);

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      toast({
        title: "Stage updated",
        description: "Pipeline stage has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["pipeline-stages"] });
      setEditingStage(null);
      setStageName("");
      setStageColor("#3b82f6");
    },
    onError: (error: any) => {
      toast({
        title: "Error updating stage",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: async (stageId: string) => {
      const result = await (supabase as any)
        .from("pipeline_stages")
        .delete()
        .eq("id", stageId);

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      toast({
        title: "Stage deleted",
        description: "Pipeline stage has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["pipeline-stages"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting stage",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateOrUpdate = () => {
    if (!stageName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a stage name.",
        variant: "destructive",
      });
      return;
    }

    if (editingStage) {
      updateStageMutation.mutate({ id: editingStage.id, name: stageName, color: stageColor });
    } else {
      createStageMutation.mutate({ name: stageName, color: stageColor });
    }
  };

  const handleEdit = (stage: PipelineStage) => {
    setEditingStage(stage);
    setStageName(stage.name);
    setStageColor(stage.color);
    setShowCreateDialog(true);
  };

  const handleDialogClose = (open: boolean) => {
    setShowCreateDialog(open);
    if (!open) {
      setEditingStage(null);
      setStageName("");
      setStageColor("#3b82f6");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Pipeline Stages</CardTitle>
            <CardDescription>
              Customize your sales pipeline stages to track contacts through your workflow
            </CardDescription>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Stage
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingStage ? "Edit" : "Create"} Pipeline Stage</DialogTitle>
                <DialogDescription>
                  {editingStage ? "Update" : "Add"} a custom stage to your sales pipeline
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stage-name">Stage Name</Label>
                  <Input
                    id="stage-name"
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    placeholder="e.g., Qualified Lead"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stage-color">Stage Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="stage-color"
                      type="color"
                      value={stageColor}
                      onChange={(e) => setStageColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Badge style={{ backgroundColor: stageColor, color: 'white' }}>
                      {stageName || "Preview"}
                    </Badge>
                  </div>
                </div>

                <Button
                  onClick={handleCreateOrUpdate}
                  disabled={createStageMutation.isPending || updateStageMutation.isPending}
                  className="w-full"
                >
                  {editingStage ? "Update Stage" : "Create Stage"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading stages...</p>
        ) : stages && stages.length > 0 ? (
          <div className="space-y-2">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <Badge style={{ backgroundColor: stage.color, color: 'white' }}>
                    {stage.name}
                  </Badge>
                  {stage.is_system && (
                    <span className="text-xs text-muted-foreground">(Default)</span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(stage)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!stage.is_system && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteStageMutation.mutate(stage.id)}
                      disabled={deleteStageMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No pipeline stages yet. Add your first stage to get started.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
