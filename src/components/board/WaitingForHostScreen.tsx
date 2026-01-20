import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, MessageSquare, Send, CalendarDays, ListPlus, FileText, ArrowLeft, Video, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AgendaItem {
  text: string;
  checked: boolean;
}

interface MemberQuestion {
  id: string;
  author: string;
  text: string;
  created_at: string;
}

interface WaitingForHostScreenProps {
  meeting: {
    id: string;
    title: string;
    meeting_date: string;
    start_time: string | null;
    duration_minutes: number;
    agenda_items: AgendaItem[];
    memo: any;
    member_questions: MemberQuestion[];
  };
  currentUserName: string;
  onAddQuestion: (question: string) => void;
  onAddAgendaItem?: (item: string) => void;
  onSaveNotes?: (notes: string) => void;
  memberNotes?: string;
  onHostStarted?: () => void;
}

export function WaitingForHostScreen({
  meeting,
  currentUserName,
  onAddQuestion,
  onAddAgendaItem,
  onSaveNotes,
  memberNotes = "",
  onHostStarted,
}: WaitingForHostScreenProps) {
  const navigate = useNavigate();
  const [newQuestion, setNewQuestion] = useState("");
  const [newAgendaItem, setNewAgendaItem] = useState("");
  const [notes, setNotes] = useState(memberNotes);
  const [showAgendaInput, setShowAgendaInput] = useState(false);
  const [hostHasStarted, setHostHasStarted] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Realtime subscription for instant participant auto-refresh
  useEffect(() => {
    const channel = supabase
      .channel(`waiting-for-host-${meeting.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'board_meeting_notes',
          filter: `id=eq.${meeting.id}`,
        },
        (payload) => {
          const updated = payload.new as { host_has_started?: boolean; status?: string };
          if (updated.host_has_started) {
            setHostHasStarted(true);
            toast.success("Host has started the meeting! You can now join.");
            onHostStarted?.();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meeting.id, onHostStarted]);

  const handleSubmitQuestion = () => {
    if (!newQuestion.trim()) return;
    onAddQuestion(newQuestion.trim());
    setNewQuestion("");
  };

  const handleSubmitAgendaItem = () => {
    if (!newAgendaItem.trim() || !onAddAgendaItem) return;
    onAddAgendaItem(newAgendaItem.trim());
    setNewAgendaItem("");
    setShowAgendaInput(false);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (onSaveNotes) {
      onSaveNotes(value);
    }
  };

  const handleSaveAndExit = () => {
    if (onSaveNotes && notes) {
      onSaveNotes(notes);
    }
    toast.success("Your inputs have been saved. The host will review them before the meeting.");
    navigate("/board/meetings");
  };

  const formatMeetingDate = (dateStr: string) => {
    return format(new Date(dateStr + "T12:00:00"), "EEEE, MMMM d, yyyy");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      {/* Header with Save & Exit */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/board/meetings")}
          className="text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Meetings
        </Button>
        <Button variant="secondary" onClick={handleSaveAndExit}>
          Save & Exit
        </Button>
      </div>

      {/* Waiting/Ready banner */}
      {hostHasStarted ? (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
              <Video className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
              Host Has Started — Join Now
            </h2>
            <p className="text-green-700 dark:text-green-300 mb-4">
              The meeting is live! Click below to join the video call.
            </p>
            <Button 
              onClick={() => {
                setIsJoining(true);
                onHostStarted?.();
              }}
              disabled={isJoining}
              className="gap-2"
            >
              {isJoining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4" />
                  Join Meeting
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
              <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold text-amber-800 dark:text-amber-200 mb-2">
              Waiting for Host to Start
            </h2>
            <p className="text-amber-700 dark:text-amber-300">
              The meeting will begin when the host starts it. You can review the agenda, add questions, suggest agenda items, and prepare notes below.
            </p>
            <Badge variant="outline" className="mt-3 border-amber-300 text-amber-700">
              <Clock className="w-3 h-3 mr-1" />
              Upcoming
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Meeting details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            {meeting.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>
              <strong>Date:</strong> {formatMeetingDate(meeting.meeting_date)}
            </span>
            {meeting.start_time && (
              <span>
                <strong>Time:</strong> {meeting.start_time.substring(0, 5)}
              </span>
            )}
            <span>
              <strong>Duration:</strong> {meeting.duration_minutes} minutes
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Agenda with ability to suggest items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ListPlus className="w-5 h-5" />
              Agenda
            </CardTitle>
            {onAddAgendaItem && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAgendaInput(!showAgendaInput)}
              >
                Suggest Item
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {meeting.agenda_items.length > 0 ? (
            <ul className="space-y-2 mb-4">
              {meeting.agenda_items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-muted-foreground font-mono text-sm">
                    {i + 1}.
                  </span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm mb-4">No agenda items yet.</p>
          )}

          {/* Add agenda item input */}
          {showAgendaInput && onAddAgendaItem && (
            <div className="flex gap-2 pt-2 border-t">
              <Input
                placeholder="Suggest an agenda item..."
                value={newAgendaItem}
                onChange={(e) => setNewAgendaItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitAgendaItem()}
              />
              <Button onClick={handleSubmitAgendaItem} disabled={!newAgendaItem.trim()}>
                Add
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Board Memo (read-only) */}
      {meeting.memo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Board Memo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {meeting.memo.purpose && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Purpose</h4>
                <p>{meeting.memo.purpose}</p>
              </div>
            )}
            {meeting.memo.objective && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Objective</h4>
                <p>{meeting.memo.objective}</p>
              </div>
            )}
            {meeting.memo.key_questions?.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Key Questions</h4>
                <ul className="list-disc list-inside space-y-1">
                  {meeting.memo.key_questions.map((q: string, i: number) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pre-meeting notes */}
      {onSaveNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              My Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add your personal notes for this meeting..."
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Notes are saved automatically and visible only to you.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pre-meeting questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5" />
            Pre-Meeting Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Existing questions */}
            {meeting.member_questions.length > 0 && (
              <div className="space-y-2">
                {meeting.member_questions.map((q) => (
                  <div key={q.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {q.author}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(q.created_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm">{q.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add new question */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a question for the meeting..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitQuestion()}
              />
              <Button onClick={handleSubmitQuestion} disabled={!newQuestion.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your questions will be visible to all participants when the meeting starts.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
