import { VenueLayout } from "@/components/venues/VenueLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, LayoutGrid, List } from "lucide-react";
import { useState } from "react";

const bookings = [
  { 
    id: 1, 
    client: "Smith Family", 
    event: "Wedding Reception", 
    date: "Dec 15, 2025", 
    space: "Grand Ballroom",
    guests: 150,
    value: "$12,500",
    stage: "booked",
    status: "confirmed"
  },
  { 
    id: 2, 
    client: "TechCorp Inc", 
    event: "Annual Conference", 
    date: "Dec 18, 2025", 
    space: "Conference Hall A",
    guests: 75,
    value: "$8,000",
    stage: "contract",
    status: "pending_signature"
  },
  { 
    id: 3, 
    client: "Johnson Party", 
    event: "Anniversary Celebration", 
    date: "Dec 20, 2025", 
    space: "Garden Terrace",
    guests: 50,
    value: "$4,500",
    stage: "proposal",
    status: "sent"
  },
  { 
    id: 4, 
    client: "New Year Committee", 
    event: "Gala Dinner", 
    date: "Dec 31, 2025", 
    space: "Grand Ballroom",
    guests: 300,
    value: "$25,000",
    stage: "booked",
    status: "confirmed"
  },
  { 
    id: 5, 
    client: "Emily Parker", 
    event: "Wedding", 
    date: "Jan 15, 2026", 
    space: "Chapel + Reception",
    guests: 120,
    value: "$15,000",
    stage: "tour",
    status: "scheduled"
  },
  { 
    id: 6, 
    client: "Acme Corporation", 
    event: "Product Launch", 
    date: "Jan 20, 2026", 
    space: "Main Hall",
    guests: 200,
    value: "$18,000",
    stage: "lead",
    status: "new"
  },
];

const stageColors: Record<string, string> = {
  lead: "bg-gray-100 text-gray-700",
  tour: "bg-blue-100 text-blue-700",
  proposal: "bg-purple-100 text-purple-700",
  contract: "bg-orange-100 text-orange-700",
  booked: "bg-green-100 text-green-700",
};

const stageLabels: Record<string, string> = {
  lead: "Lead",
  tour: "Tour",
  proposal: "Proposal",
  contract: "Contract",
  booked: "Booked",
};

export default function VenueBookingsPage() {
  const [view, setView] = useState<"table" | "kanban">("table");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBookings = bookings.filter(booking => 
    booking.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.event.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stages = ["lead", "tour", "proposal", "contract", "booked"];

  return (
    <VenueLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
            <p className="text-gray-600">Manage your venue bookings and pipeline</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
                <div className="flex border rounded-lg">
                  <Button 
                    variant={view === "table" ? "secondary" : "ghost"} 
                    size="icon"
                    onClick={() => setView("table")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={view === "kanban" ? "secondary" : "ghost"} 
                    size="icon"
                    onClick={() => setView("kanban")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table View */}
        {view === "table" && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-gray-600">Client</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-600">Event</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-600">Date</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-600">Space</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-600">Guests</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-600">Value</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-600">Stage</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <span className="font-medium text-gray-900">{booking.client}</span>
                        </td>
                        <td className="p-4 text-gray-600">{booking.event}</td>
                        <td className="p-4 text-gray-600">{booking.date}</td>
                        <td className="p-4 text-gray-600">{booking.space}</td>
                        <td className="p-4 text-gray-600">{booking.guests}</td>
                        <td className="p-4 font-medium text-gray-900">{booking.value}</td>
                        <td className="p-4">
                          <Badge className={stageColors[booking.stage]}>
                            {stageLabels[booking.stage]}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">View</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kanban View */}
        {view === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stages.map((stage) => (
              <div key={stage} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 capitalize">{stageLabels[stage]}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {filteredBookings.filter(b => b.stage === stage).length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {filteredBookings
                    .filter(booking => booking.stage === stage)
                    .map((booking) => (
                      <Card key={booking.id} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <h4 className="font-medium text-gray-900 mb-1">{booking.client}</h4>
                          <p className="text-sm text-gray-600 mb-2">{booking.event}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">{booking.date}</span>
                            <span className="font-medium text-gray-900">{booking.value}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </VenueLayout>
  );
}
