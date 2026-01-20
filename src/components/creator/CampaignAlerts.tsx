import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function CampaignAlerts() {
  const queryClient = useQueryClient();
  const [counterBids, setCounterBids] = useState<{ [key: string]: string }>({});

  const { data: alerts } = useQuery({
    queryKey: ["creator-campaign-alerts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("creator_campaign_alerts")
        .select(`
          *,
          campaign:multi_channel_campaigns(
            campaign_name,
            impression_goal,
            total_budget,
            start_date,
            end_date,
            advertiser:advertisers(company_name)
          ),
          property:campaign_properties(
            allocated_impressions,
            allocated_budget,
            cpm_rate
          )
        `)
        .eq("creator_id", user.id)
        .is("response", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({
      alertId,
      response,
      counterBid,
    }: {
      alertId: string;
      response: string;
      counterBid?: number;
    }) => {
      // Update alert
      const { error: alertError } = await supabase
        .from("creator_campaign_alerts")
        .update({
          response,
          responded_at: new Date().toISOString(),
          counter_bid_amount: counterBid,
        })
        .eq("id", alertId);

      if (alertError) throw alertError;

      // Update campaign property status
      const alert = alerts?.find((a) => a.id === alertId);
      if (alert) {
        const newStatus = response === "accepted" ? "approved" : "rejected";
        const { error: propError } = await supabase
          .from("campaign_properties")
          .update({
            status: newStatus,
            creator_response_date: new Date().toISOString(),
          })
          .eq("multi_channel_campaign_id", alert.multi_channel_campaign_id)
          .eq("property_id", alert.property_id);

        if (propError) throw propError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["creator-campaign-alerts"] });
      const action = variables.response === "accepted" ? "accepted" : "rejected";
      toast.success(`Campaign ${action} successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to respond: ${error.message}`);
    },
  });

  if (!alerts || alerts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No campaign invitations</h3>
          <p className="text-muted-foreground">
            You'll see campaign invitations from advertisers here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Campaign Invitations</h2>
        <Badge>{alerts.length}</Badge>
      </div>

      {alerts.map((alert) => (
        <Card key={alert.id} className="border-l-4 border-l-yellow-500">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{alert.campaign?.campaign_name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {alert.campaign?.advertiser?.company_name}
                </p>
              </div>
              <Badge variant="outline">{alert.property_type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Impressions</p>
                <p className="text-lg font-semibold">
                  {Array.isArray(alert.property) && alert.property[0]?.allocated_impressions 
                    ? alert.property[0].allocated_impressions.toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Earnings</p>
                <p className="text-lg font-semibold text-green-600">
                  ${Array.isArray(alert.property) && alert.property[0]?.allocated_budget
                    ? (alert.property[0].allocated_budget * 0.7).toFixed(2)
                    : "0.00"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPM Rate</p>
                <p className="text-lg font-semibold">
                  ${Array.isArray(alert.property) && alert.property[0]?.cpm_rate
                    ? alert.property[0].cpm_rate
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-sm">
                  {new Date(alert.campaign?.start_date).toLocaleDateString()} -{" "}
                  {new Date(alert.campaign?.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {alert.alert_type === "bid_request" && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Counter Bid (Optional)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Your CPM rate"
                    value={counterBids[alert.id] || ""}
                    onChange={(e) =>
                      setCounterBids({ ...counterBids, [alert.id]: e.target.value })
                    }
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      respondMutation.mutate({
                        alertId: alert.id,
                        response: "counter_bid",
                        counterBid: parseFloat(counterBids[alert.id]),
                      })
                    }
                    disabled={!counterBids[alert.id]}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Counter Bid
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  respondMutation.mutate({
                    alertId: alert.id,
                    response: "rejected",
                  })
                }
                disabled={respondMutation.isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Decline
              </Button>
              <Button
                onClick={() =>
                  respondMutation.mutate({
                    alertId: alert.id,
                    response: "accepted",
                  })
                }
                disabled={respondMutation.isPending}
              >
                <Check className="w-4 h-4 mr-2" />
                Accept Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
