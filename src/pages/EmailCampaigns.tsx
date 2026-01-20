import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CampaignBuilder } from "@/components/email/CampaignBuilder";
import { Mail, TrendingUp, MousePointerClick, AlertCircle, Eye } from "lucide-react";
import { format } from "date-fns";

export default function EmailCampaigns() {
  const navigate = useNavigate();
  
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ["email-campaigns", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("email_campaigns")
        .select("id, subject, status, created_at, total_sent, total_opened, total_clicked, total_bounced")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const calculateRate = (count: number, total: number) => {
    return total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Mail className="h-8 w-8 text-primary" />
          Email Campaigns
        </h1>
        <p className="text-muted-foreground">
          Create and track email campaigns with full analytics
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CampaignBuilder />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns && campaigns.length > 0 ? (
                <div className="space-y-3">
                  {campaigns.map((campaign) => {
                    const openRate = calculateRate(campaign.total_opened || 0, campaign.total_sent || 0);
                    const clickRate = calculateRate(campaign.total_clicked || 0, campaign.total_sent || 0);
                    
                    return (
                      <div
                        key={campaign.id}
                        className="p-4 border rounded-lg space-y-2 cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => navigate(`/email-campaigns/${campaign.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{campaign.subject}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(campaign.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                          <Badge variant={campaign.status === "sent" ? "default" : "secondary"}>
                            {campaign.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 pt-2">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                              <Mail className="h-3 w-3" />
                            </div>
                            <p className="text-lg font-semibold">{campaign.total_sent || 0}</p>
                            <p className="text-xs text-muted-foreground">Sent</p>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                              <TrendingUp className="h-3 w-3" />
                            </div>
                            <p className="text-lg font-semibold">{openRate}%</p>
                            <p className="text-xs text-muted-foreground">Opened</p>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                              <MousePointerClick className="h-3 w-3" />
                            </div>
                            <p className="text-lg font-semibold">{clickRate}%</p>
                            <p className="text-xs text-muted-foreground">Clicked</p>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                              <AlertCircle className="h-3 w-3" />
                            </div>
                            <p className="text-lg font-semibold">{campaign.total_bounced || 0}</p>
                            <p className="text-xs text-muted-foreground">Bounced</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No campaigns yet. Create your first campaign above!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
