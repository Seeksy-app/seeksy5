import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  CalendarPlus, 
  UserPlus, 
  FileText, 
  Megaphone, 
  Mail,
  CalendarCheck,
  Users,
  DollarSign,
  Clock,
  Bot,
  Sparkles
} from "lucide-react";
import { NewInquiryModal } from "@/components/venues/modals/NewInquiryModal";
import { ScheduleTourModal } from "@/components/venues/modals/ScheduleTourModal";
import { CreateProposalModal } from "@/components/venues/modals/CreateProposalModal";
import { SendMessageModal } from "@/components/venues/modals/SendMessageModal";
import { MiaBookingDrawer } from "@/components/venues/MiaBookingDrawer";

const stats = [
  { label: "Upcoming Events", value: "12", icon: CalendarCheck, change: "+3 this week" },
  { label: "Active Clients", value: "48", icon: Users, change: "+5 this month" },
  { label: "Revenue (MTD)", value: "$42,500", icon: DollarSign, change: "+12% vs last month" },
  { label: "Pending Inquiries", value: "7", icon: Clock, change: "Respond within 24h" },
];

const upcomingEvents = [
  { name: "Smith Wedding", date: "Dec 15, 2025", space: "Grand Ballroom", guests: 150 },
  { name: "TechCorp Annual Meeting", date: "Dec 18, 2025", space: "Conference Hall A", guests: 75 },
  { name: "Johnson Anniversary", date: "Dec 20, 2025", space: "Garden Terrace", guests: 50 },
  { name: "New Year Gala", date: "Dec 31, 2025", space: "Grand Ballroom", guests: 300 },
];

const recentLeads = [
  { name: "Emily Parker", event: "Wedding", date: "Dec 10, 2025", status: "New" },
  { name: "Acme Corp", event: "Corporate Event", date: "Dec 9, 2025", status: "Contacted" },
  { name: "David Chen", event: "Birthday Party", date: "Dec 8, 2025", status: "Tour Scheduled" },
];

export default function VenueDashboard() {
  const navigate = useNavigate();
  const [isDemoMode, setIsDemoMode] = useState(() => {
    return localStorage.getItem("venueos_mode") !== "live";
  });
  
  // Modal states
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [miaOpen, setMiaOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("venueos_mode", isDemoMode ? "demo" : "live");
  }, [isDemoMode]);

  const quickActions = [
    { label: "Add inquiry", icon: UserPlus, color: "#2C6BED", onClick: () => setInquiryOpen(true) },
    { label: "Schedule tour", icon: CalendarPlus, color: "#10B981", onClick: () => setTourOpen(true) },
    { label: "Create proposal", icon: FileText, color: "#8B5CF6", onClick: () => setProposalOpen(true) },
    { label: "Plan campaign", icon: Megaphone, color: "#F59E0B", onClick: () => navigate("/venueOS/influencers") },
    { label: "Send email", icon: Mail, color: "#EF4444", onClick: () => setMessageOpen(true) },
  ];

  return (
    <>
      <div className="space-y-4">
        {/* Header with Mode Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
            <p className="text-gray-600">Here's what's happening at your venue today.</p>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow-sm border">
            <span className={`text-sm font-medium ${isDemoMode ? "text-gray-500" : "text-gray-900"}`}>LIVE</span>
            <Switch
              checked={isDemoMode}
              onCheckedChange={setIsDemoMode}
            />
            <span className={`text-sm font-medium ${isDemoMode ? "text-blue-600" : "text-gray-500"}`}>DEMO</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left Column: Quick Actions + Mia */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="h-auto py-2.5 px-3 flex flex-col items-center gap-1.5 hover:bg-gray-50"
                    onClick={action.onClick}
                  >
                    <action.icon className="h-4 w-4" style={{ color: action.color }} />
                    <span className="text-xs text-gray-700">{action.label}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Mia AI Card */}
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      Mia
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">AI Manager</span>
                    </h3>
                    <p className="text-sm text-white/80 mt-1">
                      Ask me to create bookings, draft messages, or suggest pricing.
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-3">
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => setMiaOpen(true)}
                >
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  Ask Mia to create a booking
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Events + Leads */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upcoming Events */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Upcoming Events</CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-600 h-8">
                  View All
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingEvents.map((event, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{event.name}</p>
                      <p className="text-xs text-gray-600">{event.space} • {event.guests} guests</p>
                    </div>
                    <p className="text-xs font-medium text-gray-700">{event.date}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Leads */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Recent Leads</CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-600 h-8">
                  View All
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentLeads.map((lead, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{lead.name}</p>
                      <p className="text-xs text-gray-600">{lead.event} • {lead.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        lead.status === 'New' ? 'bg-green-100 text-green-700' :
                        lead.status === 'Contacted' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {lead.status}
                      </span>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Follow Up
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NewInquiryModal 
        open={inquiryOpen} 
        onOpenChange={setInquiryOpen} 
        isDemoMode={isDemoMode}
      />
      <ScheduleTourModal 
        open={tourOpen} 
        onOpenChange={setTourOpen}
        isDemoMode={isDemoMode}
      />
      <CreateProposalModal 
        open={proposalOpen} 
        onOpenChange={setProposalOpen}
        isDemoMode={isDemoMode}
      />
      <SendMessageModal 
        open={messageOpen} 
        onOpenChange={setMessageOpen}
      />
      <MiaBookingDrawer 
        open={miaOpen} 
        onOpenChange={setMiaOpen}
      />
    </>
  );
}
