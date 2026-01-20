import { VenueLayout } from "@/components/venues/VenueLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Mail, Phone, MoreHorizontal } from "lucide-react";
import { useState } from "react";

const clients = [
  { 
    id: 1, 
    firstName: "Sarah", 
    lastName: "Smith",
    email: "sarah@email.com",
    phone: "(555) 123-4567",
    organization: "",
    type: "Individual",
    events: 2,
    totalValue: "$27,500"
  },
  { 
    id: 2, 
    firstName: "John",
    lastName: "Williams",
    email: "jwilliams@techcorp.com",
    phone: "(555) 234-5678",
    organization: "TechCorp Inc",
    type: "Corporate",
    events: 5,
    totalValue: "$85,000"
  },
  { 
    id: 3, 
    firstName: "Emily",
    lastName: "Parker",
    email: "emily.parker@gmail.com",
    phone: "(555) 345-6789",
    organization: "",
    type: "Individual",
    events: 1,
    totalValue: "$15,000"
  },
  { 
    id: 4, 
    firstName: "Michael",
    lastName: "Johnson",
    email: "mjohnson@acme.com",
    phone: "(555) 456-7890",
    organization: "Acme Corporation",
    type: "Corporate",
    events: 3,
    totalValue: "$42,000"
  },
  { 
    id: 5, 
    firstName: "Lisa",
    lastName: "Chen",
    email: "lisa.chen@email.com",
    phone: "(555) 567-8901",
    organization: "",
    type: "Individual",
    events: 1,
    totalValue: "$8,500"
  },
];

export default function VenueClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "individual" | "corporate">("all");

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.organization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || client.type.toLowerCase() === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <VenueLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-600">Manage your venue clients and contacts</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={typeFilter === "all" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={typeFilter === "individual" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter("individual")}
                >
                  Individual
                </Button>
                <Button
                  variant={typeFilter === "corporate" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter("corporate")}
                >
                  Corporate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                        {client.firstName[0]}{client.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {client.firstName} {client.lastName}
                      </h3>
                      {client.organization && (
                        <p className="text-sm text-gray-600">{client.organization}</p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{client.phone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-500">Events</p>
                    <p className="font-semibold text-gray-900">{client.events}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total Value</p>
                    <p className="font-semibold text-gray-900">{client.totalValue}</p>
                  </div>
                  <Badge className={client.type === "Corporate" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}>
                    {client.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </VenueLayout>
  );
}
