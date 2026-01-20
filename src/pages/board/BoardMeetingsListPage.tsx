import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Video, Search, Clock, Trash2 } from "lucide-react";
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

export default function BoardMeetingsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["board-meetings", tab],
    queryFn: async () => {
      const now = new Date().toISOString();
      const query = supabase
        .from("board_meetings")
        .select("*")
        .order("starts_at", { ascending: tab === "upcoming" });

      if (tab === "upcoming") {
        query.gte("starts_at", now);
      } else {
        query.lt("starts_at", now);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BoardMeeting[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      const { error } = await supabase
        .from("board_meetings")
        .delete()
        .eq("id", meetingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-meetings"] });
      toast.success("Meeting deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete meeting");
      console.error(error);
    },
  });

  const handleDelete = (e: React.MouseEvent, meetingId: string) => {
    e.stopPropagation(); // Prevent card click navigation
    if (confirm("Delete this meeting?")) {
      deleteMutation.mutate(meetingId);
    }
  };

  const filteredMeetings = meetings.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Board Meetings</h1>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "upcoming" | "past")}>
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredMeetings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No {tab} meetings found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMeetings.map((meeting) => (
                <Card
                  key={meeting.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/board/meetings/${meeting.id}`)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{meeting.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(meeting.starts_at), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(meeting.starts_at), "h:mm a")}
                          </span>
                          {meeting.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {meeting.location}
                            </span>
                          )}
                          {meeting.virtual_link && (
                            <span className="flex items-center gap-1">
                              <Video className="h-4 w-4" />
                              Virtual
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[meeting.status] || "bg-muted"}>
                          {meeting.status.replace("_", " ")}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDelete(e, meeting.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
