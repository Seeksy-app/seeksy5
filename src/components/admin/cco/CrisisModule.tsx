import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, AlertTriangle, CheckCircle2, Clock, Users, 
  Plus, Send, Eye, FileText, Sparkles, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CrisisEvent {
  id: string;
  title: string;
  crisis_type: string;
  severity: string | null;
  status: string | null;
  description: string | null;
  affected_users_count: number | null;
  affected_segments: string[] | null;
  ai_generated_response: string | null;
  official_response: string | null;
  channels_notified: string[] | null;
  created_at: string | null;
  resolved_at: string | null;
}

const crisisTypes = [
  { value: "outage", label: "Outage" },
  { value: "security", label: "Security Incident" },
  { value: "negative_press", label: "Negative Press" },
  { value: "api_failure", label: "API Failure" },
  { value: "refund_spike", label: "Refund Spike" },
  { value: "legal", label: "Legal Issue" },
  { value: "data_breach", label: "Data Breach" },
  { value: "other", label: "Other" }
];

export function CrisisModule() {
  const [crises, setCrises] = useState<CrisisEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCrisis, setSelectedCrisis] = useState<CrisisEvent | null>(null);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [newCrisis, setNewCrisis] = useState({
    title: "",
    crisis_type: "outage",
    severity: "medium",
    description: "",
    affected_users_count: 0,
    affected_segments: ""
  });

  useEffect(() => {
    fetchCrises();
  }, []);

  const fetchCrises = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cco_crisis_events")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setCrises(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newCrisis.title) {
      toast.error("Title is required");
      return;
    }

    const { error } = await supabase.from("cco_crisis_events").insert({
      title: newCrisis.title,
      crisis_type: newCrisis.crisis_type,
      severity: newCrisis.severity,
      description: newCrisis.description || null,
      affected_users_count: newCrisis.affected_users_count,
      affected_segments: newCrisis.affected_segments.split(",").map(s => s.trim()).filter(Boolean)
    });

    if (error) {
      toast.error("Failed to create crisis event");
      return;
    }

    toast.success("Crisis event created");
    setIsCreateOpen(false);
    setNewCrisis({ title: "", crisis_type: "outage", severity: "medium", description: "", affected_users_count: 0, affected_segments: "" });
    fetchCrises();
  };

  const handleStatusChange = async (crisisId: string, newStatus: string) => {
    const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === "resolved") {
      updates.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("cco_crisis_events")
      .update(updates)
      .eq("id", crisisId);

    if (!error) {
      toast.success("Status updated");
      fetchCrises();
    }
  };

  const generateAIResponse = async (crisis: CrisisEvent, type: "internal" | "public") => {
    setGeneratingResponse(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const affectedSystems = crisis.affected_segments?.join(", ") || "Unknown";
    const affectedCount = crisis.affected_users_count || 0;
    const detectedTime = crisis.created_at ? new Date(crisis.created_at).toLocaleTimeString() : "Unknown";
    
    const responses = {
      internal: `INTERNAL CRISIS RESPONSE - ${crisis.title}

SEVERITY: ${(crisis.severity || "medium").toUpperCase()}
AFFECTED USERS: ${affectedCount}
SYSTEMS: ${affectedSystems}

IMMEDIATE ACTIONS:
1. Engineering team to investigate root cause
2. Support team to prepare customer communication
3. Leadership to be briefed within 1 hour
4. Status page to be updated

COMMUNICATION CADENCE:
- Internal: Every 30 minutes until resolved
- External: Every hour on status page

ESCALATION PATH:
1. On-call engineer → 2. Engineering lead → 3. CTO → 4. CEO

POST-INCIDENT:
- Full post-mortem within 48 hours
- Customer communication within 24 hours of resolution`,
      public: `We're aware that some users are experiencing ${crisis.title.toLowerCase()}. Our team is actively investigating and working to resolve this as quickly as possible.

What we know:
- The issue was first detected at ${detectedTime}
- Approximately ${affectedCount} users may be affected
- Our engineering team is actively working on a fix

What you can do:
- We recommend refreshing the page or trying again in a few minutes
- For urgent issues, please contact support@seeksy.io

We'll provide updates every hour until this is resolved. We apologize for any inconvenience this may cause.

Thank you for your patience.
The Seeksy Team`
    };

    const field = type === "internal" ? "ai_generated_response" : "official_response";
    await supabase
      .from("cco_crisis_events")
      .update({ [field]: responses[type] })
      .eq("id", crisis.id);

    toast.success(`${type === "internal" ? "Internal response" : "Public statement"} generated`);
    setGeneratingResponse(false);
    fetchCrises();
  };

  const getSeverityColor = (severity: string | null) => {
    const colors: Record<string, string> = {
      critical: "bg-red-500 text-white",
      high: "bg-orange-500 text-white",
      medium: "bg-yellow-500 text-black",
      low: "bg-green-500 text-white"
    };
    return colors[severity || "medium"] || "bg-gray-500 text-white";
  };

  const getStatusColor = (status: string | null) => {
    const colors: Record<string, string> = {
      active: "bg-red-100 text-red-800",
      monitoring: "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
      post_mortem: "bg-blue-100 text-blue-800"
    };
    return colors[status || "active"] || "bg-gray-100 text-gray-800";
  };

  const activeCrises = crises.filter(c => c.status === "active" || c.status === "monitoring");

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {activeCrises.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">
                  {activeCrises.length} Active Crisis Event{activeCrises.length > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-red-700">
                  {activeCrises.map(c => c.title).join(", ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Crisis Communications Console
          </h2>
          <p className="text-muted-foreground text-sm">
            Monitor and respond to platform incidents
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Plus className="h-4 w-4 mr-2" />
              Report Crisis
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report New Crisis Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Title</Label>
                <Input 
                  value={newCrisis.title}
                  onChange={(e) => setNewCrisis({ ...newCrisis, title: e.target.value })}
                  placeholder="e.g., Studio upload timeout issues"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Crisis Type</Label>
                  <Select 
                    value={newCrisis.crisis_type} 
                    onValueChange={(v) => setNewCrisis({ ...newCrisis, crisis_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {crisisTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Severity</Label>
                  <Select 
                    value={newCrisis.severity} 
                    onValueChange={(v) => setNewCrisis({ ...newCrisis, severity: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Affected Users (estimate)</Label>
                <Input 
                  type="number"
                  value={newCrisis.affected_users_count}
                  onChange={(e) => setNewCrisis({ ...newCrisis, affected_users_count: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Affected Systems (comma-separated)</Label>
                <Input 
                  value={newCrisis.affected_segments}
                  onChange={(e) => setNewCrisis({ ...newCrisis, affected_segments: e.target.value })}
                  placeholder="e.g., Studio, API, Database"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={newCrisis.description}
                  onChange={(e) => setNewCrisis({ ...newCrisis, description: e.target.value })}
                  placeholder="Detailed description of the incident..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleCreate}>Report Crisis</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Crisis List */}
      <div className="space-y-4">
        {crises.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="font-medium">All Clear</p>
              <p className="text-sm text-muted-foreground">No crisis events recorded</p>
            </CardContent>
          </Card>
        ) : (
          crises.map((crisis) => (
            <Card key={crisis.id} className={crisis.status === "active" ? "border-red-300" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{crisis.title}</CardTitle>
                      <Badge className={getSeverityColor(crisis.severity)}>{crisis.severity || "medium"}</Badge>
                      <Badge className={getStatusColor(crisis.status)}>{crisis.status || "active"}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {crisis.affected_users_count || 0} affected
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {crisis.created_at ? new Date(crisis.created_at).toLocaleString() : "Unknown"}
                      </span>
                      <Badge variant="outline">
                        {crisisTypes.find(t => t.value === crisis.crisis_type)?.label}
                      </Badge>
                    </div>
                  </div>
                  <Select value={crisis.status || "active"} onValueChange={(v) => handleStatusChange(crisis.id, v)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="monitoring">Monitoring</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="post_mortem">Post-Mortem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {crisis.description && (
                  <p className="text-sm text-muted-foreground mb-4">{crisis.description}</p>
                )}
                
                {crisis.affected_segments && crisis.affected_segments.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    <span className="text-sm font-medium">Systems:</span>
                    {crisis.affected_segments.map(sys => (
                      <Badge key={sys} variant="secondary">{sys}</Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    disabled={generatingResponse}
                    onClick={() => generateAIResponse(crisis, "internal")}
                  >
                    {generatingResponse ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Generate Internal Response
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    disabled={generatingResponse}
                    onClick={() => generateAIResponse(crisis, "public")}
                  >
                    {generatingResponse ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Generate Public Statement
                  </Button>
                  {crisis.official_response && (
                    <Button size="sm">
                      <Send className="h-4 w-4 mr-1" />
                      Publish Statement
                    </Button>
                  )}
                </div>

                {(crisis.ai_generated_response || crisis.official_response) && (
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    {crisis.ai_generated_response && (
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-xs font-medium text-yellow-800 mb-2">Internal Response</p>
                        <p className="text-xs whitespace-pre-wrap">{crisis.ai_generated_response}</p>
                      </div>
                    )}
                    {crisis.official_response && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-medium text-blue-800 mb-2">Public Statement</p>
                        <p className="text-xs whitespace-pre-wrap">{crisis.official_response}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
