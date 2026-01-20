import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, Search, Target, TrendingUp, Calendar, DollarSign,
  Play, Pause, CheckCircle2, Clock, BarChart3, Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  campaign_type: string;
  status: string;
  goal?: string | null;
  channels: string[];
  budget: number;
  spent?: number;
  expected_roi?: number | null;
  actual_roi?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
}

export function CampaignBuilder() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    campaign_type: "acquisition",
    goal: "",
    budget: "",
    channels: [] as string[]
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cmo_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setCampaigns(data);
    setLoading(false);
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name) {
      toast.error("Campaign name is required");
      return;
    }

    const { error } = await supabase.from("cmo_campaigns").insert({
      name: newCampaign.name,
      description: newCampaign.description || null,
      campaign_type: newCampaign.campaign_type,
      goal: newCampaign.goal || null,
      budget: newCampaign.budget ? parseFloat(newCampaign.budget) : 0,
      channels: newCampaign.channels
    });

    if (error) {
      toast.error("Failed to create campaign");
      return;
    }

    toast.success("Campaign created successfully");
    setIsCreateOpen(false);
    setNewCampaign({ name: "", description: "", campaign_type: "acquisition", goal: "", budget: "", channels: [] });
    fetchCampaigns();
  };

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    const { error } = await supabase
      .from("cmo_campaigns")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", campaignId);

    if (!error) {
      toast.success("Campaign status updated");
      fetchCampaigns();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      scheduled: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      paused: "bg-yellow-100 text-yellow-800",
      completed: "bg-purple-100 text-purple-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      awareness: "bg-cyan-100 text-cyan-800",
      acquisition: "bg-blue-100 text-blue-800",
      retention: "bg-green-100 text-green-800",
      reactivation: "bg-orange-100 text-orange-800",
      product_launch: "bg-purple-100 text-purple-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;

  const channelOptions = ["email", "social", "events", "partnerships", "paid_ads", "podcast", "seo", "content"];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{campaigns.length}</p>
                <p className="text-xs text-muted-foreground">Total Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{activeCampaigns}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">${totalSpent.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Create */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Marketing Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Campaign Name *</Label>
                <Input 
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="e.g., Q1 Creator Acquisition"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  placeholder="Campaign objectives and strategy..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Campaign Type</Label>
                  <Select 
                    value={newCampaign.campaign_type} 
                    onValueChange={(v) => setNewCampaign({ ...newCampaign, campaign_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="awareness">Awareness</SelectItem>
                      <SelectItem value="acquisition">Acquisition</SelectItem>
                      <SelectItem value="retention">Retention</SelectItem>
                      <SelectItem value="reactivation">Reactivation</SelectItem>
                      <SelectItem value="product_launch">Product Launch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Budget ($)</Label>
                  <Input 
                    type="number"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label>Goal</Label>
                <Input 
                  value={newCampaign.goal}
                  onChange={(e) => setNewCampaign({ ...newCampaign, goal: e.target.value })}
                  placeholder="e.g., 500 new signups"
                />
              </div>
              <div>
                <Label>Channels</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {channelOptions.map(channel => (
                    <Badge
                      key={channel}
                      variant={newCampaign.channels.includes(channel) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const channels = newCampaign.channels.includes(channel)
                          ? newCampaign.channels.filter(c => c !== channel)
                          : [...newCampaign.channels, channel];
                        setNewCampaign({ ...newCampaign, channels });
                      }}
                    >
                      {channel}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateCampaign}>Create Campaign</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No campaigns yet</p>
              <p className="text-sm">Create your first marketing campaign</p>
            </CardContent>
          </Card>
        ) : (
          campaigns
            .filter(campaign => 
              campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{campaign.name}</h3>
                        <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                        <Badge className={getTypeColor(campaign.campaign_type)}>
                          {campaign.campaign_type.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      {campaign.description && (
                        <p className="text-sm text-muted-foreground">{campaign.description}</p>
                      )}
                      <div className="flex items-center gap-6 text-sm">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          Budget: ${campaign.budget.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          Spent: ${campaign.spent.toLocaleString()}
                        </span>
                        {campaign.goal && (
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            Goal: {campaign.goal}
                          </span>
                        )}
                      </div>
                      {campaign.channels && campaign.channels.length > 0 && (
                        <div className="flex gap-2">
                          {campaign.channels.map(ch => (
                            <Badge key={ch} variant="secondary" className="text-xs">{ch}</Badge>
                          ))}
                        </div>
                      )}
                      {/* Budget Progress */}
                      <div className="pt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Budget Utilization</span>
                          <span>{((campaign.spent / campaign.budget) * 100 || 0).toFixed(0)}%</span>
                        </div>
                        <Progress value={(campaign.spent / campaign.budget) * 100 || 0} className="h-2" />
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {campaign.status === "draft" && (
                        <Button size="sm" onClick={() => handleStatusChange(campaign.id, "active")}>
                          <Play className="h-4 w-4 mr-1" />
                          Launch
                        </Button>
                      )}
                      {campaign.status === "active" && (
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(campaign.id, "paused")}>
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                      )}
                      {campaign.status === "paused" && (
                        <Button size="sm" onClick={() => handleStatusChange(campaign.id, "active")}>
                          <Play className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}
