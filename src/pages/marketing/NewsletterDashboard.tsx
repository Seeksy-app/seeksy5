import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Mail, Users, Send, Plus, Eye, Edit, Trash2, Calendar, 
  Download, Upload, Search, BarChart2, MousePointer, UserMinus,
  Settings, FileText, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  status: string;
  subscribed_at: string;
  tags?: string[];
  source?: string;
}

interface Campaign {
  id: string;
  title: string;
  subject: string;
  preview_text: string | null;
  html_content: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  scheduled_at: string | null;
  recipient_count: number;
  opened_count: number;
  clicked_count: number;
}

export default function NewsletterDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [searchQuery, setSearchQuery] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [addSubscriberOpen, setAddSubscriberOpen] = useState(false);
  const [newSubscriberEmail, setNewSubscriberEmail] = useState('');
  const [newSubscriberName, setNewSubscriberName] = useState('');

  const { data: subscribers } = useQuery({
    queryKey: ["newsletter-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });
      if (error) throw error;
      return data as Subscriber[];
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ["newsletter-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
  });

  const activeSubscribers = subscribers?.filter(s => s.status === 'active') || [];
  const totalOpens = campaigns?.reduce((acc, c) => acc + (c.opened_count || 0), 0) || 0;
  const totalClicks = campaigns?.reduce((acc, c) => acc + (c.clicked_count || 0), 0) || 0;
  const totalSent = campaigns?.reduce((acc, c) => acc + (c.recipient_count || 0), 0) || 0;

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm("Send this newsletter to all active subscribers?")) return;

    toast.info("Sending newsletter...");

    const { error } = await supabase.functions.invoke("send-newsletter", {
      body: { campaignId },
    });

    if (error) {
      toast.error("Failed to send newsletter");
      return;
    }

    toast.success("Newsletter sent successfully!");
    queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Delete this campaign?")) return;

    const { error } = await supabase
      .from("newsletter_campaigns")
      .delete()
      .eq("id", campaignId);

    if (error) {
      toast.error("Failed to delete campaign");
      return;
    }

    toast.success("Campaign deleted");
    queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
  };

  const handleAddSubscriber = async () => {
    if (!newSubscriberEmail.trim()) {
      toast.error("Email is required");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use seeksy_platform tenant for admin-created subscribers
    const SEEKSY_PLATFORM_TENANT_ID = 'a0000000-0000-0000-0000-000000000001';
    
    const { error } = await supabase.from("newsletter_subscribers").insert({
      email: newSubscriberEmail.trim(),
      name: newSubscriberName.trim() || null,
      status: 'active',
      user_id: user.id,
      tenant_id: SEEKSY_PLATFORM_TENANT_ID,
    });

    if (error) {
      toast.error("Failed to add subscriber");
      return;
    }

    toast.success("Subscriber added");
    setNewSubscriberEmail('');
    setNewSubscriberName('');
    setAddSubscriberOpen(false);
    queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
  };

  const handleExportSubscribers = () => {
    if (!subscribers?.length) {
      toast.error("No subscribers to export");
      return;
    }

    const csv = [
      ['Email', 'Name', 'Status', 'Subscribed Date', 'Source'],
      ...subscribers.map(s => [
        s.email,
        s.name || '',
        s.status,
        format(new Date(s.subscribed_at), 'yyyy-MM-dd'),
        s.source || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Subscribers exported");
  };

  const filteredSubscribers = subscribers?.filter(s => 
    !searchQuery || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredCampaigns = campaigns?.filter(c =>
    !searchQuery ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Newsletters</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage email newsletters
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/marketing/newsletters/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button onClick={() => navigate('/marketing/newsletters/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Newsletter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Subscribers</p>
                <p className="text-2xl font-bold">{activeSubscribers.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sends</p>
                <p className="text-2xl font-bold">{totalSent.toLocaleString()}</p>
              </div>
              <Send className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Opens</p>
                <p className="text-2xl font-bold">{totalOpens.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
              </div>
              <MousePointer className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="campaigns">
              <Mail className="h-4 w-4 mr-2" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="subscribers">
              <Users className="h-4 w-4 mr-2" />
              Subscribers
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart2 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4 mt-6">
          {filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No newsletters yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first newsletter campaign
                </p>
                <Button onClick={() => navigate('/marketing/newsletters/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Newsletter
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{campaign.title}</h3>
                          <Badge variant={
                            campaign.status === 'sent' ? 'default' : 
                            campaign.status === 'scheduled' ? 'outline' : 'secondary'
                          }>
                            {campaign.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(campaign.created_at), 'MMM d, yyyy')}
                          </span>
                          {campaign.sent_at && (
                            <>
                              <span className="flex items-center gap-1">
                                <Send className="h-3 w-3" />
                                {campaign.recipient_count} sent
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {campaign.opened_count} opens
                              </span>
                              <span className="flex items-center gap-1">
                                <MousePointer className="h-3 w-3" />
                                {campaign.clicked_count} clicks
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {campaign.status === 'draft' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/marketing/newsletters/${campaign.id}/edit`)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSendCampaign(campaign.id)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Send
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers" className="space-y-4 mt-6">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleExportSubscribers}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Subscribers</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file with columns: email, name (optional)
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input type="file" accept=".csv" />
                </div>
                <Button onClick={() => {
                  toast.info("Import feature coming soon");
                  setImportDialogOpen(false);
                }}>
                  Import
                </Button>
              </DialogContent>
            </Dialog>
            <Dialog open={addSubscriberOpen} onOpenChange={setAddSubscriberOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subscriber
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Subscriber</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      value={newSubscriberEmail}
                      onChange={(e) => setNewSubscriberEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={newSubscriberName}
                      onChange={(e) => setNewSubscriberName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <Button onClick={handleAddSubscriber}>Add Subscriber</Button>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {filteredSubscribers.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No subscribers yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredSubscribers.map((subscriber) => (
                    <div key={subscriber.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{subscriber.name || subscriber.email}</p>
                        {subscriber.name && (
                          <p className="text-sm text-muted-foreground">{subscriber.email}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={subscriber.status === 'active' ? 'default' : 'secondary'}>
                          {subscriber.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(subscriber.subscribed_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Open Rate</CardTitle>
                <CardDescription>Average open rate across all campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {totalOpens.toLocaleString()} opens from {totalSent.toLocaleString()} sends
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Click Rate</CardTitle>
                <CardDescription>Average click rate across all campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : 0}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {totalClicks.toLocaleString()} clicks from {totalSent.toLocaleString()} sends
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns?.filter(c => c.sent_at).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No sent campaigns yet. Analytics will appear after you send your first newsletter.
                </p>
              ) : (
                <div className="space-y-4">
                  {campaigns?.filter(c => c.sent_at).map((campaign) => {
                    const openRate = campaign.recipient_count > 0 
                      ? Math.round((campaign.opened_count / campaign.recipient_count) * 100) 
                      : 0;
                    const clickRate = campaign.recipient_count > 0 
                      ? Math.round((campaign.clicked_count / campaign.recipient_count) * 100) 
                      : 0;
                    
                    return (
                      <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{campaign.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Sent {format(new Date(campaign.sent_at!), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-semibold">{campaign.recipient_count}</p>
                            <p className="text-muted-foreground">Sent</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">{openRate}%</p>
                            <p className="text-muted-foreground">Opens</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">{clickRate}%</p>
                            <p className="text-muted-foreground">Clicks</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
