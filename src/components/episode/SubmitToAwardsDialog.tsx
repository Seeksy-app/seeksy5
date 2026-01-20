import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SubmitToAwardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episode: {
    id: string;
    title: string;
    description?: string;
    audio_url?: string;
    cover_image_url?: string;
    podcast_id: string;
  };
}

export function SubmitToAwardsDialog({
  open,
  onOpenChange,
  episode,
}: SubmitToAwardsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Fetch user
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch available programs
  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ["awards-programs-active"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("awards_programs")
        .select("*")
        .in("status", ["nominations_open", "voting_open", "completed"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch categories for selected program
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["award-categories", selectedProgram],
    queryFn: async () => {
      if (!selectedProgram) return [];
      const { data, error } = await supabase
        .from("award_categories")
        .select("*")
        .eq("program_id", selectedProgram)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedProgram,
  });

  // Submit nomination
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedProgram || !selectedCategory) {
        throw new Error("Missing required information");
      }

      // Create nominee (database will prevent duplicates via constraints)
      const { error } = await supabase
        .from("award_nominees")
        .insert({
          program_id: selectedProgram,
          category_id: selectedCategory,
          nominee_name: episode.title,
          nominee_description: episode.description || "",
          nominee_image_url: episode.cover_image_url,
          audio_url: episode.audio_url,
          podcast_episode_id: episode.id,
          submitted_by_user_id: user.id,
          status: "pending",
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error("This episode is already nominated in this category");
        }
        throw error;
      }
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["award-nominees"] });
      toast({
        title: "Nomination Submitted!",
        description: "Your episode has been submitted for review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setSelectedProgram("");
    setSelectedCategory("");
    setSubmitted(false);
    onOpenChange(false);
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <DialogTitle className="text-center">Nomination Submitted!</DialogTitle>
            <DialogDescription className="text-center">
              Your episode has been submitted for review. You'll be notified when it's approved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Submit to Awards
          </DialogTitle>
          <DialogDescription>
            Submit "{episode.title}" to an active awards program
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Episode Preview */}
          <Card>
            <CardContent className="pt-4">
              <p className="font-medium text-sm mb-2">Episode</p>
              <p className="text-muted-foreground text-sm">{episode.title}</p>
            </CardContent>
          </Card>

          {/* Program Selection */}
          <div className="space-y-2">
            <Label htmlFor="program">Awards Program</Label>
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger id="program">
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                {programsLoading && (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
                {programs?.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.title}
                  </SelectItem>
                ))}
                {!programsLoading && programs?.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No active programs accepting nominations
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Category Selection */}
          {selectedProgram && (
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                disabled={categoriesLoading}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesLoading && (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={!selectedProgram || !selectedCategory || submitMutation.isPending}
          >
            {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Nomination
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
