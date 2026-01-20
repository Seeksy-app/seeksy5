import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
}

interface Props {
  meetings?: Meeting[];
}

export function UpcomingMeetingsWidget({ meetings = [] }: Props) {
  const navigate = useNavigate();

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Calendar className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground mb-3">
          No meetings yet — Add your first meeting.
        </p>
        <Button size="sm" variant="outline" onClick={() => navigate("/meetings/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meetings.slice(0, 3).map((meeting) => (
        <div
          key={meeting.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
          onClick={() => navigate(`/meetings/${meeting.id}`)}
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{meeting.title}</p>
            <p className="text-xs text-muted-foreground">{meeting.date} at {meeting.time}</p>
          </div>
        </div>
      ))}
      <Button 
        variant="ghost" 
        size="sm" 
        className="w-full text-xs"
        onClick={() => navigate("/meetings")}
      >
        View All Meetings
      </Button>
    </div>
  );
}
