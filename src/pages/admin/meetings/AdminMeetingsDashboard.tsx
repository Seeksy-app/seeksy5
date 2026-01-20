import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, Link, Plus, Video, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const stats = [
  { label: "Upcoming Meetings", value: "12", icon: Calendar, change: "+3 this week" },
  { label: "Total Bookings", value: "156", icon: Users, change: "+24 this month" },
  { label: "Meeting Types", value: "5", icon: Video, change: "Active" },
  { label: "Avg Duration", value: "32m", icon: Clock, change: "Last 30 days" },
];

const upcomingMeetings = [
  { id: "1", title: "Demo Call - Acme Corp", time: "Today, 2:00 PM", type: "Demo", attendee: "john@acme.com" },
  { id: "2", title: "Sales Discovery - TechStart", time: "Today, 4:30 PM", type: "Sales", attendee: "sarah@techstart.io" },
  { id: "3", title: "Support Check-in", time: "Tomorrow, 10:00 AM", type: "Support", attendee: "mike@client.com" },
  { id: "4", title: "Onboarding Session", time: "Tomorrow, 2:00 PM", type: "Onboarding", attendee: "lisa@newclient.com" },
  { id: "5", title: "Demo Call - Global Solutions", time: "Dec 8, 11:00 AM", type: "Demo", attendee: "contact@global.com" },
];

const meetingTypes = [
  { id: "demo", name: "Demo Call", duration: "30 min", bookings: 45, slug: "/demo" },
  { id: "sales", name: "Sales Discovery", duration: "45 min", bookings: 32, slug: "/sales" },
  { id: "support", name: "Support Session", duration: "30 min", bookings: 28, slug: "/support" },
  { id: "onboarding", name: "Onboarding", duration: "60 min", bookings: 18, slug: "/onboarding" },
  { id: "consultation", name: "Consultation", duration: "45 min", bookings: 12, slug: "/consultation" },
];

export default function AdminMeetingsDashboard() {
  const navigate = useNavigate();

  return (
    <div className="px-10 pt-8 pb-16 flex flex-col items-start w-full space-y-8">
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meetings</h1>
          <p className="text-muted-foreground mt-1">Manage team meetings, booking links, and availability</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/admin/meetings/types")}>
            <Plus className="h-4 w-4 mr-2" />
            New Meeting Type
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/meetings/links")}>
            <Link className="h-4 w-4 mr-2" />
            Booking Links
          </Button>
          <Button onClick={() => navigate("/meetings/now")}>
            <Video className="h-4 w-4 mr-2" />
            Start Meeting
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Upcoming Meetings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Meetings</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/meetings/upcoming")}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingMeetings.map((meeting) => (
                <div 
                  key={meeting.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate(`/studio/meeting/${meeting.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {meeting.type === "Demo" ? <Video className="h-5 w-5 text-primary" /> : <Phone className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{meeting.title}</p>
                      <p className="text-sm text-muted-foreground">{meeting.attendee}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{meeting.time}</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{meeting.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Meeting Types */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Meeting Types</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/meetings/types")}>
              Manage
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {meetingTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div>
                    <p className="font-medium text-foreground">{type.name}</p>
                    <p className="text-sm text-muted-foreground">{type.duration} • {type.slug}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{type.bookings} bookings</p>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <Link className="h-3 w-3 mr-1" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
