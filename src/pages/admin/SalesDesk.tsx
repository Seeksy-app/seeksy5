import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, Users, DollarSign, Target, Mail, Phone, 
  Headphones, Search, Clock, CheckCircle2, AlertCircle, User,
  MessageSquare, BarChart3
} from "lucide-react";
import { useState } from "react";

export default function SalesDesk() {
  const [searchQuery, setSearchQuery] = useState("");

  // Sales Leads Data
  const leads = [
    { id: 1, name: "Acme Corp", contact: "Sarah Wilson", email: "sarah@acme.com", phone: "(555) 123-4567", value: "$50,000", status: "qualified", stage: "proposal" },
    { id: 2, name: "TechStart Inc", contact: "Mike Chen", email: "mike@techstart.com", phone: "(555) 234-5678", value: "$25,000", status: "new", stage: "discovery" },
    { id: 3, name: "Creative Studios", contact: "Emily Brown", email: "emily@creative.com", phone: "(555) 345-6789", value: "$75,000", status: "qualified", stage: "negotiation" },
    { id: 4, name: "Global Media", contact: "John Smith", email: "john@globalmedia.com", phone: "(555) 456-7890", value: "$100,000", status: "hot", stage: "closing" },
  ];

  // Support Tickets Data
  const tickets = [
    { id: "TKT-001", subject: "Account access issue", customer: "John Smith", priority: "high", status: "open", time: "2 hours ago" },
    { id: "TKT-002", subject: "Billing inquiry", customer: "Sarah Wilson", priority: "medium", status: "in-progress", time: "4 hours ago" },
    { id: "TKT-003", subject: "Feature request", customer: "Mike Chen", priority: "low", status: "resolved", time: "1 day ago" },
    { id: "TKT-004", subject: "Technical support needed", customer: "Emily Brown", priority: "high", status: "open", time: "30 minutes ago" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "qualified": return "bg-blue-100 text-blue-800";
      case "new": return "bg-gray-100 text-gray-800";
      case "hot": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "proposal": return "bg-purple-100 text-purple-800";
      case "discovery": return "bg-yellow-100 text-yellow-800";
      case "negotiation": return "bg-orange-100 text-orange-800";
      case "closing": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-800";
      case "in-progress": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Desk</h1>
          <p className="text-muted-foreground mt-1">
            Unified sales leads and customer support management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <Target className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Leads</p>
                <p className="text-2xl font-bold">{leads.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold">$250K</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100">
                <Headphones className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === "open").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search leads or tickets..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Sales Leads
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <Headphones className="w-4 h-4" />
            Support Tickets
          </TabsTrigger>
        </TabsList>

        {/* Sales Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <div className="grid gap-4">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{lead.name}</h3>
                        <p className="text-sm text-muted-foreground">{lead.contact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Value</p>
                        <p className="font-semibold text-green-600">{lead.value}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                        <Badge className={getStageColor(lead.stage)}>{lead.stage}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Support Tickets Tab */}
        <TabsContent value="support" className="space-y-4">
          <div className="grid gap-4">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        {ticket.status === "open" ? (
                          <AlertCircle className="w-6 h-6 text-red-500" />
                        ) : ticket.status === "resolved" ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : (
                          <Clock className="w-6 h-6 text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-muted-foreground">{ticket.id}</span>
                          <h3 className="font-semibold text-foreground">{ticket.subject}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{ticket.customer}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{ticket.time}</span>
                      <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                      <Badge className={getTicketStatusColor(ticket.status)}>{ticket.status}</Badge>
                      <Button variant="ghost" size="icon">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
