import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Settings, Shield, Zap, Copy, Check, AlertTriangle, 
  RefreshCw, Clock, ChevronRight, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { BackButton } from "@/components/navigation/BackButton";

interface LeadSource {
  id: string;
  workspace_id: string;
  provider: string;
  is_active: boolean;
  contact_level_enabled: boolean;
  include_contact_in_ai: boolean;
  privacy_notice_acknowledged_at: string | null;
  webhook_health: {
    last_received_at?: string;
    last_event_type?: string;
    last_error?: string;
  };
  retention_days: number;
  provider_account_id: string | null;
}

export default function LeadIntelligenceSettings() {
  const queryClient = useQueryClient();
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [pendingContactToggle, setPendingContactToggle] = useState<string | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const webhookUrl = `${supabaseUrl}/functions/v1/opensend-webhook`;

  // Fetch lead sources
  const { data: leadSources, isLoading } = useQuery({
    queryKey: ["lead-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_sources")
        .select("*")
        .order("provider");
      if (error) throw error;
      return (data || []) as LeadSource[];
    },
  });

  // Test OpenSend API key
  const testApiMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${supabaseUrl}/functions/v1/opensend-auth-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({}),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("OpenSend API key validated successfully");
        queryClient.invalidateQueries({ queryKey: ["lead-sources"] });
      } else {
        toast.error(data.error || "API key validation failed");
      }
    },
    onError: () => {
      toast.error("Failed to test API key");
    },
  });

  // Update lead source settings
  const updateSourceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LeadSource> }) => {
      const { error } = await supabase
        .from("lead_sources")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-sources"] });
      toast.success("Settings updated");
    },
    onError: () => {
      toast.error("Failed to update settings");
    },
  });

  const handleCopyWebhook = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    toast.success("Webhook URL copied to clipboard");
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleContactLevelToggle = (sourceId: string, currentValue: boolean) => {
    if (!currentValue) {
      // Turning ON - show privacy dialog
      setPendingContactToggle(sourceId);
      setShowPrivacyDialog(true);
    } else {
      // Turning OFF - no confirmation needed
      updateSourceMutation.mutate({
        id: sourceId,
        updates: { 
          contact_level_enabled: false,
          include_contact_in_ai: false, // Also disable AI access
        },
      });
    }
  };

  const confirmPrivacyAcknowledgment = () => {
    if (pendingContactToggle) {
      updateSourceMutation.mutate({
        id: pendingContactToggle,
        updates: {
          contact_level_enabled: true,
          privacy_notice_acknowledged_at: new Date().toISOString(),
        },
      });
    }
    setShowPrivacyDialog(false);
    setPendingContactToggle(null);
  };

  const opensendSource = leadSources?.find(s => s.provider === "opensend");
  const warmlySource = leadSources?.find(s => s.provider === "warmly");

  const getWebhookHealthStatus = (health: LeadSource["webhook_health"]) => {
    if (!health?.last_received_at) {
      return { status: "pending", label: "Awaiting first event" };
    }
    const lastReceived = new Date(health.last_received_at);
    const hoursSince = (Date.now() - lastReceived.getTime()) / (1000 * 60 * 60);
    
    if (health.last_error) {
      return { status: "error", label: "Error" };
    }
    if (hoursSince > 24) {
      return { status: "warning", label: "No recent events" };
    }
    return { status: "healthy", label: "Healthy" };
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <BackButton fallbackPath="/admin/lead-intelligence" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lead Intelligence Settings</h1>
          <p className="text-muted-foreground">Configure providers and privacy settings</p>
        </div>
      </div>

      {/* Providers Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Providers
        </h2>

        {/* OpenSend Provider Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">OpenSend</CardTitle>
                  <CardDescription>Contact-level visitor identification</CardDescription>
                </div>
              </div>
              <Badge variant={opensendSource?.is_active ? "default" : "secondary"}>
                {opensendSource?.is_active ? "Connected" : "Not Connected"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API Key Test */}
            <div className="space-y-2">
              <Label>API Key Status</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testApiMutation.mutate()}
                  disabled={testApiMutation.isPending}
                >
                  {testApiMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Test API Key
                </Button>
                {opensendSource?.provider_account_id && (
                  <span className="text-sm text-muted-foreground">
                    Account: {opensendSource.provider_account_id}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                API key is configured via Cloud secrets (OPENSEND_API_KEY)
              </p>
            </div>

            <Separator />

            {/* Webhook URL */}
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={webhookUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyWebhook}
                >
                  {copiedWebhook ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add this URL in your OpenSend dashboard under Webhooks → Custom Webhook
              </p>
            </div>

            {/* Webhook Health */}
            {opensendSource && (
              <div className="space-y-2">
                <Label>Webhook Health</Label>
                <div className="flex items-center gap-4 text-sm">
                  {(() => {
                    const health = getWebhookHealthStatus(opensendSource.webhook_health);
                    return (
                      <>
                        <Badge 
                          variant="outline" 
                          className={
                            health.status === "healthy" 
                              ? "bg-green-50 text-green-700 border-green-200" 
                              : health.status === "error"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : health.status === "warning"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }
                        >
                          {health.label}
                        </Badge>
                        {opensendSource.webhook_health?.last_received_at && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Last: {new Date(opensendSource.webhook_health.last_received_at).toLocaleString()}
                          </span>
                        )}
                        {opensendSource.webhook_health?.last_event_type && (
                          <span className="text-muted-foreground">
                            Type: {opensendSource.webhook_health.last_event_type}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            <Separator />

            {/* Privacy Settings */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy Settings
              </h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable contact-level identification</Label>
                  <p className="text-xs text-muted-foreground">
                    Store email and phone for resolved visitors (admin-only access)
                  </p>
                </div>
                <Switch
                  checked={opensendSource?.contact_level_enabled || false}
                  onCheckedChange={() => 
                    opensendSource && handleContactLevelToggle(
                      opensendSource.id, 
                      opensendSource.contact_level_enabled
                    )
                  }
                />
              </div>

              {opensendSource?.contact_level_enabled && (
                <div className="flex items-center justify-between pl-6 border-l-2 border-muted">
                  <div className="space-y-0.5">
                    <Label>Allow AI to reference limited contact context</Label>
                    <p className="text-xs text-muted-foreground">
                      AI may use email domain (e.g., @company.com) for outreach drafts
                    </p>
                  </div>
                  <Switch
                    checked={opensendSource?.include_contact_in_ai || false}
                    onCheckedChange={(checked) =>
                      updateSourceMutation.mutate({
                        id: opensendSource.id,
                        updates: { include_contact_in_ai: checked },
                      })
                    }
                  />
                </div>
              )}

              {opensendSource?.privacy_notice_acknowledged_at && (
                <p className="text-xs text-muted-foreground">
                  Privacy notice acknowledged on{" "}
                  {new Date(opensendSource.privacy_notice_acknowledged_at).toLocaleDateString()}
                </p>
              )}
            </div>

            <Separator />

            {/* Retention */}
            <div className="space-y-2">
              <Label>Data Retention (days)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={opensendSource?.retention_days || 90}
                  onChange={(e) =>
                    opensendSource &&
                    updateSourceMutation.mutate({
                      id: opensendSource.id,
                      updates: { retention_days: parseInt(e.target.value) || 90 },
                    })
                  }
                  className="w-24"
                  min={7}
                  max={365}
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warmly Provider Card (existing, read-only view) */}
        <Card className="opacity-75">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Warmly</CardTitle>
                  <CardDescription>Company-level visitor identification</CardDescription>
                </div>
              </div>
              <Badge variant={warmlySource?.is_active ? "default" : "secondary"}>
                {warmlySource?.is_active ? "Connected" : "Not Connected"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Warmly integration is configured separately. 
              <Button variant="link" className="h-auto p-0 ml-1">
                View documentation <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Privacy Notice Info */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900">Privacy Notice</p>
              <p className="text-sm text-amber-800">
                Contact-level identification is optional. Enable only if you have the right 
                to use it and comply with applicable privacy laws. AI never receives personal 
                contact details unless you explicitly enable limited contact context.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Confirmation Dialog */}
      <AlertDialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable Contact-Level Identification?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                When enabled, OpenSend will store email addresses and phone numbers 
                for resolved visitors. This data will only be visible to admins.
              </p>
              <p className="font-medium">
                By enabling this feature, you confirm that:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>You have the right to use contact-level identification</li>
                <li>You will comply with applicable privacy laws (GDPR, CCPA, etc.)</li>
                <li>You understand that contact data is stored securely and accessible only to admins</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingContactToggle(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmPrivacyAcknowledgment}>
              I Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
