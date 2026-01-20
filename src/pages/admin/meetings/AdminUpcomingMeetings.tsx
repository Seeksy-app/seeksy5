import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, Video, Phone, Clock, Mail, MoreVertical, X, Check } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const upcomingMeetings = [
  { id: "1", title: "Demo Call", attendee: "John Smith", email: "john@acme.com", company: "Acme Corp", date: "Dec 5, 2024", time: "2:00 PM", duration: "30 min", type: "Demo", host: "Sarah (Sales)", status: "confirmed" },
  { id: "2", title: "Sales Discovery", attendee: "Sarah Johnson", email: "sarah@techstart.io", company: "TechStart Inc", date: "Dec 5, 2024", time: "4:30 PM", duration: "45 min", type: "Sales", host: "Mike (Sales)", status: "confirmed" },
  { id: "3", title: "Support Check-in", attendee: "Mike Chen", email: "mike@client.com", company: "Client Co", date: "Dec 6, 2024", time: "10:00 AM", duration: "30 min", type: "Support", host: "Support Team", status: "pending" },
  { id: "4", title: "Onboarding Session", attendee: "Lisa Williams", email: "lisa@newclient.com", company: "New Client LLC", date: "Dec 6, 2024", time: "2:00 PM", duration: "60 min", type: "Onboarding", host: "Success Team", status: "confirmed" },
  { id: "5", title: "Demo Call", attendee: "Robert Brown", email: "contact@global.com", company: "Global Solutions", date: "Dec 8, 2024", time: "11:00 AM", duration: "30 min", type: "Demo", host: "Sarah (Sales)", status: "confirmed" },
  { id: "6", title: "Consultation", attendee: "Emily Davis", email: "emily@enterprise.com", company: "Enterprise Inc", date: "Dec 9, 2024", time: "3:00 PM", duration: "45 min", type: "Consultation", host: "Founder", status: "pending" },
  { id: "7", title: "Demo Call", attendee: "David Wilson", email: "david@startup.co", company: "Startup Co", date: "Dec 10, 2024", time: "9:00 AM", duration: "30 min", type: "Demo", host: "Mike (Sales)", status: "confirmed" },
  { id: "8", title: "Support Session", attendee: "Jennifer Lee", email: "jen@techcorp.com", company: "TechCorp", date: "Dec 10, 2024", time: "1:00 PM", duration: "30 min", type: "Support", host: "Support Team", status: "confirmed" },
];

export default function AdminUpcomingMeetings() {
  return (
    <div className="px-10 pt-8 pb-16 flex flex-col items-start w-full space-y-8">
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upcoming Meetings</h1>
          <p className="text-muted-foreground mt-1">View and manage all scheduled team meetings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 w-full">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search meetings..." className="pl-10" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="demo">Demo</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="support">Support</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-40"><SelectValue placeholder="Host" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Hosts</SelectItem>
            <SelectItem value="sales">Sales Team</SelectItem>
            <SelectItem value="support">Support Team</SelectItem>
            <SelectItem value="success">Success Team</SelectItem>
            <SelectItem value="founder">Founder</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Meetings List */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Scheduled Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <div key={meeting.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Video className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{meeting.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${meeting.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {meeting.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{meeting.attendee} • {meeting.company}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />{meeting.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />{meeting.date}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />{meeting.time} ({meeting.duration})
                    </p>
                    <p className="text-xs text-muted-foreground">Host: {meeting.host}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Check className="h-4 w-4 mr-2" />Confirm</DropdownMenuItem>
                      <DropdownMenuItem><Calendar className="h-4 w-4 mr-2" />Reschedule</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive"><X className="h-4 w-4 mr-2" />Cancel</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
