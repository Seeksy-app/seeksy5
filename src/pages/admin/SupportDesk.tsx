import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Headphones, Search, Clock, CheckCircle2, AlertCircle, User, Plus } from "lucide-react";
import { useState } from "react";
import CreateTicketModal from "@/components/helpdesk/CreateTicketModal";
import TicketDetailModal from "@/components/helpdesk/TicketDetailModal";

interface Ticket {
  id: string;
  customer: string;
  subject: string;
  priority: string;
  status: string;
  time: string;
}

export default function SupportDesk() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const tickets: Ticket[] = [
    { id: "TKT-001234", customer: "John Doe", subject: "Account access issue", priority: "high", status: "open", time: "2 hours ago" },
    { id: "TKT-001235", customer: "Jane Smith", subject: "Billing question", priority: "medium", status: "in-progress", time: "4 hours ago" },
    { id: "TKT-001236", customer: "Bob Johnson", subject: "Feature request", priority: "low", status: "resolved", time: "1 day ago" },
  ];

  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "destructive";
    if (priority === "medium") return "default";
    return "secondary";
  };

  const getStatusColor = (status: string) => {
    if (status === "resolved") return "default";
    if (status === "in-progress") return "default";
    return "secondary";
  };

  return (
    <div className="p-6 px-10 pt-8 pb-16 flex flex-col items-start w-full space-y-6">
      <div className="flex items-center justify-between w-full">
        <div className="text-left">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Headphones className="h-8 w-8 text-primary" />
            Support Desk
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage customer tickets and support requests
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tickets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {tickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="cursor-pointer hover:shadow-md transition-shadow text-left"
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                      <Badge variant={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant={getStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ticket.customer}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {ticket.time}
                      </span>
                      <span className="text-xs text-muted-foreground">{ticket.id}</span>
                    </CardDescription>
                  </div>
                  {ticket.status === "open" && <AlertCircle className="h-5 w-5 text-destructive" />}
                  {ticket.status === "resolved" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                </div>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="open">
          <p className="text-muted-foreground text-left py-8">Open tickets will appear here</p>
        </TabsContent>

        <TabsContent value="in-progress">
          <p className="text-muted-foreground text-left py-8">In-progress tickets will appear here</p>
        </TabsContent>

        <TabsContent value="resolved">
          <p className="text-muted-foreground text-left py-8">Resolved tickets will appear here</p>
        </TabsContent>
      </Tabs>

      <CreateTicketModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />

      <TicketDetailModal
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
        ticket={selectedTicket}
      />
    </div>
  );
}
