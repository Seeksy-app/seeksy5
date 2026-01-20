import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calendar, DollarSign, TrendingUp, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function CreatorCampaignResponses() {
  const queryClient = useQueryClient();
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [filter, setFilter] = useState<string>("pending");

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["creator-campaign-alerts", filter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch alerts with related campaign and property data
      const { data: alertsData, error: alertsError } = await supabase
        .from("creator_campaign_alerts")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });

      if (alertsError) throw alertsError;

      // Fetch related campaign properties and campaigns
      const enrichedAlerts = await Promise.all(
        alertsData.map(async (alert) => {
          const { data: property } = await supabase
            .from("campaign_properties")
            .select("*")
            .eq("id", alert.property_id)
            .single();

          const { data: campaign } = await supabase
            .from("multi_channel_campaigns")
            .select("*")
            .eq("id", alert.multi_channel_campaign_id)
            .single();

          return {
            ...alert,
            property,
            campaign,
          };
        })
      );

      let filteredAlerts = enrichedAlerts;

      if (filter !== "all") {
        filteredAlerts = filteredAlerts.filter(
          (alert) => alert.property?.status === filter
        );
      }

      return filteredAlerts;
    },
  });

  const respondToAlertMutation = useMutation({
    mutationFn: async ({ 
      alertId, 
      propertyId, 
      status, 
      reason 
    }: { 
      alertId: string; 
      propertyId: string; 
      status: string; 
      reason?: string 
    }) => {
      // Update campaign property status
      const { error: propertyError } = await supabase
        .from("campaign_properties")
        .update({
          status,
          rejection_reason: reason,
          creator_response_date: new Date().toISOString(),
        })
        .eq("id", propertyId);

      if (propertyError) throw propertyError;

      // Mark alert as responded
      const { error: alertError } = await supabase
        .from("creator_campaign_alerts")
        .update({ responded_at: new Date().toISOString() })
        .eq("id", alertId);

      if (alertError) throw alertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-campaign-alerts"] });
      toast.success("Response submitted successfully");
      setSelectedAlert(null);
      setRejectionReason("");
    },
    onError: () => {
      toast.error("Failed to submit response");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "accepted":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Campaign Opportunities</h1>
        <p className="text-muted-foreground">
          Review and respond to campaign offers from advertisers
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Pending
        </Button>
        <Button
          variant={filter === "accepted" ? "default" : "outline"}
          onClick={() => setFilter("accepted")}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Accepted
        </Button>
        <Button
          variant={filter === "rejected" ? "default" : "outline"}
          onClick={() => setFilter("rejected")}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Rejected
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : alerts && alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const property = alert.property;
            const campaign = alert.campaign;
            
            return (
              <Card
                key={alert.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedAlert({ alert, property, campaign })}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{campaign?.campaign_name}</CardTitle>
                      <CardDescription>
                        {property?.property_name} • {property?.property_type}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(property?.status)}>
                      {property?.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-semibold">${property?.allocated_budget.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Budget</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-semibold">${property?.cpm_rate.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">CPM Rate</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-semibold">{property?.allocated_impressions.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Impressions</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(campaign?.start_date), "MMM d")} - {format(new Date(campaign?.end_date), "MMM d, yyyy")}
                  </div>
                  {property?.rejection_reason && (
                    <div className="text-sm text-destructive">
                      Rejection reason: {property.rejection_reason}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No campaign opportunities</h3>
            <p className="text-muted-foreground">
              {filter === "pending"
                ? "No pending campaigns at this time"
                : `No ${filter} campaigns`}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAlert?.campaign?.campaign_name}</DialogTitle>
            <DialogDescription>
              Review the campaign details and respond
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Campaign Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Property:</span>
                    <p className="font-medium">{selectedAlert.property?.property_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-medium">{selectedAlert.property?.property_type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Budget:</span>
                    <p className="font-medium">${selectedAlert.property?.allocated_budget?.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CPM Rate:</span>
                    <p className="font-medium">${selectedAlert.property?.cpm_rate?.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Impressions:</span>
                    <p className="font-medium">{selectedAlert.property?.allocated_impressions?.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <p className="font-medium">
                      {format(new Date(selectedAlert.campaign?.start_date), "MMM d")} -{" "}
                      {format(new Date(selectedAlert.campaign?.end_date), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>

              {selectedAlert.campaign?.description && (
                <div>
                  <h4 className="font-semibold mb-1">Campaign Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedAlert.campaign.description}</p>
                </div>
              )}

              {selectedAlert.property?.status === "pending" && (
                <>
                  <div>
                    <h4 className="font-semibold mb-2">Rejection Reason (Optional)</h4>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide a reason if rejecting..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        respondToAlertMutation.mutate({
                          alertId: selectedAlert.alert.id,
                          propertyId: selectedAlert.property?.id,
                          status: "accepted",
                        })
                      }
                      disabled={respondToAlertMutation.isPending}
                      className="flex-1"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Accept Campaign
                    </Button>
                    <Button
                      onClick={() =>
                        respondToAlertMutation.mutate({
                          alertId: selectedAlert.alert.id,
                          propertyId: selectedAlert.property?.id,
                          status: "rejected",
                          reason: rejectionReason || "No reason provided",
                        })
                      }
                      disabled={respondToAlertMutation.isPending}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Campaign
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
