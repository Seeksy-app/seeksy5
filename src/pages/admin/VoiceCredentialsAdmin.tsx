import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  Globe,
  TrendingUp,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function VoiceCredentialsAdmin() {
  // Fetch all admin notifications
  const { data: notifications, refetch: refetchNotifications } = useQuery({
    queryKey: ["voice-admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voice_admin_notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch all proposals for admin view
  const { data: allProposals } = useQuery({
    queryKey: ["all-voice-proposals-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voice_licensing_proposals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch unauthorized detections
  const { data: unauthorizedUsage } = useQuery({
    queryKey: ["unauthorized-voice-usage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voice_social_detections")
        .select("*")
        .eq("is_authorized", false)
        .order("detected_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("voice_admin_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId);

    if (error) {
      toast.error("Failed to mark as read");
      return;
    }

    refetchNotifications();
  };

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;
  const pendingProposals = allProposals?.filter((p) => p.status === "pending").length || 0;
  const unauthorizedCount = unauthorizedUsage?.length || 0;
  const totalRevenue = allProposals
    ?.filter((p) => p.status === "accepted")
    .reduce((sum, p) => sum + Number(p.proposed_price), 0) || 0;

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      info: "secondary",
      warning: "outline",
      urgent: "destructive",
    };
    return <Badge variant={variants[severity] || "secondary"}>{severity}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Voice Credentials Admin</h1>
        <p className="text-muted-foreground">
          Monitor voice licensing, proposals, and platform-wide voice usage
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unread Alerts</p>
              <p className="text-3xl font-bold">{unreadCount}</p>
            </div>
            <Bell className="h-8 w-8 text-amber-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Proposals</p>
              <p className="text-3xl font-bold">{pendingProposals}</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unauthorized Usage</p>
              <p className="text-3xl font-bold">{unauthorizedCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notifications">
        <TabsList className="mb-6">
          <TabsTrigger value="notifications">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="proposals">All Proposals</TabsTrigger>
          <TabsTrigger value="unauthorized">Unauthorized Usage</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="space-y-4">
            {notifications?.map((notification) => (
              <Card key={notification.id} className={`p-6 ${!notification.is_read ? "border-primary" : ""}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {notification.severity === "urgent" ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Bell className="h-5 w-5 text-primary" />
                    )}
                    <div>
                      <h3 className="font-semibold">{notification.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(notification.created_at), "MMM dd, yyyy h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(notification.severity)}
                    {!notification.is_read && <Badge variant="default">New</Badge>}
                  </div>
                </div>

                <p className="text-sm mb-4">{notification.message}</p>

                {!notification.is_read && (
                  <Button size="sm" variant="outline" onClick={() => markAsRead(notification.id)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Read
                  </Button>
                )}
              </Card>
            ))}
            {notifications?.length === 0 && (
              <Card className="p-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                <p className="text-muted-foreground">Voice-related alerts will appear here</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposals">
          <div className="space-y-4">
            {allProposals?.map((proposal) => (
              <Card key={proposal.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{proposal.advertiser_company || proposal.advertiser_name}</h3>
                    <p className="text-sm text-muted-foreground">{proposal.advertiser_email}</p>
                  </div>
                  <Badge variant={proposal.status === "pending" ? "secondary" : "default"}>
                    {proposal.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Proposed Price</p>
                    <p className="text-xl font-bold">${proposal.proposed_price}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Creator ID</p>
                    <p className="font-mono text-sm">{proposal.creator_id.slice(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-sm">{format(new Date(proposal.created_at), "MMM dd, yyyy")}</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{proposal.usage_description}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Unauthorized Usage Tab */}
        <TabsContent value="unauthorized">
          <div className="space-y-4">
            {unauthorizedUsage?.map((detection) => (
              <Card key={detection.id} className="p-6 border-red-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-red-500" />
                    <div>
                      <h3 className="text-lg font-semibold capitalize">{detection.platform}</h3>
                      <p className="text-sm text-muted-foreground">
                        Detected {format(new Date(detection.detected_at), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive">Unauthorized</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <p className="font-medium">{detection.confidence_score}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{detection.verification_status}</p>
                  </div>
                </div>
              </Card>
            ))}
            {unauthorizedUsage?.length === 0 && (
              <Card className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Unauthorized Usage</h3>
                <p className="text-muted-foreground">All detected voice usage is authorized</p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
