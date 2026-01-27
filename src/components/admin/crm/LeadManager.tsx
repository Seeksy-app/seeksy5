import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, Plus, Users, Target, TrendingUp, Filter,
  ChevronRight, Calendar, DollarSign, Mail, Phone
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface SalesLead {
  id: string;
  title: string;
  company: string | null;
  email: string;
  phone: string | null;
  stage: string;
  deal_value: number | null;
  probability: number;
  expected_close_date: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
}

interface SiteLead {
  id: string;
  email: string;
  name: string | null;
  lead_type: string;
  source_url: string | null;
  status: string;
  ai_classification: string | null;
  ai_suggested_response: string | null;
  created_at: string;
}

export function LeadManager() {
  const [salesLeads, setSalesLeads] = useState<SalesLead[]>([]);
  const [siteLeads, setSiteLeads] = useState<SiteLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    title: "",
    email: "",
    company: "",
    phone: "",
    deal_value: "",
    source: "",
    notes: ""
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    
    const [salesRes, siteRes] = await Promise.all([
      (supabase as any).from("crm_sales_leads").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("crm_site_leads").select("*").order("created_at", { ascending: false })
    ]);

    setSalesLeads((salesRes.data || []) as SalesLead[]);
    setSiteLeads((siteRes.data || []) as SiteLead[]);
    setLoading(false);
  };

  const handleCreateLead = async () => {
    if (!newLead.title || !newLead.email) {
      toast.error("Title and email are required");
      return;
    }

    const { error } = await (supabase as any).from("crm_sales_leads").insert({
      title: newLead.title,
      email: newLead.email,
      company: newLead.company || null,
      phone: newLead.phone || null,
      deal_value: newLead.deal_value ? parseFloat(newLead.deal_value) : null,
      source: newLead.source || null,
      notes: newLead.notes || null
    });

    if (error) {
      toast.error("Failed to create lead");
      return;
    }

    toast.success("Lead created successfully");
    setIsCreateOpen(false);
    setNewLead({ title: "", email: "", company: "", phone: "", deal_value: "", source: "", notes: "" });
    fetchLeads();
  };

  const handleStageChange = async (leadId: string, newStage: string) => {
    const { error } = await (supabase as any)
      .from("crm_sales_leads")
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq("id", leadId);

    if (!error) {
      toast.success("Stage updated");
      fetchLeads();
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      new_inquiry: "bg-blue-100 text-blue-800",
      discovery_needed: "bg-yellow-100 text-yellow-800",
      qualifying: "bg-purple-100 text-purple-800",
      proposal_sent: "bg-orange-100 text-orange-800",
      negotiating: "bg-pink-100 text-pink-800",
      closed_won: "bg-green-100 text-green-800",
      closed_lost: "bg-red-100 text-red-800"
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
  };

  const getLeadTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      demo_request: "bg-blue-100 text-blue-800",
      email_capture: "bg-green-100 text-green-800",
      early_access: "bg-purple-100 text-purple-800",
      event_registration: "bg-orange-100 text-orange-800",
      contact_form: "bg-gray-100 text-gray-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const pipelineValue = salesLeads.reduce((sum, lead) => {
    if (lead.stage !== "closed_lost" && lead.deal_value) {
      return sum + (lead.deal_value * (lead.probability / 100));
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{salesLeads.length}</p>
                <p className="text-xs text-muted-foreground">Sales Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{siteLeads.length}</p>
                <p className="text-xs text-muted-foreground">Site Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">${pipelineValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Pipeline Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {salesLeads.filter(l => l.stage === "closed_won").length}
                </p>
                <p className="text-xs text-muted-foreground">Closed Won</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Sales Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Title / Name *</Label>
                <Input 
                  value={newLead.title}
                  onChange={(e) => setNewLead({ ...newLead, title: e.target.value })}
                  placeholder="Lead title or contact name"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input 
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company</Label>
                  <Input 
                    value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input 
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Deal Value ($)</Label>
                  <Input 
                    type="number"
                    value={newLead.deal_value}
                    onChange={(e) => setNewLead({ ...newLead, deal_value: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Source</Label>
                  <Input 
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                    placeholder="e.g., Referral, Website"
                  />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea 
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateLead}>Create Lead</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales Pipeline ({salesLeads.length})</TabsTrigger>
          <TabsTrigger value="site">Site Leads ({siteLeads.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          {salesLeads.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No sales leads yet</p>
                <p className="text-sm">Create your first lead to get started</p>
              </CardContent>
            </Card>
          ) : (
            salesLeads
              .filter(lead => 
                lead.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lead.email.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((lead) => (
                <Card key={lead.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{lead.title}</h3>
                          <Badge className={getStageColor(lead.stage)}>
                            {lead.stage.replace(/_/g, " ")}
                          </Badge>
                          {lead.deal_value && (
                            <Badge variant="outline">${lead.deal_value.toLocaleString()}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </span>
                          {lead.company && (
                            <span>{lead.company}</span>
                          )}
                          {lead.source && (
                            <span>Source: {lead.source}</span>
                          )}
                        </div>
                      </div>
                      <Select value={lead.stage} onValueChange={(v) => handleStageChange(lead.id, v)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new_inquiry">New Inquiry</SelectItem>
                          <SelectItem value="discovery_needed">Discovery Needed</SelectItem>
                          <SelectItem value="qualifying">Qualifying</SelectItem>
                          <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                          <SelectItem value="negotiating">Negotiating</SelectItem>
                          <SelectItem value="closed_won">Closed Won</SelectItem>
                          <SelectItem value="closed_lost">Closed Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="site" className="space-y-4">
          {siteLeads.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No site leads yet</p>
                <p className="text-sm">Site leads will appear here from marketing funnels</p>
              </CardContent>
            </Card>
          ) : (
            siteLeads
              .filter(lead => 
                lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (lead.name && lead.name.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .map((lead) => (
                <Card key={lead.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{lead.name || lead.email}</h3>
                          <Badge className={getLeadTypeColor(lead.lead_type)}>
                            {lead.lead_type.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant="outline">{lead.status}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(lead.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {lead.ai_classification && (
                          <p className="text-xs text-blue-600 mt-1">
                            AI: {lead.ai_classification}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        Convert
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
