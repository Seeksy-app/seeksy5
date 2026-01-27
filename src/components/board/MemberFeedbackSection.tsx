import { useState } from "react";
import { format } from "date-fns";
import { MessageSquarePlus, Send, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MemberNote {
  id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface MemberFeedbackSectionProps {
  meetingId: string;
  memberNotes: MemberNote[];
  onNotesUpdated: () => void;
}

export const MemberFeedbackSection: React.FC<MemberFeedbackSectionProps> = ({
  meetingId,
  memberNotes = [],
  onNotesUpdated,
}) => {
  const { user } = useAuth();
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitNote = async () => {
    if (!newNote.trim() || !user) return;

    setIsSubmitting(true);
    try {
      // Get user profile for name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, account_full_name")
        .eq("id", user.id)
        .single();

      const authorName = profile?.full_name || profile?.account_full_name || user.email?.split("@")[0] || "Board Member";

      const newMemberNote: MemberNote = {
        id: crypto.randomUUID(),
        author_id: user.id,
        author_name: authorName,
        content: newNote.trim(),
        created_at: new Date().toISOString(),
      };

      const updatedNotes = [...memberNotes, newMemberNote];

      const result = await (supabase as any)
        .from("board_meeting_notes")
        .update({ member_notes: updatedNotes as any })
        .eq("id", meetingId);

      if (result.error) throw result.error;

      setNewNote("");
      onNotesUpdated();
      toast.success("Your feedback has been added");
    } catch (error) {
      console.error("Error adding member note:", error);
      toast.error("Failed to add feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10">
            <MessageSquarePlus className="w-5 h-5 text-blue-600" />
          </div>
          Board Member Feedback
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Share your thoughts, questions, or follow-up items after reviewing the meeting notes
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Notes */}
        {memberNotes.length > 0 && (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-3">
              {memberNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 bg-card border rounded-xl space-y-2"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span className="font-medium text-foreground">{note.author_name}</span>
                    <span>•</span>
                    <span>{format(new Date(note.created_at), "MMM d 'at' h:mm a")}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{note.content}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {memberNotes.length > 0 && <Separator />}

        {/* Add New Note */}
        <div className="space-y-3">
          <Textarea
            placeholder="Add your thoughts, questions, or follow-up items..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitNote}
              disabled={!newNote.trim() || isSubmitting}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
