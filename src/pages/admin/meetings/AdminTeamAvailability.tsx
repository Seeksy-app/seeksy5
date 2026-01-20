import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Users, Calendar, Settings } from "lucide-react";

const teamMembers = [
  { id: "1", name: "Sarah Johnson", role: "Sales Lead", avatar: "SJ", meetingTypes: ["Demo", "Sales"], available: true },
  { id: "2", name: "Mike Chen", role: "Sales Rep", avatar: "MC", meetingTypes: ["Demo", "Sales"], available: true },
  { id: "3", name: "Support Team", role: "Support", avatar: "ST", meetingTypes: ["Support"], available: true },
  { id: "4", name: "Success Team", role: "Customer Success", avatar: "CS", meetingTypes: ["Onboarding"], available: true },
  { id: "5", name: "Founder", role: "Executive", avatar: "FO", meetingTypes: ["Consultation"], available: false },
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const defaultHours = { start: "9:00 AM", end: "5:00 PM" };

export default function AdminTeamAvailability() {
  const [selectedMember, setSelectedMember] = useState(teamMembers[0]);

  return (
    <div className="px-10 pt-8 pb-16 flex flex-col items-start w-full space-y-8">
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Availability</h1>
          <p className="text-muted-foreground mt-1">Manage team schedules and override availability</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedMember.id === member.id ? "bg-primary/10 border border-primary/20" : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {member.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <span className={`h-2 w-2 rounded-full ${member.available ? "bg-green-500" : "bg-gray-300"}`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Availability Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {selectedMember.name}'s Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-foreground">Accept Bookings</p>
                <p className="text-sm text-muted-foreground">Toggle to enable or disable all bookings</p>
              </div>
              <Switch defaultChecked={selectedMember.available} />
            </div>

            <div>
              <p className="font-medium text-foreground mb-3">Assigned Meeting Types</p>
              <div className="flex flex-wrap gap-2">
                {selectedMember.meetingTypes.map((type) => (
                  <span key={type} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                    {type}
                  </span>
                ))}
                <Button variant="outline" size="sm" className="h-7">
                  + Add
                </Button>
              </div>
            </div>

            <div>
              <p className="font-medium text-foreground mb-3">Weekly Schedule</p>
              <div className="space-y-3">
                {weekDays.map((day) => (
                  <div key={day} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <Switch defaultChecked />
                    <span className="w-12 font-medium text-foreground">{day}</span>
                    <div className="flex items-center gap-2 flex-1">
                      <Select defaultValue={defaultHours.start}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM"].map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground">to</span>
                      <Select defaultValue={defaultHours.end}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"].map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1">
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
              </Button>
              <Button className="flex-1">
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
