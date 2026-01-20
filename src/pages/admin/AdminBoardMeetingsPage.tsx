import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface BoardMeeting {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  status: string;
  location: string | null;
  virtual_link: string | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  canceled: "bg-red-100 text-red-800",
};

export default function AdminBoardMeetingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    starts_at: "",
    ends_at: "",
    location: "",
    virtual_link: "",
    status: "scheduled",
  });

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["admin-board-meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("board_meetings")
        .select("*")
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return data as BoardMeeting[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { data: meeting, error: meetingError } = await supabase
        .from("board_meetings")
        .insert({
          tenant_id: 'a0000000-0000-0000-0000-000000000001', // Platform tenant
          title: form.title,
          starts_at: new Date(form.starts_at).toISOString(),
          ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
          location: form.location || null,
          virtual_link: form.virtual_link || null,
          status: form.status,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (meetingError) throw meetingError;

      // Create empty content record
      const { error: contentError } = await supabase
        .from("board_meeting_content")
        .insert({ meeting_id: meeting.id });
      
      if (contentError) throw contentError;

      return meeting;
    },
    onSuccess: () => {
      toast.success("Meeting created");
      setIsOpen(false);
      setForm({
        title: "",
        starts_at: "",
        ends_at: "",
        location: "",
        virtual_link: "",
        status: "scheduled",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-board-meetings"] });
    },
    onError: (error) => {
      toast.error("Failed to create meeting");
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("board_meetings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Meeting deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-board-meetings"] });
    },
    onError: () => {
      toast.error("Failed to delete meeting");
    },
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Board Meetings</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Meeting
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Board Meeting</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Q1 Board Meeting"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date/Time *</Label>
                  <Input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date/Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Conference Room A"
                />
              </div>
              <div>
                <Label>Virtual Link</Label>
                <Input
                  value={form.virtual_link}
                  onChange={(e) => setForm({ ...form, virtual_link: e.target.value })}
                  placeholder="https://zoom.us/..."
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
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
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!form.title || !form.starts_at || createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? "Creating..." : "Create Meeting"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : meetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No meetings yet. Create your first board meeting.
                  </TableCell>
                </TableRow>
              ) : (
                meetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell className="font-medium">{meeting.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(meeting.starts_at), "MMM d, yyyy h:mm a")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[meeting.status] || "bg-muted"}>
                        {meeting.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{meeting.location || meeting.virtual_link ? "Virtual" : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/board/meetings/${meeting.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Delete this meeting?")) {
                              deleteMutation.mutate(meeting.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
