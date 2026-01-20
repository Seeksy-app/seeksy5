import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Video, ExternalLink, FileText, Save, Volume2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { DecisionTable } from "@/components/board/DecisionTable";

interface DecisionRow {
  Topic: string;
  Option: string;
  Upside: string;
  Risk: string;
  Decision: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  canceled: "bg-red-100 text-red-800",
};

export default function BoardMeetingDetailPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [myNotes, setMyNotes] = useState("");
  const [activeTab, setActiveTab] = useState("agenda");

  const { data: meeting, isLoading: meetingLoading } = useQuery({
    queryKey: ["board-meeting", meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("board_meetings")
        .select("*")
        .eq("id", meetingId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!meetingId,
  });

  const { data: content } = useQuery({
    queryKey: ["board-meeting-content", meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("board_meeting_content")
        .select("*")
        .eq("meeting_id", meetingId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!meetingId,
  });

  const { data: attachments = [] } = useQuery({
    queryKey: ["board-meeting-attachments", meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("board_meeting_attachments")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!meetingId,
  });

  const { data: memberNotes } = useQuery({
    queryKey: ["board-meeting-member-notes", meetingId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("board_meeting_member_notes")
        .select("*")
        .eq("meeting_id", meetingId)
        .eq("member_user_id", user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!meetingId && !!user?.id,
  });

  // Fetch meeting notes with audio URL
  const { data: meetingNotes } = useQuery({
    queryKey: ["board-meeting-notes", meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("board_meeting_notes")
        .select("audio_file_url, audio_transcript")
        .eq("id", meetingId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!meetingId,
  });

  useEffect(() => {
    if (memberNotes?.notes_md) {
      setMyNotes(memberNotes.notes_md);
    }
  }, [memberNotes]);

  const saveNotesMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !meetingId) throw new Error("Missing user or meeting");
      
      const { error } = await supabase
        .from("board_meeting_member_notes")
        .upsert({
          meeting_id: meetingId,
          member_user_id: user.id,
          notes_md: myNotes,
        }, { onConflict: "meeting_id,member_user_id" });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notes saved");
      queryClient.invalidateQueries({ queryKey: ["board-meeting-member-notes", meetingId] });
    },
    onError: () => {
      toast.error("Failed to save notes");
    },
  });

  if (meetingLoading) {
    return <div className="container mx-auto py-8 text-center">Loading...</div>;
  }

  if (!meeting) {
    return <div className="container mx-auto py-8 text-center">Meeting not found</div>;
  }

  const decisionRows: DecisionRow[] = (content?.decision_table_json as any)?.rows || [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{meeting.title}</h1>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(meeting.starts_at), "EEEE, MMMM d, yyyy")}
                    </span>
                    <span>
                      {format(new Date(meeting.starts_at), "h:mm a")}
                      {meeting.ends_at && ` - ${format(new Date(meeting.ends_at), "h:mm a")}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    {meeting.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {meeting.location}
                      </span>
                    )}
                    {meeting.virtual_link && (
                      <a
                        href={meeting.virtual_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Video className="h-4 w-4" />
                        Join Virtual Meeting
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
                <Badge className={statusColors[meeting.status] || "bg-muted"}>
                  {meeting.status.replace("_", " ")}
                </Badge>
              </div>

              {/* Audio Recording Player */}
              {meetingNotes?.audio_file_url && (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Volume2 className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-medium text-sm">Meeting Recording</h3>
                  </div>
                  <audio
                    controls
                    className="w-full h-10 rounded-lg"
                    src={meetingNotes.audio_file_url}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="agenda">Agenda</TabsTrigger>
                  <TabsTrigger value="memo">Board Memo</TabsTrigger>
                  <TabsTrigger value="notes">Meeting Notes</TabsTrigger>
                  <TabsTrigger value="decisions">Decisions</TabsTrigger>
                  <TabsTrigger value="attachments">Attachments</TabsTrigger>
                </TabsList>

                <TabsContent value="agenda" className="space-y-6">
                  {content?.initial_agenda_md && (
                    <div>
                      <h3 className="font-semibold mb-2">Initial Agenda</h3>
                      <div className="prose prose-sm max-w-none bg-muted/50 rounded-lg p-4">
                        <pre className="whitespace-pre-wrap text-sm">{content.initial_agenda_md}</pre>
                      </div>
                    </div>
                  )}
                  {content?.ai_agenda_md && (
                    <div>
                      <h3 className="font-semibold mb-2">AI Prepared Agenda</h3>
                      <div className="prose prose-sm max-w-none bg-muted/50 rounded-lg p-4">
                        <pre className="whitespace-pre-wrap text-sm">{content.ai_agenda_md}</pre>
                      </div>
                    </div>
                  )}
                  {!content?.initial_agenda_md && !content?.ai_agenda_md && (
                    <p className="text-muted-foreground">No agenda available yet.</p>
                  )}
                </TabsContent>

                <TabsContent value="memo">
                  {content?.board_memo_md ? (
                    <div className="prose prose-sm max-w-none bg-muted/50 rounded-lg p-4">
                      <pre className="whitespace-pre-wrap text-sm">{content.board_memo_md}</pre>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No board memo available yet.</p>
                  )}
                </TabsContent>

                <TabsContent value="notes">
                  {content?.meeting_notes_md ? (
                    <div className="prose prose-sm max-w-none bg-muted/50 rounded-lg p-4">
                      <pre className="whitespace-pre-wrap text-sm">{content.meeting_notes_md}</pre>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No meeting notes available yet.</p>
                  )}
                </TabsContent>

                <TabsContent value="decisions" className="space-y-6">
                  {decisionRows.length > 0 ? (
                    <DecisionTable rows={decisionRows} onDecisionChange={() => {}} readOnly />
                  ) : (
                    <p className="text-muted-foreground">No decisions recorded yet.</p>
                  )}
                  {content?.post_meeting_decisions_summary_md && (
                    <div>
                      <h3 className="font-semibold mb-2">Post-Meeting Decisions Summary</h3>
                      <div className="prose prose-sm max-w-none bg-muted/50 rounded-lg p-4">
                        <pre className="whitespace-pre-wrap text-sm">{content.post_meeting_decisions_summary_md}</pre>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="attachments">
                  {attachments.length > 0 ? (
                    <div className="space-y-2">
                      {attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.type === "file" ? att.file_url : att.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          <span>{att.label}</span>
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No attachments available.</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Member Notes */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">My Questions / Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Add questions you want covered, risks to discuss, or decisions you want clarified…"
                value={myNotes}
                onChange={(e) => setMyNotes(e.target.value)}
                rows={12}
                className="resize-none"
              />
              <Button
                onClick={() => saveNotesMutation.mutate()}
                disabled={saveNotesMutation.isPending}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveNotesMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
