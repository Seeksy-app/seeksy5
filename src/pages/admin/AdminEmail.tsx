import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FloatingEmailComposer } from "@/components/email/client/FloatingEmailComposer";
import { SendTestEmailDialog } from "@/components/admin/email/SendTestEmailDialog";
import { 
  Mail, Send, Inbox, FileText, BarChart3, 
  Eye, MousePointer, RefreshCw, ExternalLink, PenTool, Plus, Trash2, Edit, SendHorizontal
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminEmail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [composerOpen, setComposerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [editingSignature, setEditingSignature] = useState<any>(null);
  const [signatureForm, setSignatureForm] = useState({
    name: "",
    profile_name: "",
    profile_title: "",
    company_name: "",
    company_phone: "",
    html_signature: "",
  });

  const { data: user } = useQuery({
    queryKey: ["admin-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch email stats for last 30 days
  const { data: emailStats } = useQuery({
    queryKey: ["admin-email-stats"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: events } = await supabase
        .from("email_events")
        .select("event_type")
        .gte("created_at", thirtyDaysAgo);

      const stats = { sent: 0, delivered: 0, opened: 0, clicked: 0 };
      
      events?.forEach(e => {
        if (e.event_type === "email.sent") stats.sent++;
        if (e.event_type === "email.delivered") stats.delivered++;
        if (e.event_type === "email.opened") stats.opened++;
        if (e.event_type === "email.clicked") stats.clicked++;
      });

      return stats;
    },
  });

  // Fetch recent emails
  const { data: recentEmails = [], refetch: refetchEmails } = useQuery({
    queryKey: ["admin-recent-emails"],
    queryFn: async () => {
      const { data } = await supabase
        .from("email_events")
        .select("*")
        .eq("event_type", "email.sent")
        .order("created_at", { ascending: false })
        .limit(50);
      
      return data || [];
    },
  });

  // Fetch email campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ["admin-email-campaigns"],
    queryFn: async () => {
      const { data } = await supabase
        .from("email_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      
      return data || [];
    },
  });

  // Fetch admin signatures (role = 'admin')
  const { data: signatures = [], refetch: refetchSignatures } = useQuery({
    queryKey: ["admin-email-signatures"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data } = await supabase
        .from("email_signatures")
        .select("*")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .order("created_at", { ascending: false });
      
      return data || [];
    },
  });

  const syncInbox = async () => {
    setIsSyncing(true);
    try {
      await supabase.functions.invoke("sync-gmail-inbox");
      await refetchEmails();
    } catch (error) {
      console.error("Error syncing inbox:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const openSignatureModal = (signature?: any) => {
    if (signature) {
      setEditingSignature(signature);
      setSignatureForm({
        name: signature.name || "",
        profile_name: signature.profile_name || "",
        profile_title: signature.profile_title || "",
        company_name: signature.company_name || "",
        company_phone: signature.company_phone || "",
        html_signature: signature.html_signature || "",
      });
    } else {
      setEditingSignature(null);
      setSignatureForm({
        name: "",
        profile_name: "",
        profile_title: "",
        company_name: "",
        company_phone: "",
        html_signature: "",
      });
    }
    setSignatureModalOpen(true);
  };

  const saveSignature = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingSignature) {
        await supabase
          .from("email_signatures")
          .update(signatureForm)
          .eq("id", editingSignature.id);
      } else {
        await supabase
          .from("email_signatures")
          .insert({
            ...signatureForm,
            user_id: user.id,
            role: "admin", // Mark as admin signature
          });
      }

      toast({ title: editingSignature ? "Signature updated" : "Signature created" });
      setSignatureModalOpen(false);
      refetchSignatures();
    } catch (error: any) {
      toast({ title: "Error saving signature", description: error.message, variant: "destructive" });
    }
  };

  const deleteSignature = async (id: string) => {
    if (!confirm("Delete this signature?")) return;
    try {
      await supabase.from("email_signatures").delete().eq("id", id);
      toast({ title: "Signature deleted" });
      refetchSignatures();
    } catch (error: any) {
      toast({ title: "Error deleting signature", description: error.message, variant: "destructive" });
    }
  };

  const openRate = emailStats && emailStats.delivered > 0 
    ? ((emailStats.opened / emailStats.delivered) * 100).toFixed(1) 
    : "0";
  
  const clickRate = emailStats && emailStats.opened > 0 
    ? ((emailStats.clicked / emailStats.opened) * 100).toFixed(1) 
    : "0";

  const getStatusBadge = (eventType: string) => {
    const type = eventType.replace("email.", "");
    switch (type) {
      case "sent": return <Badge variant="secondary">Sent</Badge>;
      case "delivered": return <Badge className="bg-blue-100 text-blue-700">Delivered</Badge>;
      case "opened": return <Badge className="bg-emerald-100 text-emerald-700">Opened</Badge>;
      case "clicked": return <Badge className="bg-purple-100 text-purple-700">Clicked</Badge>;
      case "bounced": return <Badge variant="destructive">Bounced</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Suite</h1>
          <p className="text-slate-500">Send, receive, and track all platform emails</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={syncInbox}
            disabled={isSyncing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Inbox
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTestEmailOpen(true)}>
            <SendHorizontal className="w-4 h-4 mr-2" />
            Send Test
          </Button>
          <Button onClick={() => setComposerOpen(true)}>
            <Send className="w-4 h-4 mr-2" />
            Compose
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Sent (30d)</p>
                <p className="text-2xl font-bold text-slate-900">{emailStats?.sent || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Open Rate</p>
                <p className="text-2xl font-bold text-slate-900">{openRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <MousePointer className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Click Rate</p>
                <p className="text-2xl font-bold text-slate-900">{clickRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Delivered</p>
                <p className="text-2xl font-bold text-slate-900">{emailStats?.delivered || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent" className="gap-2">
            <Inbox className="w-4 h-4" />
            Recent Emails
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-2">
            <FileText className="w-4 h-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="signatures" className="gap-2">
            <PenTool className="w-4 h-4" />
            Signatures
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Sent Emails</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate("/admin/email-client")}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Full Inbox
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>To</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEmails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                        No emails sent yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentEmails.map((email) => (
                      <TableRow key={email.id}>
                        <TableCell className="font-medium">{email.to_email}</TableCell>
                        <TableCell>{email.email_subject || "(No subject)"}</TableCell>
                        <TableCell>{getStatusBadge(email.event_type)}</TableCell>
                        <TableCell className="text-slate-500">
                          {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                        No campaigns created yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.campaign_name || "Untitled"}</TableCell>
                        <TableCell>{campaign.subject || "(No subject)"}</TableCell>
                        <TableCell>
                          <Badge variant={campaign.status === "sent" ? "default" : "secondary"}>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signatures" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Email Signatures</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/signatures")}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Full Signature Builder
                </Button>
                <Button size="sm" onClick={() => openSignatureModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Quick Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {signatures.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <PenTool className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No admin signatures yet</p>
                  <p className="text-sm text-slate-400 mt-1">Create signatures with photos, social links, banners and more</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/admin/signatures")}>
                    Open Signature Builder
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Profile</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signatures.map((sig) => (
                      <TableRow key={sig.id}>
                        <TableCell className="font-medium">{sig.name || "Untitled"}</TableCell>
                        <TableCell>{sig.profile_name || "-"}</TableCell>
                        <TableCell>{sig.company_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={sig.is_active ? "default" : "secondary"}>
                            {sig.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openSignatureModal(sig)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteSignature(sig.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Performance (30 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Total Sent</span>
                    <span className="font-semibold">{emailStats?.sent || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Delivered</span>
                    <span className="font-semibold">{emailStats?.delivered || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Opened</span>
                    <span className="font-semibold">{emailStats?.opened || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Clicked</span>
                    <span className="font-semibold">{emailStats?.clicked || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Engagement Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-600">Open Rate</span>
                      <span className="font-semibold">{openRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all" 
                        style={{ width: `${Math.min(parseFloat(openRate), 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-600">Click Rate</span>
                      <span className="font-semibold">{clickRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all" 
                        style={{ width: `${Math.min(parseFloat(clickRate), 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-600">Delivery Rate</span>
                      <span className="font-semibold">
                        {emailStats && emailStats.sent > 0 
                          ? ((emailStats.delivered / emailStats.sent) * 100).toFixed(1) 
                          : "0"}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all" 
                        style={{ 
                          width: emailStats && emailStats.sent > 0 
                            ? `${(emailStats.delivered / emailStats.sent) * 100}%` 
                            : "0%" 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Signature Modal */}
      <Dialog open={signatureModalOpen} onOpenChange={setSignatureModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSignature ? "Edit Signature" : "New Signature"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Signature Name</label>
              <Input 
                placeholder="e.g. Main, Marketing, Support"
                value={signatureForm.name}
                onChange={(e) => setSignatureForm({ ...signatureForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Your Name</label>
                <Input 
                  placeholder="John Doe"
                  value={signatureForm.profile_name}
                  onChange={(e) => setSignatureForm({ ...signatureForm, profile_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input 
                  placeholder="CEO, Manager, etc."
                  value={signatureForm.profile_title}
                  onChange={(e) => setSignatureForm({ ...signatureForm, profile_title: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Company Name</label>
                <Input 
                  placeholder="Seeksy Inc."
                  value={signatureForm.company_name}
                  onChange={(e) => setSignatureForm({ ...signatureForm, company_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input 
                  placeholder="+1 555-123-4567"
                  value={signatureForm.company_phone}
                  onChange={(e) => setSignatureForm({ ...signatureForm, company_phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Custom HTML Signature (optional)</label>
              <Textarea 
                placeholder="<p>Your HTML signature...</p>"
                value={signatureForm.html_signature}
                onChange={(e) => setSignatureForm({ ...signatureForm, html_signature: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignatureModalOpen(false)}>Cancel</Button>
            <Button onClick={saveSignature}>Save Signature</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Test Email Dialog */}
      <SendTestEmailDialog 
        open={testEmailOpen} 
        onOpenChange={setTestEmailOpen}
        signatures={signatures}
      />

      {/* Floating Composer */}
      <FloatingEmailComposer
        open={composerOpen}
        onClose={() => {
          setComposerOpen(false);
          refetchEmails();
        }}
      />
    </div>
  );
}