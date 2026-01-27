import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, AlertTriangle, CheckCircle2, Clock, Users, 
  Plus, Send, Sparkles, Loader2
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
  stakeholders: string[];
  timeline: unknown[];
  lessons_learned: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
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
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [newCrisis, setNewCrisis] = useState({
    title: "",
    crisis_type: "outage",
    severity: "medium",
    description: "",
    stakeholders: ""
  });

  useEffect(() => {
    fetchCrises();
  }, []);

  const fetchCrises = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await (supabase as any)
      .from("cco_crisis_events")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setCrises(data as CrisisEvent[]);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newCrisis.title) {
      toast.error("Title is required");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    const { error } = await (supabase as any).from("cco_crisis_events").insert({
      user_id: user.id,
      title: newCrisis.title,
      crisis_type: newCrisis.crisis_type,
      severity: newCrisis.severity,
      description: newCrisis.description || null,
      stakeholders: newCrisis.stakeholders.split(",").map((s: string) => s.trim()).filter(Boolean)
    });

    if (error) {
      toast.error("Failed to create crisis event");
      return;
    }

    toast.success("Crisis event created");
    setIsCreateOpen(false);
    setNewCrisis({ title: "", crisis_type: "outage", severity: "medium", description: "", stakeholders: "" });
    fetchCrises();
  };

  const handleStatusChange = async (crisisId: string, newStatus: string) => {
    const updates: Record<string, unknown> = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === "resolved") {
      updates.resolved_at = new Date().toISOString();
    }

    const { error } = await (supabase as any)
      .from("cco_crisis_events")
      .update(updates)
      .eq("id", crisisId);

    if (!error) {
      toast.success("Status updated");
      fetchCrises();
    }
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
                <Label>Stakeholders (comma-separated)</Label>
                <Input 
                  value={newCrisis.stakeholders}
                  onChange={(e) => setNewCrisis({ ...newCrisis, stakeholders: e.target.value })}
                  placeholder="e.g., Engineering, Support, Leadership"
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
                        {crisis.stakeholders?.length || 0} stakeholders
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
                
                {crisis.stakeholders && crisis.stakeholders.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    <span className="text-sm font-medium">Stakeholders:</span>
                    {crisis.stakeholders.map(stakeholder => (
                      <Badge key={stakeholder} variant="secondary">{stakeholder}</Badge>
                    ))}
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
