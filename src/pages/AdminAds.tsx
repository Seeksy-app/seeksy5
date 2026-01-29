import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Upload, DollarSign, TrendingUp, Users, Play, Pause, Trash2, Eye, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function AdminAds() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    budget: "",
    cpm_bid: "",
    start_date: "",
    end_date: "",
    duration_seconds: "",
    targeting_rules: "{}",
  });

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select(`
          *,
          ad_creatives (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-ad-stats"],
    queryFn: async () => {
      const { data: impressions } = await supabase
        .from("ad_impressions")
        .select("*", { count: "exact", head: true });

      const { data: campaigns } = await supabase
        .from("ad_campaigns")
        .select("total_spent")
        .eq("status", "active");

      const totalRevenue = campaigns?.reduce((sum, c) => sum + Number(c.total_spent), 0) || 0;

      return {
        totalImpressions: impressions || 0,
        totalRevenue,
        activeCampaigns: campaigns?.length || 0,
      };
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error("Please upload an audio file");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload audio file
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("ad-audio")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("ad-audio")
        .getPublicUrl(fileName);

      // Create campaign
      const campaignResult = await (supabase as any)
        .from("ad_campaigns")
        .insert({
          advertiser_id: user.id,
          name: formData.name,
          total_budget: parseFloat(formData.budget),
          cpm_bid: parseFloat(formData.cpm_bid),
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: "draft",
          targeting_rules: JSON.parse(formData.targeting_rules),
        })
        .select()
        .single();

      if (campaignResult.error) throw campaignResult.error;
      const campaign = campaignResult.data as any;

      // Create creative
      const { error: creativeError } = await supabase
        .from("ad_creatives")
        .insert({
          campaign_id: campaign.id,
          advertiser_id: campaign.advertiser_id,
          name: "Audio Creative",
          format: "audio",
          duration_seconds: parseInt(formData.duration_seconds),
          status: "ready",
        });

      if (creativeError) throw creativeError;

      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      setCreateDialogOpen(false);
      setFormData({
        name: "",
        budget: "",
        cpm_bid: "",
        start_date: "",
        end_date: "",
        duration_seconds: "",
        targeting_rules: "{}",
      });
      setSelectedFile(null);
      toast.success("Campaign created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateCampaignStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("ad_campaigns")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      toast.success("Campaign status updated");
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ad_campaigns")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      toast.success("Campaign deleted");
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500",
      active: "bg-green-500",
      paused: "bg-yellow-500",
      completed: "bg-blue-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ad Campaign Management</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage advertising campaigns for podcasters
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Ad Campaign</DialogTitle>
                <DialogDescription>
                  Set up a new advertising campaign with audio creative
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Summer 2025 Brand Campaign"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget">Total Budget ($)</Label>
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="5000.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpm">CPM Bid ($)</Label>
                    <Input
                      id="cpm"
                      type="number"
                      step="0.01"
                      value={formData.cpm_bid}
                      onChange={(e) => setFormData({ ...formData, cpm_bid: e.target.value })}
                      placeholder="25.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="duration">Ad Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_seconds}
                    onChange={(e) => setFormData({ ...formData, duration_seconds: e.target.value })}
                    placeholder="30"
                  />
                </div>

                <div>
                  <Label htmlFor="audio">Audio Creative</Label>
                  <Input
                    id="audio"
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="targeting">Targeting Rules (JSON)</Label>
                  <Textarea
                    id="targeting"
                    value={formData.targeting_rules}
                    onChange={(e) => setFormData({ ...formData, targeting_rules: e.target.value })}
                    placeholder='{"categories": ["technology", "business"]}'
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createCampaignMutation.mutate()}
                  disabled={createCampaignMutation.isPending}
                >
                  Create Campaign
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats?.totalRevenue.toFixed(2) || "0.00"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalImpressions.toLocaleString() || "0"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.activeCampaigns || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List */}
        <Card>
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>
              Manage your advertising campaigns and track performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading campaigns...</div>
            ) : campaigns && campaigns.length > 0 ? (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{campaign.name}</h3>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Budget</p>
                            <p className="font-medium">${campaign.total_budget}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">CPM</p>
                            <p className="font-medium">${campaign.cpm_bid}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Impressions</p>
                            <p className="font-medium">{campaign.total_impressions.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Spent</p>
                            <p className="font-medium">${Number(campaign.total_spent).toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(campaign.start_date), "MMM d, yyyy")} - {format(new Date(campaign.end_date), "MMM d, yyyy")}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {campaign.status === "active" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCampaignStatusMutation.mutate({ id: campaign.id, status: "paused" })}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : campaign.status === "paused" || campaign.status === "draft" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCampaignStatusMutation.mutate({ id: campaign.id, status: "active" })}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : null}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first advertising campaign to start monetizing podcasts
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
