import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, Clock, Video, MapPin, Users, FileText, 
  MessageSquare, Paperclip, ArrowLeft, Save, Upload,
  Trash2, Send
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function MeetingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [agenda, setAgenda] = useState("");
  const [notes, setNotes] = useState("");
  const [chatMessage, setChatMessage] = useState("");

  // Fetch meeting details
  const { data: meeting, isLoading } = useQuery({
    queryKey: ["meeting-details", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select(`
          *,
          meeting_attendees (*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch meeting files
  const { data: files = [] } = useQuery({
    queryKey: ["meeting-files", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_files")
        .select("*")
        .eq("meeting_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch chat messages
  const { data: chatMessages = [] } = useQuery({
    queryKey: ["meeting-chat", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_chat")
        .select("*")
        .eq("meeting_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Set initial values
  useEffect(() => {
    if (meeting) {
      setAgenda(meeting.agenda || "");
      setNotes(meeting.notes || "");
    }
  }, [meeting]);

  // Subscribe to realtime chat
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`meeting-chat-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "meeting_chat",
          filter: `meeting_id=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["meeting-chat", id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  // Save meeting mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("meetings")
        .update({ agenda, notes })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Meeting saved");
      queryClient.invalidateQueries({ queryKey: ["meeting-details", id] });
    },
    onError: (error: any) => {
      toast.error("Failed to save: " + error.message);
    },
  });

  // Send chat message
  const sendChatMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user?.id)
        .single();

      const { error } = await supabase
        .from("meeting_chat")
        .insert({
          meeting_id: id,
          sender_name: profile?.full_name || user?.email || "Host",
          sender_email: user?.email,
          message: chatMessage,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setChatMessage("");
    },
    onError: (error: any) => {
      toast.error("Failed to send: " + error.message);
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const { error } = await supabase
        .from("meeting_files")
        .delete()
        .eq("id", fileId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("File deleted");
      queryClient.invalidateQueries({ queryKey: ["meeting-files", id] });
    },
  });

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const filePath = `meetings/${id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("media-vault")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media-vault")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from("meeting_files")
        .insert({
          meeting_id: id,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user?.id,
        });

      if (dbError) throw dbError;

      toast.success("File uploaded");
      queryClient.invalidateQueries({ queryKey: ["meeting-files", id] });
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading meeting...</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Meeting not found</p>
      </div>
    );
  }

  const isPast = new Date(meeting.end_time) < new Date();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/meetings")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Meetings
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{meeting.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(meeting.start_time), "EEE, MMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(meeting.start_time), "h:mm a")} - {format(new Date(meeting.end_time), "h:mm a")}
                </span>
                <Badge variant={isPast ? "secondary" : "default"}>
                  {isPast ? "Completed" : "Upcoming"}
                </Badge>
              </div>
            </div>

            {!isPast && (
              <Button onClick={() => navigate(`/studio/meeting/${id}`)}>
                <Video className="h-4 w-4 mr-2" />
                Join Studio
              </Button>
            )}
          </div>
        </div>

        {/* Meeting Info */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <MapPin className="h-4 w-4" />
                Location
              </div>
              <p className="font-medium capitalize">{meeting.location_type}</p>
              {meeting.location_details && (
                <p className="text-sm text-muted-foreground truncate">{meeting.location_details}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users className="h-4 w-4" />
                Attendees
              </div>
              <p className="font-medium">{meeting.meeting_attendees?.length || 0} attendee(s)</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <FileText className="h-4 w-4" />
                Files
              </div>
              <p className="font-medium">{files.length} file(s)</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="agenda" className="space-y-4">
          <TabsList>
            <TabsTrigger value="agenda" className="gap-2">
              <FileText className="h-4 w-4" />
              Agenda & Notes
            </TabsTrigger>
            <TabsTrigger value="attendees" className="gap-2">
              <Users className="h-4 w-4" />
              Attendees
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <Paperclip className="h-4 w-4" />
              Files
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
          </TabsList>

          {/* Agenda & Notes */}
          <TabsContent value="agenda">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Agenda</label>
                  <Textarea
                    placeholder="Add meeting agenda..."
                    value={agenda}
                    onChange={(e) => setAgenda(e.target.value)}
                    rows={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <Textarea
                    placeholder="Add meeting notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={8}
                  />
                </div>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendees */}
          <TabsContent value="attendees">
            <Card>
              <CardContent className="p-6">
                {meeting.meeting_attendees?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No attendees</p>
                ) : (
                  <div className="space-y-3">
                    {meeting.meeting_attendees?.map((attendee: any) => (
                      <div
                        key={attendee.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{attendee.attendee_name}</p>
                          <p className="text-sm text-muted-foreground">{attendee.attendee_email}</p>
                          {attendee.attendee_phone && (
                            <p className="text-sm text-muted-foreground">{attendee.attendee_phone}</p>
                          )}
                        </div>
                        <Badge variant={
                          attendee.rsvp_status === "attending" ? "default" :
                          attendee.rsvp_status === "not_attending" ? "destructive" :
                          "secondary"
                        }>
                          {attendee.rsvp_status || "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files */}
          <TabsContent value="files">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Meeting Files</CardTitle>
                <label>
                  <Input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button variant="outline" asChild>
                    <span className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </span>
                  </Button>
                </label>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No files uploaded</p>
                ) : (
                  <div className="space-y-2">
                    {files.map((file: any) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:underline"
                            >
                              {file.file_name}
                            </a>
                            <p className="text-xs text-muted-foreground">
                              {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : ""}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFileMutation.mutate(file.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat */}
          <TabsContent value="chat">
            <Card className="flex flex-col h-[500px]">
              <CardHeader>
                <CardTitle>Meeting Chat</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 pr-4">
                  {chatMessages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No messages yet</p>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map((msg: any) => (
                        <div key={msg.id} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{msg.sender_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.created_at), "h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Input
                    placeholder="Type a message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && chatMessage.trim()) {
                        sendChatMutation.mutate();
                      }
                    }}
                  />
                  <Button
                    onClick={() => sendChatMutation.mutate()}
                    disabled={!chatMessage.trim() || sendChatMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
