import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function EmailAccountHealth() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: account } = useQuery({
    queryKey: ["email-account", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("email_accounts")
        .select("*")
        .eq("id", id)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const { data: healthData } = useQuery({
    queryKey: ["email-account-health", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("email_account_health")
        .select("*")
        .eq("account_id", id)
        .order("date", { ascending: false })
        .limit(30);
      return data || [];
    },
    enabled: !!id,
  });

  const latestHealth = healthData?.[0];

  const getHealthStatus = () => {
    if (!latestHealth) return "unknown";
    if (latestHealth.reputation_score >= 90 && latestHealth.bounce_rate < 2) return "excellent";
    if (latestHealth.reputation_score >= 70 && latestHealth.bounce_rate < 5) return "good";
    if (latestHealth.reputation_score >= 50 && latestHealth.bounce_rate < 10) return "warning";
    return "critical";
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="h-[72px] border-b bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20">
        <div className="container mx-auto h-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/email-settings")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
            <div className="h-8 w-px bg-border" />
            <div>
              <h1 className="text-xl font-semibold">Account Health</h1>
              <p className="text-sm text-muted-foreground">{account?.email_address}</p>
            </div>
          </div>
          <Badge
            variant={healthStatus === "excellent" ? "default" : healthStatus === "good" ? "secondary" : "destructive"}
          >
            {healthStatus.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-8 py-8 space-y-6">
        {/* Health Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Reputation Score</div>
            <div className="text-3xl font-semibold">{latestHealth?.reputation_score || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Out of 100</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Bounce Rate</div>
            <div className="text-3xl font-semibold">{latestHealth?.bounce_rate || 0}%</div>
            <div className="text-xs text-muted-foreground mt-1">Last 30 days</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Spam Rate</div>
            <div className="text-3xl font-semibold">{latestHealth?.spam_rate || 0}%</div>
            <div className="text-xs text-muted-foreground mt-1">Last 30 days</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Emails Sent</div>
            <div className="text-3xl font-semibold">{latestHealth?.emails_sent || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Today</div>
          </Card>
        </div>

        {/* Authentication Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Email Authentication</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {latestHealth?.dkim_status ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">DKIM</span>
              </div>
              <Badge variant={latestHealth?.dkim_status ? "default" : "destructive"}>
                {latestHealth?.dkim_status ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {latestHealth?.spf_status ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">SPF</span>
              </div>
              <Badge variant={latestHealth?.spf_status ? "default" : "destructive"}>
                {latestHealth?.spf_status ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {latestHealth?.dmarc_status ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">DMARC</span>
              </div>
              <Badge variant={latestHealth?.dmarc_status ? "default" : "destructive"}>
                {latestHealth?.dmarc_status ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Recommendations */}
        {healthStatus !== "excellent" && (
          <Card className="p-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2">Recommendations</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {(latestHealth?.bounce_rate || 0) > 5 && (
                    <li>• Consider removing contacts with hard bounces</li>
                  )}
                  {(latestHealth?.spam_rate || 0) > 0.5 && (
                    <li>• Review your email content and avoid spam trigger words</li>
                  )}
                  {(latestHealth?.reputation_score || 0) < 70 && (
                    <li>• Warm up your domain by gradually increasing send volume</li>
                  )}
                  {!latestHealth?.dkim_status && (
                    <li>• Set up DKIM authentication to improve deliverability</li>
                  )}
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
