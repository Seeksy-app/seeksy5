import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SubscriberListManager } from "@/components/email/SubscriberListManager";
import { SignatureAnalytics } from "@/components/signatures/SignatureAnalytics";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Users, 
  FileSignature, 
  BarChart3, 
  Gauge, 
  ArrowLeft, 
  CheckCircle, 
  Star, 
  Unlink, 
  Shield, 
  Plus,
  RefreshCw,
  Save,
  TrendingUp
} from "lucide-react";
import { GoogleVerifiedBadge } from "@/components/ui/google-verified-badge";
import { useNavigate, useLocation } from "react-router-dom";
import gmailIcon from "@/assets/gmail-icon.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function EmailSettings() {
  const [activeTab, setActiveTab] = useState("accounts");
  const [connecting, setConnecting] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState<string>("none");
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedAccountEmail, setSelectedAccountEmail] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch connected email accounts
  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ["email-accounts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("email_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch email signatures (full data for analytics)
  const { data: signatures = [] } = useQuery({
    queryKey: ["email-signatures-full", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data } = await supabase
        .from("email_signatures")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      return data || [];
    },
    enabled: !!user,
  });

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const success = params.get("success");
    const error = params.get("error");

    if (success === "gmail_connected") {
      toast({ title: "Gmail account connected successfully!" });
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] });
      window.history.replaceState({}, "", "/email-settings");
    } else if (error) {
      toast({
        title: error === "oauth_failed" ? "Gmail connection was cancelled" : "Failed to connect Gmail account",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/email-settings");
    }
  }, [location.search, queryClient, toast]);

  const connectGmail = async () => {
    if (!user) {
      toast({ title: "Please log in to connect Gmail", variant: "destructive" });
      return;
    }
    
    setConnecting(true);
    try {
      const response = await supabase.functions.invoke('gmail-auth');
      const { data, error } = response;
      
      if (error) throw error;
      if (!data?.authUrl) throw new Error('No auth URL returned');

      window.location.href = data.authUrl;
    } catch (error) {
      toast({
        title: "Failed to connect Gmail",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
      setConnecting(false);
    }
  };

  const setDefaultAccount = useMutation({
    mutationFn: async (accountId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      // Unset all defaults first
      await supabase
        .from("email_accounts")
        .update({ is_default: false })
        .eq("user_id", user.id);
      
      // Set new default
      const { error } = await supabase
        .from("email_accounts")
        .update({ is_default: true })
        .eq("id", accountId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] });
      toast({ title: "Default email account updated" });
    },
    onError: () => {
      toast({ title: "Failed to set default account", variant: "destructive" });
    },
  });

  const disconnectAccount = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from("email_accounts")
        .delete()
        .eq("id", accountId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] });
      toast({ title: "Email account disconnected" });
    },
    onError: () => {
      toast({ title: "Failed to disconnect account", variant: "destructive" });
    },
  });

  const syncGmail = async () => {
    toast({ title: "Syncing...", description: "Fetching latest emails from Gmail" });
    
    try {
      const [inboxResult] = await Promise.all([
        supabase.functions.invoke("sync-gmail-inbox"),
        supabase.functions.invoke("sync-gmail-replies"),
      ]);
      
      queryClient.invalidateQueries({ queryKey: ["email-events"] });
      
      const newEmails = inboxResult.data?.newEmails || 0;
      toast({
        title: "Sync complete",
        description: newEmails > 0 ? `Synced ${newEmails} new emails` : "Your emails are up to date",
      });
    } catch (error) {
      toast({ title: "Sync failed", description: "Could not sync emails", variant: "destructive" });
    }
  };

  const openPermissions = (email: string) => {
    setSelectedAccountEmail(email);
    setPermissionsDialogOpen(true);
  };

  // Initialize selected signature from active signature
  useEffect(() => {
    const activeSignature = signatures.find(s => s.is_active);
    if (activeSignature) {
      setSelectedSignature(activeSignature.id);
    }
  }, [signatures]);

  const saveDefaultSignature = useMutation({
    mutationFn: async (signatureId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      // Deactivate all signatures first
      await supabase
        .from("email_signatures")
        .update({ is_active: false })
        .eq("user_id", user.id);
      
      // Activate the selected one if not "none"
      if (signatureId !== "none") {
        const { error } = await supabase
          .from("email_signatures")
          .update({ is_active: true })
          .eq("id", signatureId);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-signatures-list"] });
      toast({ title: "Default signature saved" });
    },
    onError: () => {
      toast({ title: "Failed to save default signature", variant: "destructive" });
    },
  });

  const hasAccounts = accounts.length > 0;

  return (
    <>
      <Helmet>
        <title>Email Accounts | Seeksy</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-[1200px] mx-auto px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[28px] font-semibold text-foreground">Email Accounts</h1>
              <p className="text-[15px] text-muted-foreground mt-1">
                Connect and manage the email addresses you send from in Seeksy
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate(location.pathname.startsWith('/admin') ? "/admin/email-client" : "/email")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inbox
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white p-1 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] h-auto flex-wrap">
              <TabsTrigger 
                value="accounts" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1e3a8a] data-[state=active]:to-[#1e40af] data-[state=active]:text-white px-5 py-2.5 rounded-lg"
              >
                <Mail className="h-4 w-4 mr-2" />
                Accounts
              </TabsTrigger>
              <TabsTrigger 
                value="subscribers"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1e3a8a] data-[state=active]:to-[#1e40af] data-[state=active]:text-white px-5 py-2.5 rounded-lg"
              >
                <Users className="h-4 w-4 mr-2" />
                Subscriber Lists
              </TabsTrigger>
              <TabsTrigger 
                value="signatures"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1e3a8a] data-[state=active]:to-[#1e40af] data-[state=active]:text-white px-5 py-2.5 rounded-lg"
              >
                <FileSignature className="h-4 w-4 mr-2" />
                Signatures
              </TabsTrigger>
              <TabsTrigger 
                value="tracking"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1e3a8a] data-[state=active]:to-[#1e40af] data-[state=active]:text-white px-5 py-2.5 rounded-lg"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Tracking
              </TabsTrigger>
              <TabsTrigger 
                value="analytics"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1e3a8a] data-[state=active]:to-[#1e40af] data-[state=active]:text-white px-5 py-2.5 rounded-lg"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="deliverability"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1e3a8a] data-[state=active]:to-[#1e40af] data-[state=active]:text-white px-5 py-2.5 rounded-lg opacity-60"
                disabled
              >
                <Gauge className="h-4 w-4 mr-2" />
                Deliverability
                <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">Soon</Badge>
              </TabsTrigger>
            </TabsList>

            {/* Accounts Tab */}
            <TabsContent value="accounts" className="mt-6 space-y-6">
              {/* Connect Gmail CTA - Only show if no accounts OR as smaller button if accounts exist */}
              {!hasAccounts ? (
                <Card className="border-dashed border-2">
                  <CardContent className="py-8 flex flex-col items-center text-center">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-4">
                      <img src={gmailIcon} alt="Gmail" className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Connect a Gmail Account</h3>
                    <p className="text-muted-foreground text-sm mb-4 max-w-md">
                      Securely connect your Gmail account to send and receive emails directly from Seeksy.
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      <GoogleVerifiedBadge variant="pill" />
                    </div>
                    <Button onClick={connectGmail} disabled={connecting} size="lg">
                      <img src={gmailIcon} alt="Gmail" className="h-4 w-4 mr-2" />
                      {connecting ? "Connecting..." : "Connect Gmail"}
                    </Button>
                  </CardContent>
                </Card>
              ) : null}

              {/* Connected Email Accounts List */}
              {loadingAccounts ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Loading accounts...
                  </CardContent>
                </Card>
              ) : hasAccounts ? (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Connected Email Accounts</CardTitle>
                        <CardDescription>Manage your connected Gmail accounts</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={syncGmail}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync All
                        </Button>
                        <Button variant="outline" size="sm" onClick={connectGmail} disabled={connecting}>
                          <Plus className="h-4 w-4 mr-2" />
                          {connecting ? "Connecting..." : "Add Account"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border shadow-sm overflow-hidden">
                            <img src={gmailIcon} alt="Gmail" className="h-5 w-5 object-contain" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{account.email_address}</p>
                              {account.is_default && (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">
                                  Default
                                </Badge>
                              )}
                              <GoogleVerifiedBadge variant="inline" className="scale-90" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {account.display_name || "Connected"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!account.is_default && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDefaultAccount.mutate(account.id)}
                              disabled={setDefaultAccount.isPending}
                            >
                              <Star className="h-4 w-4 mr-1" />
                              Set Default
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openPermissions(account.email_address)}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Permissions
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => disconnectAccount.mutate(account.id)}
                            disabled={disconnectAccount.isPending}
                          >
                            <Unlink className="h-4 w-4 mr-1" />
                            Disconnect
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              {/* Gmail Benefits - Always visible */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">
                    What Connecting Gmail Enables
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm">Send emails from your own address</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm">Receive replies in Seeksy inbox</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm">Track email opens and clicks</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscriber Lists Tab */}
            <TabsContent value="subscribers" className="mt-6">
              <SubscriberListManager />
            </TabsContent>

            {/* Signatures Tab */}
            <TabsContent value="signatures" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSignature className="h-5 w-5" />
                    Default Signature
                  </CardTitle>
                  <CardDescription>
                    Choose a default signature for your outgoing emails
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Signature</Label>
                    <div className="flex items-center gap-2">
                      <Select value={selectedSignature} onValueChange={setSelectedSignature}>
                        <SelectTrigger className="w-full max-w-xs">
                          <SelectValue placeholder="Select a signature" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No signature</SelectItem>
                          {signatures.map((sig) => (
                            <SelectItem key={sig.id} value={sig.id}>
                              {sig.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm"
                        onClick={() => saveDefaultSignature.mutate(selectedSignature)}
                        disabled={saveDefaultSignature.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saveDefaultSignature.isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This signature will be added to all outgoing emails
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/signatures')}>
                    Manage Signatures
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tracking Tab */}
            <TabsContent value="tracking" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Email Tracking
                  </CardTitle>
                  <CardDescription>
                    Track opens and clicks on your outgoing emails
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Track Email Opens</Label>
                      <p className="text-xs text-muted-foreground">
                        Know when recipients open your emails
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Track Link Clicks</Label>
                      <p className="text-xs text-muted-foreground">
                        Know when recipients click links in your emails
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-6">
              <SignatureAnalytics signatures={signatures} />
            </TabsContent>

            {/* Deliverability Tab - Placeholder */}
            <TabsContent value="deliverability" className="mt-6">
              <Card>
                <CardContent className="py-12 text-center">
                  <Gauge className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Deliverability Insights</h3>
                  <p className="text-muted-foreground">Coming soon</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gmail Permissions</DialogTitle>
            <DialogDescription>
              Permissions granted for {selectedAccountEmail}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Read Emails</p>
                <p className="text-xs text-muted-foreground">View and sync your inbox messages</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Send Emails</p>
                <p className="text-xs text-muted-foreground">Send emails on your behalf</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Manage Labels</p>
                <p className="text-xs text-muted-foreground">Organize emails with labels</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
