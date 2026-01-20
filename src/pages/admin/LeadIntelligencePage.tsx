import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Shield, Megaphone, Sparkles, 
  Search, Filter, UserPlus, TrendingUp,
  DollarSign, Clock, Settings
} from "lucide-react";

interface UnifiedLead {
  id: string;
  source: string;
  name: string | null;
  email: string | null;
  created_at: string;
  status?: string;
  assigned?: boolean;
}

export default function LeadIntelligencePage() {
  const navigate = useNavigate();
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch veteran leads
  const { data: veteranLeads } = useQuery({
    queryKey: ["veteran-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("veteran_leads")
        .select("id, full_name, email, created_at, source")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []).map((l) => ({ 
        id: l.id,
        name: l.full_name,
        email: l.email,
        created_at: l.created_at,
        source: "veteran" as const 
      }));
    },
  });

  // Fetch campaign candidates
  const { data: campaignLeads } = useQuery({
    queryKey: ["campaign-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_candidates")
        .select("id, display_name, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []).map((l) => ({
        id: l.id,
        name: l.display_name,
        email: null,
        created_at: l.created_at,
        source: "campaign" as const,
      }));
    },
  });

  // Fetch seeksy contacts
  const { data: seeksyLeads } = useQuery({
    queryKey: ["seeksy-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, email, created_at, lead_status")
        .eq("lead_status", "new")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []).map((l) => ({ ...l, source: "seeksy" as const }));
    },
  });

  // Fetch partner assignments for status
  const { data: assignments } = useQuery({
    queryKey: ["lead-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_lead_assignments")
        .select("lead_id, lead_source, partner_id, status");
      if (error) throw error;
      return data || [];
    },
  });

  // Combine all leads
  const allLeads: UnifiedLead[] = [
    ...(veteranLeads || []),
    ...(campaignLeads || []),
    ...(seeksyLeads || []),
  ].map((lead) => {
    const assignment = assignments?.find(
      (a) => a.lead_id === lead.id && a.lead_source === `${lead.source}_leads`
    );
    return {
      ...lead,
      assigned: !!assignment,
      status: assignment?.status,
    };
  });

  // Filter leads
  const filteredLeads = allLeads
    .filter((lead) => sourceFilter === "all" || lead.source === sourceFilter)
    .filter(
      (lead) =>
        !searchQuery ||
        lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const stats = {
    total: allLeads.length,
    veteran: veteranLeads?.length || 0,
    campaign: campaignLeads?.length || 0,
    seeksy: seeksyLeads?.length || 0,
    assigned: allLeads.filter((l) => l.assigned).length,
    unassigned: allLeads.filter((l) => !l.assigned).length,
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "veteran":
        return <Shield className="h-4 w-4 text-green-600" />;
      case "campaign":
        return <Megaphone className="h-4 w-4 text-blue-600" />;
      case "seeksy":
        return <Sparkles className="h-4 w-4 text-purple-600" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      veteran: "bg-green-100 text-green-800",
      campaign: "bg-blue-100 text-blue-800",
      seeksy: "bg-purple-100 text-purple-800",
    };
    return colors[source] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lead Intelligence</h1>
          <p className="text-muted-foreground">
            Unified view of all leads across Veterans, CampaignStaff, and Seeksy
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin/leads/settings")}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.veteran}</p>
                <p className="text-xs text-muted-foreground">Veterans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.campaign}</p>
                <p className="text-xs text-muted-foreground">Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.seeksy}</p>
                <p className="text-xs text-muted-foreground">Seeksy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">{stats.unassigned}</p>
                <p className="text-xs text-muted-foreground">Unassigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{stats.assigned}</p>
                <p className="text-xs text-muted-foreground">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="veteran">Veterans</SelectItem>
            <SelectItem value="campaign">CampaignStaff</SelectItem>
            <SelectItem value="seeksy">Seeksy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Source</th>
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.slice(0, 50).map((lead) => (
                  <tr key={`${lead.source}-${lead.id}`} className="border-b last:border-0">
                    <td className="py-3">
                      <Badge className={getSourceBadge(lead.source)}>
                        <span className="flex items-center gap-1">
                          {getSourceIcon(lead.source)}
                          {lead.source}
                        </span>
                      </Badge>
                    </td>
                    <td className="py-3 font-medium">{lead.name || "—"}</td>
                    <td className="py-3 text-muted-foreground">{lead.email || "—"}</td>
                    <td className="py-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3">
                      {lead.assigned ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {lead.status || "Assigned"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Unassigned
                        </Badge>
                      )}
                    </td>
                    <td className="py-3">
                      <Button variant="ghost" size="sm">
                        <UserPlus className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLeads.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No leads found matching your filters
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
