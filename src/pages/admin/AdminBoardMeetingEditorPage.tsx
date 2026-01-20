import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Sparkles, Plus, Trash2, Upload } from "lucide-react";
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

export default function AdminBoardMeetingEditorPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [meetingForm, setMeetingForm] = useState({
    title: "",
    starts_at: "",
    ends_at: "",
    location: "",
    virtual_link: "",
    status: "scheduled",
  });

  const [contentForm, setContentForm] = useState({
    initial_agenda_md: "",
    ai_agenda_md: "",
    board_memo_md: "",
    meeting_notes_md: "",
    post_meeting_decisions_summary_md: "",
  });

  const [decisionRows, setDecisionRows] = useState<DecisionRow[]>([]);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const { data: meeting, isLoading: meetingLoading } = useQuery({
    queryKey: ["admin-board-meeting", meetingId],
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
    queryKey: ["admin-board-meeting-content", meetingId],
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

  useEffect(() => {
    if (meeting) {
      setMeetingForm({
        title: meeting.title,
        starts_at: format(new Date(meeting.starts_at), "yyyy-MM-dd'T'HH:mm"),
        ends_at: meeting.ends_at ? format(new Date(meeting.ends_at), "yyyy-MM-dd'T'HH:mm") : "",
        location: meeting.location || "",
        virtual_link: meeting.virtual_link || "",
        status: meeting.status,
      });
    }
  }, [meeting]);

  useEffect(() => {
    if (content) {
      setContentForm({
        initial_agenda_md: content.initial_agenda_md || "",
        ai_agenda_md: content.ai_agenda_md || "",
        board_memo_md: content.board_memo_md || "",
        meeting_notes_md: content.meeting_notes_md || "",
        post_meeting_decisions_summary_md: content.post_meeting_decisions_summary_md || "",
      });
      setDecisionRows((content.decision_table_json as any)?.rows || []);
    }
  }, [content]);

  const saveMeetingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("board_meetings")
        .update({
          title: meetingForm.title,
          starts_at: new Date(meetingForm.starts_at).toISOString(),
          ends_at: meetingForm.ends_at ? new Date(meetingForm.ends_at).toISOString() : null,
          location: meetingForm.location || null,
          virtual_link: meetingForm.virtual_link || null,
          status: meetingForm.status,
        })
        .eq("id", meetingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Meeting saved");
      queryClient.invalidateQueries({ queryKey: ["admin-board-meeting", meetingId] });
    },
    onError: () => toast.error("Failed to save meeting"),
  });

  const saveContentMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        meeting_id: meetingId,
        ...contentForm,
        decision_table_json: { rows: decisionRows },
      };
      const { error } = await supabase
        .from("board_meeting_content")
        .upsert(payload as any, { onConflict: "meeting_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Content saved");
      queryClient.invalidateQueries({ queryKey: ["admin-board-meeting-content", meetingId] });
    },
    onError: () => toast.error("Failed to save content"),
  });

  const handleAiGenerate = async (type: "agenda" | "memo" | "decisions") => {
    setAiLoading(type);
    try {
      const { data, error } = await supabase.functions.invoke(`board-ai-prepare-${type === "decisions" ? "decisions-summary" : type}`, {
        body: {
          meeting_id: meetingId,
          initial_agenda: contentForm.initial_agenda_md,
          decision_table: decisionRows,
        },
      });

      if (error) throw error;

      if (type === "agenda") {
        setContentForm({ ...contentForm, ai_agenda_md: data.result });
      } else if (type === "memo") {
        setContentForm({ ...contentForm, board_memo_md: data.result });
      } else {
        setContentForm({ ...contentForm, post_meeting_decisions_summary_md: data.result });
      }
      toast.success(`AI ${type} generated`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to generate AI ${type}`);
    } finally {
      setAiLoading(null);
    }
  };

  const addDecisionRow = () => {
    setDecisionRows([
      ...decisionRows,
      { Topic: "", Option: "", Upside: "", Risk: "", Decision: "" },
    ]);
  };

  const updateDecisionRow = (index: number, field: keyof DecisionRow, value: string) => {
    const updated = [...decisionRows];
    updated[index] = { ...updated[index], [field]: value };
    setDecisionRows(updated);
  };

  const removeDecisionRow = (index: number) => {
    setDecisionRows(decisionRows.filter((_, i) => i !== index));
  };

  if (meetingLoading) {
    return <div className="container mx-auto py-8 text-center">Loading...</div>;
  }

  if (!meeting) {
    return <div className="container mx-auto py-8 text-center">Meeting not found</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Button variant="ghost" onClick={() => navigate("/admin/board/meetings")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Meetings
      </Button>

      <Tabs defaultValue="metadata">
        <TabsList className="mb-6">
          <TabsTrigger value="metadata">Meeting Details</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="memo">Board Memo</TabsTrigger>
          <TabsTrigger value="notes">Meeting Notes</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
        </TabsList>

        <TabsContent value="metadata">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start</Label>
                  <Input
                    type="datetime-local"
                    value={meetingForm.starts_at}
                    onChange={(e) => setMeetingForm({ ...meetingForm, starts_at: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End</Label>
                  <Input
                    type="datetime-local"
                    value={meetingForm.ends_at}
                    onChange={(e) => setMeetingForm({ ...meetingForm, ends_at: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={meetingForm.location}
                  onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
                />
              </div>
              <div>
                <Label>Virtual Link</Label>
                <Input
                  value={meetingForm.virtual_link}
                  onChange={(e) => setMeetingForm({ ...meetingForm, virtual_link: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={meetingForm.status}
                  onValueChange={(v) => setMeetingForm({ ...meetingForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => saveMeetingMutation.mutate()} disabled={saveMeetingMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Meeting
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agenda">
          <Card>
            <CardHeader>
              <CardTitle>Agenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Initial Agenda (Admin Input)</Label>
                <Textarea
                  value={contentForm.initial_agenda_md}
                  onChange={(e) => setContentForm({ ...contentForm, initial_agenda_md: e.target.value })}
                  rows={8}
                  placeholder="Enter agenda items..."
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleAiGenerate("agenda")}
                  disabled={aiLoading === "agenda"}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {aiLoading === "agenda" ? "Generating..." : "Prepare Agenda (AI)"}
                </Button>
              </div>
              {contentForm.ai_agenda_md && (
                <div>
                  <Label>AI Prepared Agenda</Label>
                  <div className="bg-muted/50 rounded-lg p-4 mt-2">
                    <pre className="whitespace-pre-wrap text-sm">{contentForm.ai_agenda_md}</pre>
                  </div>
                </div>
              )}
              <Button onClick={() => saveContentMutation.mutate()} disabled={saveContentMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Content
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memo">
          <Card>
            <CardHeader>
              <CardTitle>Board Memo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                variant="outline"
                onClick={() => handleAiGenerate("memo")}
                disabled={aiLoading === "memo"}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {aiLoading === "memo" ? "Generating..." : "Prepare 1-page Board Memo (AI)"}
              </Button>
              {contentForm.board_memo_md && (
                <div>
                  <Label>Generated Memo</Label>
                  <Textarea
                    value={contentForm.board_memo_md}
                    onChange={(e) => setContentForm({ ...contentForm, board_memo_md: e.target.value })}
                    rows={20}
                    className="font-mono text-sm mt-2"
                  />
                </div>
              )}
              <Button onClick={() => saveContentMutation.mutate()} disabled={saveContentMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Content
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Notes (Post-meeting)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={contentForm.meeting_notes_md}
                onChange={(e) => setContentForm({ ...contentForm, meeting_notes_md: e.target.value })}
                rows={15}
                placeholder="Enter meeting notes..."
                className="font-mono text-sm"
              />
              <Button onClick={() => saveContentMutation.mutate()} disabled={saveContentMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Content
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Decision Table</CardTitle>
              <Button variant="outline" size="sm" onClick={addDecisionRow}>
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Topic</th>
                      <th className="text-left p-2">Option</th>
                      <th className="text-left p-2">Upside</th>
                      <th className="text-left p-2">Risk</th>
                      <th className="text-left p-2">Decision</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {decisionRows.map((row, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">
                          <Input
                            value={row.Topic}
                            onChange={(e) => updateDecisionRow(index, "Topic", e.target.value)}
                            className="h-8"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={row.Option}
                            onChange={(e) => updateDecisionRow(index, "Option", e.target.value)}
                            className="h-8"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={row.Upside}
                            onChange={(e) => updateDecisionRow(index, "Upside", e.target.value)}
                            className="h-8"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={row.Risk}
                            onChange={(e) => updateDecisionRow(index, "Risk", e.target.value)}
                            className="h-8"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={row.Decision}
                            onChange={(e) => updateDecisionRow(index, "Decision", e.target.value)}
                            className="h-8"
                          />
                        </td>
                        <td className="p-2">
                          <Button variant="ghost" size="sm" onClick={() => removeDecisionRow(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleAiGenerate("decisions")}
                  disabled={aiLoading === "decisions" || decisionRows.length === 0}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {aiLoading === "decisions" ? "Generating..." : "Generate Decisions Summary (AI)"}
                </Button>
              </div>

              {contentForm.post_meeting_decisions_summary_md && (
                <div>
                  <Label>Post-Meeting Decisions Summary</Label>
                  <Textarea
                    value={contentForm.post_meeting_decisions_summary_md}
                    onChange={(e) => setContentForm({ ...contentForm, post_meeting_decisions_summary_md: e.target.value })}
                    rows={10}
                    className="font-mono text-sm mt-2"
                  />
                </div>
              )}

              <Button onClick={() => saveContentMutation.mutate()} disabled={saveContentMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Content
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
