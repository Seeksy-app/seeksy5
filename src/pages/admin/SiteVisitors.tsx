import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Users, UserCheck, UserX, Mail, Building, ExternalLink, Search, Plus } from "lucide-react";
import { demoSiteVisitors, siteVisitorStats, SiteVisitor } from "@/data/siteVisitorsDemo";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function SiteVisitors() {
  const [visitors, setVisitors] = useState<SiteVisitor[]>(demoSiteVisitors);
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<SiteVisitor | null>(null);
  const [newVisitor, setNewVisitor] = useState({
    name: "",
    email: "",
    company: "",
    source: "",
    status: "new" as const,
    notes: "",
    requestType: "Info Request",
  });

  const filteredVisitors = visitors.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      new: "default",
      contacted: "secondary",
      converted: "outline",
      unresponsive: "destructive",
    };
    return <Badge variant={variants[status] || "default"} className="capitalize">{status}</Badge>;
  };

  const handleAddVisitor = () => {
    const visitor: SiteVisitor = {
      id: `sv-${Date.now()}`,
      ...newVisitor,
      createdAt: new Date().toISOString(),
    };
    setVisitors([visitor, ...visitors]);
    setAddDialogOpen(false);
    setNewVisitor({ name: "", email: "", company: "", source: "", status: "new", notes: "", requestType: "Info Request" });
    toast.success("Site visitor added successfully");
  };

  const filterByStatus = (status: string) => {
    if (status === "all") return filteredVisitors;
    return filteredVisitors.filter(v => v.status === status);
  };

  return (
    <div className="px-10 pt-8 pb-16 flex flex-col items-start w-full space-y-6">
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8 text-primary" />
            Site Visitors
          </h1>
          <p className="text-muted-foreground mt-1">
            Track website signups, inquiries, and demo requests
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Visitor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Site Visitor</DialogTitle>
              <DialogDescription>Record a new website inquiry or demo request</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Name *</Label>
                <Input 
                  value={newVisitor.name} 
                  onChange={(e) => setNewVisitor({ ...newVisitor, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input 
                  type="email"
                  value={newVisitor.email} 
                  onChange={(e) => setNewVisitor({ ...newVisitor, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <Label>Company</Label>
                <Input 
                  value={newVisitor.company} 
                  onChange={(e) => setNewVisitor({ ...newVisitor, company: e.target.value })}
                  placeholder="Company Name"
                />
              </div>
              <div>
                <Label>Source</Label>
                <Select value={newVisitor.source} onValueChange={(v) => setNewVisitor({ ...newVisitor, source: v })}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Landing Page">Landing Page</SelectItem>
                    <SelectItem value="Google Ads">Google Ads</SelectItem>
                    <SelectItem value="LinkedIn Campaign">LinkedIn Campaign</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Organic Search">Organic Search</SelectItem>
                    <SelectItem value="Social Media">Social Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Request Type</Label>
                <Select value={newVisitor.requestType} onValueChange={(v) => setNewVisitor({ ...newVisitor, requestType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Demo Request">Demo Request</SelectItem>
                    <SelectItem value="Info Request">Info Request</SelectItem>
                    <SelectItem value="Sign Up">Sign Up</SelectItem>
                    <SelectItem value="Free Trial">Free Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea 
                  value={newVisitor.notes} 
                  onChange={(e) => setNewVisitor({ ...newVisitor, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <Button onClick={handleAddVisitor} className="w-full" disabled={!newVisitor.name || !newVisitor.email}>
                Add Visitor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{visitors.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{visitors.filter(v => v.status === "new").length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contacted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-amber-500" />
              <span className="text-2xl font-bold">{visitors.filter(v => v.status === "contacted").length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{visitors.filter(v => v.status === "converted").length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search visitors..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({visitors.length})</TabsTrigger>
          <TabsTrigger value="new">New ({visitors.filter(v => v.status === "new").length})</TabsTrigger>
          <TabsTrigger value="contacted">Contacted ({visitors.filter(v => v.status === "contacted").length})</TabsTrigger>
          <TabsTrigger value="converted">Converted ({visitors.filter(v => v.status === "converted").length})</TabsTrigger>
        </TabsList>

        {["all", "new", "contacted", "converted"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {filterByStatus(tab).map((visitor) => (
              <Card 
                key={visitor.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedVisitor(visitor)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{visitor.name}</CardTitle>
                        {getStatusBadge(visitor.status)}
                        {visitor.requestType && (
                          <Badge variant="outline">{visitor.requestType}</Badge>
                        )}
                      </div>
                      <CardDescription className="space-y-1">
                        {visitor.company && (
                          <div className="flex items-center gap-1 text-sm">
                            <Building className="h-3 w-3" />
                            {visitor.company}
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {visitor.email}
                          </span>
                          {visitor.source && (
                            <span className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              {visitor.source}
                            </span>
                          )}
                        </div>
                      </CardDescription>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(visitor.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  {visitor.notes && (
                    <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                      {visitor.notes}
                    </p>
                  )}
                </CardHeader>
              </Card>
            ))}
            {filterByStatus(tab).length === 0 && (
              <p className="text-muted-foreground text-center py-8">No visitors in this category</p>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Visitor Detail Dialog */}
      <Dialog open={!!selectedVisitor} onOpenChange={() => setSelectedVisitor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedVisitor?.name}</DialogTitle>
            <DialogDescription>{selectedVisitor?.company}</DialogDescription>
          </DialogHeader>
          {selectedVisitor && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedVisitor.status)}
                {selectedVisitor.requestType && <Badge variant="outline">{selectedVisitor.requestType}</Badge>}
              </div>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{selectedVisitor.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source:</span>
                  <span>{selectedVisitor.source || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Page Visited:</span>
                  <span>{selectedVisitor.pageVisited || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted:</span>
                  <span>{formatDistanceToNow(new Date(selectedVisitor.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
              {selectedVisitor.notes && (
                <div className="bg-muted/50 p-3 rounded">
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{selectedVisitor.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={() => { toast.success("Email sent!"); setSelectedVisitor(null); }}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" onClick={() => setSelectedVisitor(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
