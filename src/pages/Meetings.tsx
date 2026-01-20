import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar, Clock, Plus, Video, Trash2, Edit, Copy } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Meetings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);

  const { data: meetings, isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user is admin and in personal view mode
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      const isAdmin = roles?.role === "admin" || roles?.role === "super_admin";

      // Build query with attendees
      let query = supabase
        .from("meetings")
        .select(`
          *,
          meeting_attendees (
            id,
            attendee_name,
            attendee_email,
            attendee_phone,
            rsvp_status,
            rsvp_timestamp
          )
        `)
        .eq("user_id", user.id);

      const { data, error } = await query.order("start_time", { ascending: true });

      if (error) throw error;
      
      // Generate meeting ID and flatten attendees
      return (data || []).map(meeting => ({
        ...meeting,
        meeting_id: meeting.id.substring(0, 12).replace(/-/g, '').toUpperCase(),
        attendees: meeting.meeting_attendees || []
      }));
    },
  });

  const now = new Date();
  const upcomingMeetings = meetings?.filter(m => new Date(m.start_time) >= now && m.status !== "cancelled") || [];
  const previousMeetings = meetings?.filter(m => new Date(m.start_time) < now || m.status === "cancelled") || [];

  // Delete meeting mutation
  const deleteMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      const { error } = await supabase
        .from("meetings")
        .delete()
        .eq("id", meetingId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedMeeting(null);
    },
    onError: (error: any) => {
      toast.error("Failed to delete meeting: " + error.message);
    },
  });

  const handleStartMeeting = async (meeting: any) => {
    // Navigate to Daily.co-powered Meeting Studio
    navigate(`/studio/meeting/${meeting.id}`);
  };

  const handleDeleteMeeting = (meeting: any) => {
    setSelectedMeeting(meeting);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedMeeting) {
      deleteMutation.mutate(selectedMeeting.id);
    }
  };

  const copyMeetingLink = (meeting: any) => {
    const meetingUrl = `${window.location.origin}/meeting/${meeting.id}`;
    navigator.clipboard.writeText(meetingUrl);
    toast.success("Meeting link copied to clipboard!");
  };

  const MeetingsTable = ({ meetingsList, showStartButton = true }: { meetingsList: any[]; showStartButton?: boolean }) => {
    if (meetingsList.length === 0) {
      return (
        <Card className="p-12 text-center">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No meetings found</h3>
          <p className="text-muted-foreground mb-4">
            {showStartButton ? "Schedule your first meeting to get started" : "Your completed meetings will appear here"}
          </p>
          {showStartButton && (
            <Button onClick={() => navigate("/meetings/create")}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Button>
          )}
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Start Time</TableHead>
                <TableHead className="font-semibold">Title</TableHead>
                <TableHead className="font-semibold">Attendees</TableHead>
                <TableHead className="font-semibold">Meeting ID</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetingsList.map((meeting) => {
                const isRecurring = meeting.is_recurring;
                const isPast = new Date(meeting.start_time) < now;
                const isCancelled = meeting.status === "cancelled";
                
                return (
                  <TableRow key={meeting.id} className={isCancelled ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {format(new Date(meeting.start_time), "EEE, MMM d")}
                          {isRecurring && " (Recurring)"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(meeting.start_time), "h:mm a")}
                          {" "}
                          {new Date(meeting.start_time).toLocaleTimeString('en-US', { 
                            timeZoneName: 'short' 
                          }).split(' ').pop()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span 
                          className="font-medium text-primary hover:underline cursor-pointer"
                          onClick={() => navigate(`/meetings/${meeting.id}`)}
                        >
                          {meeting.title}
                        </span>
                        {meeting.description && (
                          <span className="text-sm text-muted-foreground line-clamp-1">
                            {meeting.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {meeting.attendees?.map((attendee: any, idx: number) => (
                          <div key={attendee.id} className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <span className="font-medium">{attendee.attendee_name}</span>
                              <span className="text-sm text-muted-foreground">{attendee.attendee_email}</span>
                            </div>
                            {attendee.rsvp_status === 'attending' && (
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs">
                                ✅ Attending
                              </Badge>
                            )}
                            {attendee.rsvp_status === 'not_attending' && (
                              <Badge variant="destructive" className="text-xs">
                                ❌ Not Attending
                              </Badge>
                            )}
                            {attendee.rsvp_status === 'maybe' && (
                              <Badge variant="secondary" className="text-xs">
                                ❓ Maybe
                              </Badge>
                            )}
                            {attendee.rsvp_status === 'awaiting' && (
                              <Badge variant="outline" className="text-xs">
                                ⏳ Awaiting
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{meeting.meeting_id}</code>
                    </TableCell>
                    <TableCell>
                      {isCancelled ? (
                        <Badge variant="destructive">Cancelled</Badge>
                      ) : isPast ? (
                        <Badge variant="secondary">Completed</Badge>
                      ) : (
                        <Badge variant="default">Scheduled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isPast && !isCancelled && showStartButton && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleStartMeeting(meeting)}
                            className="gap-2"
                          >
                            <Video className="w-4 w-4" />
                            Start
                          </Button>
                        )}
                        {isPast && meeting.recording_url && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => window.open(meeting.recording_url, '_blank')}
                            className="gap-2"
                          >
                            <Video className="w-4 h-4" />
                            Download
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyMeetingLink(meeting)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/meetings/edit/${meeting.id}`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteMeeting(meeting)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Calendar className="w-10 h-10 text-primary" />
              Meetings
            </h1>
            <p className="text-muted-foreground mt-2">
              View and manage all your scheduled meetings
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/meetings/now")} variant="secondary" className="gap-2">
              <Video className="w-4 h-4" />
              Meet Now
            </Button>
            <Button onClick={() => navigate("/meetings/create")} className="gap-2">
              <Plus className="w-4 h-4" />
              Schedule New Meeting
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="bg-muted/50 mb-6">
            <TabsTrigger value="upcoming" className="gap-2">
              <Clock className="w-4 h-4" />
              Upcoming Meetings
            </TabsTrigger>
            <TabsTrigger value="previous" className="gap-2">
              <Calendar className="w-4 h-4" />
              Previous Meetings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {isLoading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Loading meetings...</p>
              </Card>
            ) : (
              <MeetingsTable meetingsList={upcomingMeetings} showStartButton={true} />
            )}
          </TabsContent>

          <TabsContent value="previous" className="mt-6">
            {isLoading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Loading meetings...</p>
              </Card>
            ) : (
              <MeetingsTable meetingsList={previousMeetings} showStartButton={false} />
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedMeeting?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Meetings;
