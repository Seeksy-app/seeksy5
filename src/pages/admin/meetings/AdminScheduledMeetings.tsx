import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, Search, Filter, Video, Phone, MapPin, Mail, User, MoreVertical, X, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const demoMeetings = [
  { id: "1", title: "Seeksy Demo Call", attendee: "John Smith", email: "john@acme.com", company: "Acme Corp", date: "2024-12-06", time: "2:00 PM", duration: 30, type: "Demo", host: "Sarah (Sales)", status: "confirmed", location: "video" },
  { id: "2", title: "Sales Discovery", attendee: "Emily Chen", email: "emily@techstart.io", company: "TechStart", date: "2024-12-06", time: "4:30 PM", duration: 45, type: "Sales", host: "Michael (Sales)", status: "confirmed", location: "video" },
  { id: "3", title: "Support Check-in", attendee: "Mike Johnson", email: "mike@client.com", company: "Client Inc", date: "2024-12-07", time: "10:00 AM", duration: 30, type: "Support", host: "Alex (Support)", status: "pending", location: "phone" },
  { id: "4", title: "Onboarding Session", attendee: "Lisa Wang", email: "lisa@newclient.com", company: "NewClient LLC", date: "2024-12-07", time: "2:00 PM", duration: 60, type: "Onboarding", host: "Sarah (Success)", status: "confirmed", location: "video" },
  { id: "5", title: "Seeksy Demo Call", attendee: "Robert Brown", email: "robert@global.com", company: "Global Solutions", date: "2024-12-08", time: "11:00 AM", duration: 30, type: "Demo", host: "Sarah (Sales)", status: "confirmed", location: "video" },
  { id: "6", title: "Consultation", attendee: "Jennifer Lee", email: "jennifer@enterprise.co", company: "Enterprise Co", date: "2024-12-09", time: "3:00 PM", duration: 45, type: "Consultation", host: "David (Founder)", status: "pending", location: "video" },
  { id: "7", title: "Support Session", attendee: "Chris Martin", email: "chris@startup.io", company: "Startup IO", date: "2024-12-10", time: "9:00 AM", duration: 30, type: "Support", host: "Alex (Support)", status: "cancelled", location: "video" },
  { id: "8", title: "Demo Call", attendee: "Amanda Taylor", email: "amanda@bigco.com", company: "BigCo", date: "2024-12-05", time: "1:00 PM", duration: 30, type: "Demo", host: "Sarah (Sales)", status: "completed", location: "video" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed": return "bg-green-100 text-green-700 border-green-200";
    case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "cancelled": return "bg-red-100 text-red-700 border-red-200";
    case "completed": return "bg-blue-100 text-blue-700 border-blue-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export default function AdminScheduledMeetings() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterHost, setFilterHost] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedMeeting, setSelectedMeeting] = useState<typeof demoMeetings[0] | null>(null);

  const filteredMeetings = demoMeetings.filter((meeting) => {
    const matchesSearch = meeting.attendee.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          meeting.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          meeting.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHost = filterHost === "all" || meeting.host.includes(filterHost);
    const matchesType = filterType === "all" || meeting.type === filterType;
    const matchesStatus = filterStatus === "all" || meeting.status === filterStatus;
    return matchesSearch && matchesHost && matchesType && matchesStatus;
  });

  const upcomingMeetings = filteredMeetings.filter(m => m.status !== "completed" && m.status !== "cancelled");
  const pastMeetings = filteredMeetings.filter(m => m.status === "completed" || m.status === "cancelled");

  const handleCancel = (id: string) => {
    toast({ title: "Meeting cancelled", description: "The attendee will be notified via email." });
  };

  const handleReschedule = (id: string) => {
    toast({ title: "Reschedule link sent", description: "The attendee can select a new time." });
  };

  return (
    <div className="px-10 pt-8 pb-16 flex flex-col items-start w-full space-y-8">
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Scheduled Meetings</h1>
          <p className="text-muted-foreground mt-1">View and manage all scheduled meetings</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterHost} onValueChange={setFilterHost}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Hosts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hosts</SelectItem>
                <SelectItem value="Sarah">Sarah (Sales)</SelectItem>
                <SelectItem value="Michael">Michael (Sales)</SelectItem>
                <SelectItem value="Alex">Alex (Support)</SelectItem>
                <SelectItem value="David">David (Founder)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Demo">Demo</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Support">Support</SelectItem>
                <SelectItem value="Onboarding">Onboarding</SelectItem>
                <SelectItem value="Consultation">Consultation</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcomingMeetings.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastMeetings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          <div className="space-y-4">
            {upcomingMeetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        {meeting.location === "video" ? <Video className="h-6 w-6 text-primary" /> : <Phone className="h-6 w-6 text-primary" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{meeting.title}</p>
                          <Badge variant="outline" className={getStatusColor(meeting.status)}>
                            {meeting.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="h-3 w-3" />{meeting.attendee}</span>
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{meeting.email}</span>
                          <span>{meeting.company}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-foreground flex items-center gap-1">
                          <Calendar className="h-4 w-4" />{meeting.date}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />{meeting.time} ({meeting.duration} min)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Host: {meeting.host}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedMeeting(meeting)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReschedule(meeting.id)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Send Reschedule Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCancel(meeting.id)} className="text-destructive">
                            <X className="h-4 w-4 mr-2" />
                            Cancel Meeting
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {upcomingMeetings.length === 0 && (
              <Card><CardContent className="pt-6 text-center text-muted-foreground">No upcoming meetings found.</CardContent></Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <div className="space-y-4">
            {pastMeetings.map((meeting) => (
              <Card key={meeting.id} className="opacity-75">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        {meeting.location === "video" ? <Video className="h-6 w-6 text-muted-foreground" /> : <Phone className="h-6 w-6 text-muted-foreground" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{meeting.title}</p>
                          <Badge variant="outline" className={getStatusColor(meeting.status)}>
                            {meeting.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{meeting.attendee} • {meeting.company}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{meeting.date} at {meeting.time}</p>
                      <p className="text-xs text-muted-foreground">Host: {meeting.host}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Meeting Detail Dialog */}
      <Dialog open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Meeting Details</DialogTitle>
          </DialogHeader>
          {selectedMeeting && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Meeting Type</p>
                  <p className="font-medium">{selectedMeeting.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline" className={getStatusColor(selectedMeeting.status)}>
                    {selectedMeeting.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attendee</p>
                  <p className="font-medium">{selectedMeeting.attendee}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedMeeting.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{selectedMeeting.company}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Host</p>
                  <p className="font-medium">{selectedMeeting.host}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">{selectedMeeting.date} at {selectedMeeting.time}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{selectedMeeting.duration} minutes</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => handleReschedule(selectedMeeting.id)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reschedule
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => handleCancel(selectedMeeting.id)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
