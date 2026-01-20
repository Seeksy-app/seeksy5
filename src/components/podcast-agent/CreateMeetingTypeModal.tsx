import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Loader2 } from "lucide-react";

interface CreateMeetingTypeModalProps {
  open: boolean;
  onClose: () => void;
  suggestedName?: string;
  onCreated?: (meetingType: { id: string; name: string; slug: string }) => void;
}

export function CreateMeetingTypeModal({ 
  open, 
  onClose, 
  suggestedName = "Pre-Podcast Interview",
  onCreated 
}: CreateMeetingTypeModalProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState(suggestedName);
  const [duration, setDuration] = useState("30");
  const [description, setDescription] = useState(
    "A quick pre-interview call to discuss the upcoming podcast episode, go over talking points, and answer any questions."
  );

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the meeting type",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      const { data, error } = await supabase
        .from("meeting_types")
        .insert({
          user_id: user.id,
          name: name.trim(),
          slug,
          duration: parseInt(duration),
          description: description.trim(),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Meeting type created",
        description: `"${name}" is now available for scheduling`,
      });

      onCreated?.({
        id: data.id,
        name: data.name,
        slug: data.slug,
      });
      onClose();
    } catch (error) {
      console.error("Error creating meeting type:", error);
      toast({
        title: "Failed to create",
        description: error instanceof Error ? error.message : "Could not create meeting type",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Create Meeting Type</DialogTitle>
              <DialogDescription>
                Set up a new meeting template for podcast interviews
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Meeting Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Pre-Podcast Interview"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this meeting is for..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Meeting Type"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
