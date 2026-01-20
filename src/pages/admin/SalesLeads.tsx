import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Users, DollarSign, Target, Mail, Phone, Plus, Search, Building, Calendar } from "lucide-react";
import { demoLeads, leadsStats, DemoLead } from "@/data/salesLeadsDemo";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

export default function SalesLeads() {
  const [leads, setLeads] = useState<DemoLead[]>(demoLeads);
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<DemoLead | null>(null);
  const [displayCount, setDisplayCount] = useState(20);
  const [newLead, setNewLead] = useState({
    name: "",
    contact: "",
    email: "",
    phone: "",
    company: "",
    value: "",
    status: "new",
    stage: "discovery",
    source: "",
    notes: "",
  });

  const stats = useMemo(() => ({
    totalLeads: leads.length,
    qualifiedLeads: leads.filter(l => l.status === "qualified").length,
    pipelineValue: leads.filter(l => !l.stage.startsWith("closed")).reduce((sum, l) => sum + l.value, 0),
    conversionRate: Math.round((leads.filter(l => l.stage === "closed-won").length / leads.length) * 100) || 27,
  }), [leads]);

  const filteredLeads = leads.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      qualified: "bg-green-500 text-white",
      new: "bg-blue-500 text-white",
      contacted: "bg-amber-500 text-white",
      unqualified: "bg-gray-400 text-white",
    };
    return <Badge className={colors[status] || "bg-gray-500"}>{status}</Badge>;
  };

  const getStageBadge = (stage: string) => {
    return <Badge variant="outline" className="capitalize">{stage.replace("-", " ")}</Badge>;
  };

  const handleAddLead = () => {
    const lead: DemoLead = {
      id: `lead-${Date.now()}`,
      name: newLead.company || newLead.name,
      contact: newLead.contact,
      email: newLead.email,
      phone: newLead.phone,
      company: newLead.company,
      value: parseInt(newLead.value) || 0,
      status: newLead.status,
      stage: newLead.stage,
      source: newLead.source,
      notes: newLead.notes,
      createdAt: new Date().toISOString(),
    };
    setLeads([lead, ...leads]);
    setAddDialogOpen(false);
    setNewLead({ name: "", contact: "", email: "", phone: "", company: "", value: "", status: "new", stage: "discovery", source: "", notes: "" });
    toast.success("Lead added successfully");
  };

  const filterByTab = (tab: string) => {
    if (tab === "all") return filteredLeads;
    if (tab === "new") return filteredLeads.filter(l => l.status === "new");
    if (tab === "qualified") return filteredLeads.filter(l => l.status === "qualified");
    if (tab === "closed") return filteredLeads.filter(l => l.stage.startsWith("closed"));
    return filteredLeads;
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <div className="px-10 pt-8 pb-16 flex flex-col items-start w-full space-y-6">
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Sales & Leads
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage sales pipeline and lead conversion
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
              <DialogDescription>Create a new sales lead</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Name *</Label>
                  <Input
                    value={newLead.contact}
                    onChange={(e) => setNewLead({ ...newLead, contact: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Company *</Label>
                  <Input
                    value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                    placeholder="Acme Corp"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="john@acme.com"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Stage</Label>
                  <Select value={newLead.stage} onValueChange={(v) => setNewLead({ ...newLead, stage: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="discovery">Discovery</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="closed-won">Closed Won</SelectItem>
                      <SelectItem value="closed-lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Deal Value ($)</Label>
                  <Input
                    type="number"
                    value={newLead.value}
                    onChange={(e) => setNewLead({ ...newLead, value: e.target.value })}
                    placeholder="25000"
                  />
                </div>
              </div>
              <div>
                <Label>Source</Label>
                <Select value={newLead.source} onValueChange={(v) => setNewLead({ ...newLead, source: v })}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Conference">Conference</SelectItem>
                    <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
                    <SelectItem value="Ad Campaign">Ad Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  placeholder="Additional notes about this lead..."
                />
              </div>
              <Button onClick={handleAddLead} className="w-full" disabled={!newLead.contact || !newLead.email || !newLead.company}>
                Add Lead
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.totalLeads}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Qualified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{stats.qualifiedLeads}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{formatCurrency(stats.pipelineValue)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{stats.conversionRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="new">New ({leads.filter(l => l.status === "new").length})</TabsTrigger>
          <TabsTrigger value="qualified">Qualified ({stats.qualifiedLeads})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({leads.filter(l => l.stage.startsWith("closed")).length})</TabsTrigger>
        </TabsList>

        {["all", "new", "qualified", "closed"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {filterByTab(tab).slice(0, displayCount).map((lead) => (
              <Card
                key={lead.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedLead(lead)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{lead.name}</CardTitle>
                        {getStatusBadge(lead.status)}
                        {getStageBadge(lead.stage)}
                      </div>
                      <CardDescription className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-3 w-3" />
                          {lead.contact}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">${lead.value.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Deal Value</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
            {filterByTab(tab).length > displayCount && (
              <Button variant="outline" className="w-full" onClick={() => setDisplayCount(displayCount + 20)}>
                Load More ({filterByTab(tab).length - displayCount} remaining)
              </Button>
            )}
            {filterByTab(tab).length === 0 && (
              <p className="text-muted-foreground text-center py-8">No leads in this category</p>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Lead Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <SheetContent className="w-[500px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedLead?.name}
              {selectedLead && getStatusBadge(selectedLead.status)}
            </SheetTitle>
            <SheetDescription>{selectedLead?.company}</SheetDescription>
          </SheetHeader>
          {selectedLead && (
            <ScrollArea className="h-[calc(100vh-120px)] pr-4">
              <div className="space-y-6 py-6">
                {/* Deal Value */}
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Deal Value</p>
                  <p className="text-3xl font-bold text-primary">${selectedLead.value.toLocaleString()}</p>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Contact Information
                  </h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Contact Name</span>
                      <span className="font-medium">{selectedLead.contact}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{selectedLead.email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{selectedLead.phone}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Company</span>
                      <span className="font-medium">{selectedLead.company}</span>
                    </div>
                  </div>
                </div>

                {/* Lead Status */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Lead Status
                  </h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between py-2 border-b items-center">
                      <span className="text-muted-foreground">Status</span>
                      {getStatusBadge(selectedLead.status)}
                    </div>
                    <div className="flex justify-between py-2 border-b items-center">
                      <span className="text-muted-foreground">Stage</span>
                      {getStageBadge(selectedLead.stage)}
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Source</span>
                      <span className="font-medium">{selectedLead.source || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium">{format(new Date(selectedLead.createdAt), "MMM d, yyyy")}</span>
                    </div>
                    {selectedLead.lastContact && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Last Contact</span>
                        <span className="font-medium">{formatDistanceToNow(new Date(selectedLead.lastContact), { addSuffix: true })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedLead.notes && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Notes</h4>
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      {selectedLead.notes}
                    </div>
                  </div>
                )}

                {/* Stage History (placeholder) */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Stage History
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>{format(new Date(selectedLead.createdAt), "MMM d")} - Lead created</span>
                    </div>
                    {selectedLead.stage !== "new" && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span>{format(new Date(selectedLead.createdAt), "MMM d")} - Moved to {selectedLead.stage}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tasks placeholder */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Tasks</h4>
                  <p className="text-sm text-muted-foreground">No tasks assigned yet</p>
                  <Button variant="outline" size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Task
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={() => { toast.success("Email sent!"); }}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button variant="outline" onClick={() => { toast.success("Call logged!"); }}>
                    <Phone className="h-4 w-4 mr-2" />
                    Log Call
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
