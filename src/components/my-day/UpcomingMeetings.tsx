import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function UpcomingMeetings() {
  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[hsl(199,90%,95%)]">
            <CalendarCheck className="h-5 w-5 text-[hsl(199,80%,45%)]" />
          </div>
          Upcoming Meetings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Empty state with colored icon - Teal */}
          <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-[hsl(199,90%,97%)]">
            <div className="p-3 rounded-full bg-[hsl(199,90%,92%)]">
              <Calendar className="h-8 w-8 text-[hsl(199,80%,50%)] opacity-60" />
            </div>
            <p className="text-sm text-muted-foreground">No meetings scheduled for today</p>
          </div>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/meetings">View All Meetings</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}