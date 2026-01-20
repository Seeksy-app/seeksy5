import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Send, User, StickyNote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface StickyMemberNotesProps {
  meetingId: string;
  memberNotes?: MemberNote[];
  onNotesUpdated?: () => void;
}

export const StickyMemberNotes: React.FC<StickyMemberNotesProps> = ({
  meetingId,
  memberNotes: initialMemberNotes = [],
  onNotesUpdated,
}) => {
  const { user } = useAuth();
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myNotes, setMyNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fetch user's own notes from the dedicated table
  const fetchMyNotes = useCallback(async () => {
    if (!user || !meetingId) return;

    const { data, error } = await supabase
      .from("board_meeting_member_notes")
      .select("notes_md, updated_at")
      .eq("meeting_id", meetingId)
      .eq("member_user_id", user.id)
      .maybeSingle();

    if (data) {
      setMyNotes(data.notes_md || "");
      setLastSaved(new Date(data.updated_at));
    }
  }, [user, meetingId]);

  useEffect(() => {
    fetchMyNotes();
  }, [fetchMyNotes]);

  const handleSaveNotes = async () => {
    if (!user || !meetingId) return;

    setIsSaving(true);
    try {
      // Upsert notes to the dedicated member notes table
      const { error } = await supabase
        .from("board_meeting_member_notes")
        .upsert({
          meeting_id: meetingId,
          member_user_id: user.id,
          notes_md: myNotes,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "meeting_id,member_user_id"
        });

      if (error) throw error;

      setLastSaved(new Date());
      toast.success("Notes saved");
      onNotesUpdated?.();
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (!myNotes || !user) return;
    
    const timer = setTimeout(() => {
      handleSaveNotes();
    }, 2000);

    return () => clearTimeout(timer);
  }, [myNotes]);

  return (
    <div className="sticky top-4 h-fit max-h-[calc(100vh-2rem)]">
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <StickyNote className="w-4 h-4 text-blue-600" />
            </div>
            My Notes
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Add notes as you review
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Personal Notes Textarea */}
          <div className="space-y-2">
            <Textarea
              placeholder="Type your notes here..."
              value={myNotes}
              onChange={(e) => setMyNotes(e.target.value)}
              className="min-h-[120px] resize-none text-sm"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {lastSaved ? `Last saved ${format(lastSaved, "h:mm a")}` : "Not saved yet"}
              </span>
              <Button
                onClick={handleSaveNotes}
                disabled={isSaving}
                size="sm"
                className="gap-2"
              >
                <Send className="w-3 h-3" />
                {isSaving ? "Saving..." : "Add Note"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
