import { Calendar, Users, CalendarDays, Vote } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const QuickActionsWidget = () => {
  const navigate = useNavigate();
  
  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-border/50">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Create new content quickly</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Button
            variant="outline"
            className="h-auto py-4 flex-col items-start"
            onClick={() => navigate("/create-event")}
          >
            <Calendar className="h-5 w-5 mb-2" />
            <span className="font-semibold">Create Event</span>
            <span className="text-xs text-muted-foreground">New event registration</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-auto py-4 flex-col items-start"
            onClick={() => navigate("/meeting-types/create")}
          >
            <Users className="h-5 w-5 mb-2" />
            <span className="font-semibold">Create Meeting Type</span>
            <span className="text-xs text-muted-foreground">New booking option</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-auto py-4 flex-col items-start"
            onClick={() => navigate("/create-signup-sheet")}
          >
            <CalendarDays className="h-5 w-5 mb-2" />
            <span className="font-semibold">Create Sign-Up Sheet</span>
            <span className="text-xs text-muted-foreground">New time slots</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-auto py-4 flex-col items-start"
            onClick={() => navigate("/create-poll")}
          >
            <Vote className="h-5 w-5 mb-2" />
            <span className="font-semibold">Create Poll</span>
            <span className="text-xs text-muted-foreground">New voting option</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
