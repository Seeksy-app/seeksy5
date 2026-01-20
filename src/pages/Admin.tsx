import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  MessageSquare,
  Target,
  UserCheck,
  Loader2,
  Shield
} from "lucide-react";
import { SecurityAlertsPanel } from "@/components/admin/SecurityAlertsPanel";
import { TodaysTasks } from "@/components/admin/TodaysTasks";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface DashboardStats {
  openTickets: number;
  pendingMeetings: number;
  activeContacts: number;
  monthlyRevenue: number;
  recentActivity: Activity[];
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    openTickets: 0,
    pendingMeetings: 0,
    activeContacts: 0,
    monthlyRevenue: 0,
    recentActivity: [],
  });

  useEffect(() => {
    // Admin accounts always stay on /admin
    const checkRedirect = () => {
    };
    
    checkRedirect();
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasAdminRole = roles?.some(r => 
      r.role === "admin" || 
      r.role === "super_admin" || 
      r.role === "manager"
    );
    
    if (!hasAdminRole) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/dashboard");
      return;
    }

    setHasAdminAccess(true);
    await fetchDashboardStats();
    setLoading(false);
  };

  const fetchDashboardStats = async () => {
    try {
      // Fetch open tickets (tasks with status 'open' or 'in_progress')
      const { count: ticketCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]);

      // Fetch pending meetings (upcoming meetings)
      const { count: meetingCount } = await supabase
        .from("meetings")
        .select("*", { count: "exact", head: true })
        .gte("start_time", new Date().toISOString());

      // Fetch active contacts (contacts created in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: contactCount } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Fetch recent activity
      const { data: activityData } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      const activities: Activity[] = activityData?.map(log => ({
        id: log.id,
        type: log.action_type,
        description: log.action_description,
        timestamp: log.created_at,
      })) || [];

      setStats({
        openTickets: ticketCount || 0,
        pendingMeetings: meetingCount || 0,
        activeContacts: contactCount || 0,
        monthlyRevenue: 0, // To be calculated from actual revenue data
        recentActivity: activities,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!hasAdminAccess) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor platform activity and manage operations
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTickets}</div>
            <p className="text-xs text-muted-foreground">
              <Link to="/admin/support" className="text-primary hover:underline">
                View all tickets →
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingMeetings}</div>
            <p className="text-xs text-muted-foreground">
              <Link to="/meetings" className="text-primary hover:underline">
                View calendar →
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeContacts}</div>
            <p className="text-xs text-muted-foreground">
              <Link to="/crm" className="text-primary hover:underline">
                View contacts →
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (MTD)</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <Link to="/cfo-dashboard" className="text-primary hover:underline">
                View financials →
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tasks */}
      <TodaysTasks />

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link 
              to="/admin/support" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">View Support Tickets</p>
                <p className="text-sm text-muted-foreground">Manage customer requests</p>
              </div>
            </Link>
            
            <Link 
              to="/admin/sales" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Sales Pipeline</p>
                <p className="text-sm text-muted-foreground">Track leads and deals</p>
              </div>
            </Link>
            
            <Link 
              to="/crm" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Manage Contacts</p>
                <p className="text-sm text-muted-foreground">View all CRM contacts</p>
              </div>
            </Link>
            
            <Link 
              to="/marketing" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Marketing Campaigns</p>
                <p className="text-sm text-muted-foreground">Create and manage campaigns</p>
              </div>
            </Link>

            <Link 
              to="/admin/impersonate" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <UserCheck className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Impersonate User</p>
                <p className="text-sm text-muted-foreground">View as another user</p>
              </div>
            </Link>
            
            <Link 
              to="/admin/keys-vault" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Keys Vault</p>
                <p className="text-sm text-muted-foreground">Manage API keys securely</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and actions</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                No recent activity
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      <SecurityAlertsPanel />

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Platform health and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Database</p>
                <p className="text-sm text-muted-foreground">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">API Services</p>
                <p className="text-sm text-muted-foreground">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Storage</p>
                <p className="text-sm text-muted-foreground">Operational</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
