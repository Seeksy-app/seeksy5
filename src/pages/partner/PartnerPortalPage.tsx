import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Building2, Users, DollarSign, Clock, 
  CheckCircle, XCircle, Phone, Mail,
  TrendingUp, FileText
} from "lucide-react";

interface Partner {
  id: string;
  name: string;
  slug: string;
  brand_color: string | null;
  logo_url: string | null;
}

interface LeadAssignment {
  id: string;
  lead_source: string;
  lead_id: string;
  status: string;
  assigned_at: string;
  partner_notes: string | null;
  lead_name?: string;
  lead_email?: string;
}

export default function PartnerPortalPage() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch partner by slug
  const { data: partner, isLoading: partnerLoading } = useQuery({
    queryKey: ["partner", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("slug", slug)
        .eq("portal_enabled", true)
        .single();
      if (error) throw error;
      return data as Partner;
    },
    enabled: !!slug,
  });

  // Check if user is a partner user
  const { data: partnerUser, isLoading: partnerUserLoading } = useQuery({
    queryKey: ["partner-user", partner?.id, user?.id],
    queryFn: async () => {
      if (!partner?.id || !user?.id) return null;
      const { data, error } = await supabase
        .from("partner_users")
        .select("*")
        .eq("partner_id", partner.id)
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!partner?.id && !!user?.id,
  });

  // Fetch assigned leads
  const { data: assignments } = useQuery({
    queryKey: ["partner-assignments", partner?.id],
    queryFn: async () => {
      if (!partner?.id) return [];
      const { data, error } = await supabase
        .from("partner_lead_assignments")
        .select("*")
        .eq("partner_id", partner.id)
        .order("assigned_at", { ascending: false });
      if (error) throw error;
      return data as LeadAssignment[];
    },
    enabled: !!partner?.id && !!partnerUser,
  });

  // Update lead status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from("partner_lead_assignments")
        .update({ status, partner_notes: notes, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-assignments"] });
      toast.success("Lead status updated");
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      toast.success("Logged in successfully");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (partnerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Partner Not Found</h2>
            <p className="text-muted-foreground">This partner portal doesn't exist or is disabled.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login if not authenticated or not a partner user
  if (!user || (user && !partnerUserLoading && !partnerUser)) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: partner.brand_color ? `${partner.brand_color}10` : "#F7F9FC" }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {partner.logo_url ? (
              <img src={partner.logo_url} alt={partner.name} className="h-12 mx-auto mb-4" />
            ) : (
              <Building2 
                className="h-12 w-12 mx-auto mb-4" 
                style={{ color: partner.brand_color || "#003A9E" }}
              />
            )}
            <CardTitle>{partner.name} Partner Portal</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sign in to view your assigned leads
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                style={{ backgroundColor: partner.brand_color || "#003A9E" }}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            {user && !partnerUser && (
              <p className="text-sm text-center text-red-600 mt-4">
                Your account is not authorized for this partner portal.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    total: assignments?.length || 0,
    new: assignments?.filter((a) => a.status === "new").length || 0,
    contacted: assignments?.filter((a) => a.status === "contacted").length || 0,
    converted: assignments?.filter((a) => a.status === "converted").length || 0,
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-amber-100 text-amber-800",
      qualified: "bg-purple-100 text-purple-800",
      converted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: partner.brand_color ? `${partner.brand_color}08` : "#F7F9FC" }}
    >
      {/* Header */}
      <header 
        className="border-b bg-white sticky top-0 z-10"
        style={{ borderColor: partner.brand_color ? `${partner.brand_color}20` : "#E2E8F0" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {partner.logo_url ? (
              <img src={partner.logo_url} alt={partner.name} className="h-8" />
            ) : (
              <Building2 
                className="h-8 w-8" 
                style={{ color: partner.brand_color || "#003A9E" }}
              />
            )}
            <span className="font-semibold text-lg">{partner.name}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => supabase.auth.signOut()}
          >
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.new}</p>
                  <p className="text-sm text-muted-foreground">New</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Phone className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.contacted}</p>
                  <p className="text-sm text-muted-foreground">Contacted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.converted}</p>
                  <p className="text-sm text-muted-foreground">Converted</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Assigned Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {!assignments?.length ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No leads assigned yet</h3>
                <p className="text-sm text-muted-foreground">
                  Leads will appear here once they are assigned to your account.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div 
                    key={assignment.id} 
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusBadge(assignment.status)}>
                            {assignment.status}
                          </Badge>
                          <Badge variant="outline">{assignment.lead_source.replace("_leads", "")}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={assignment.status}
                          onValueChange={(value) => 
                            updateStatus.mutate({ id: assignment.id, status: value })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {assignment.partner_notes && (
                      <p className="text-sm text-muted-foreground mt-3 bg-muted/50 p-2 rounded">
                        {assignment.partner_notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
