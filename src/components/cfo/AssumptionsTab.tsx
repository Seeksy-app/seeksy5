import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, TrendingUp } from "lucide-react";

export function AssumptionsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Load assumptions for default scenario
  const { data: scenarios } = useQuery({
    queryKey: ["ad-financial-scenarios"],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("ad_financial_scenarios")
        .select("*")
        .order("created_at", { ascending: true });
      if (result.error) throw result.error;
      return result.data as any[];
    },
  });

  const defaultScenario = scenarios?.[0];

  const { data: assumptions, isLoading } = useQuery({
    queryKey: ["ad-financial-assumptions", defaultScenario?.id],
    queryFn: async () => {
      if (!defaultScenario?.id) return null;
      const result = await (supabase as any)
        .from("ad_financial_assumptions")
        .select("*")
        .eq("scenario_id", defaultScenario.id)
        .single();
      if (result.error) throw result.error;
      return result.data as any;
    },
    enabled: !!defaultScenario?.id,
  });

  // Load recent actuals
  const { data: recentRevenue } = useQuery({
    queryKey: ["admin-revenue-reports-recent"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const result = await (supabase as any)
        .from("admin_revenue_reports")
        .select("*")
        .gte("period_start", thirtyDaysAgo.toISOString().split("T")[0])
        .order("period_start", { ascending: false });
      if (result.error) throw result.error;
      return (result.data as any[]) || [];
    },
  });

  const [formData, setFormData] = useState<any>(null);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!assumptions?.id) throw new Error("No assumptions to update");
      const result = await (supabase as any)
        .from("ad_financial_assumptions")
        .update(data)
        .eq("id", assumptions.id);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-financial-assumptions"] });
      toast({ title: "Assumptions saved successfully" });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save assumptions", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = () => {
    setFormData(assumptions);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (formData) {
      updateMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setFormData(null);
    setIsEditing(false);
  };

  const totalRevenue = recentRevenue?.reduce((sum, r) => sum + Number(r.net_revenue), 0) || 0;
  const totalGross = recentRevenue?.reduce((sum, r) => sum + Number(r.gross_revenue), 0) || 0;
  const totalRefunds = recentRevenue?.reduce((sum, r) => sum + Number(r.refunds), 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayData = isEditing ? formData : assumptions;

  return (
    <div className="space-y-6">
      {/* Recent Actuals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Recent Actuals (Last 30 Days)
          </CardTitle>
          <CardDescription>Real data from admin_revenue_reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Gross Revenue</p>
              <p className="text-2xl font-bold">${totalGross.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Refunds</p>
              <p className="text-2xl font-bold text-red-500">${totalRefunds.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Net Revenue</p>
              <p className="text-2xl font-bold text-primary">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assumptions Form */}
      <Card>
        <CardHeader>
          <CardTitle>Model Assumptions</CardTitle>
          <CardDescription>
            Edit baseline parameters that drive the financial projections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Creator Growth */}
            <div className="space-y-2">
              <Label htmlFor="starting_creators">Starting Creators</Label>
              <Input
                id="starting_creators"
                type="number"
                value={displayData?.starting_creators || 0}
                onChange={(e) => setFormData({ ...formData, starting_creators: parseInt(e.target.value) })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_creator_growth">Monthly Creator Growth (%)</Label>
              <Input
                id="monthly_creator_growth"
                type="number"
                step="0.01"
                value={displayData?.monthly_creator_growth ? (displayData.monthly_creator_growth * 100).toFixed(1) : 0}
                onChange={(e) => setFormData({ ...formData, monthly_creator_growth: parseFloat(e.target.value) / 100 })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="percent_creators_monetized">% Creators Monetized</Label>
              <Input
                id="percent_creators_monetized"
                type="number"
                step="0.01"
                value={displayData?.percent_creators_monetized ? (displayData.percent_creators_monetized * 100).toFixed(1) : 0}
                onChange={(e) => setFormData({ ...formData, percent_creators_monetized: parseFloat(e.target.value) / 100 })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="episodes_per_creator_per_month">Episodes per Creator/Month</Label>
              <Input
                id="episodes_per_creator_per_month"
                type="number"
                value={displayData?.episodes_per_creator_per_month || 0}
                onChange={(e) => setFormData({ ...formData, episodes_per_creator_per_month: parseInt(e.target.value) })}
                disabled={!isEditing}
              />
            </div>

            {/* Impressions */}
            <div className="space-y-2">
              <Label htmlFor="listens_per_episode">Listens per Episode</Label>
              <Input
                id="listens_per_episode"
                type="number"
                value={displayData?.listens_per_episode || 0}
                onChange={(e) => setFormData({ ...formData, listens_per_episode: parseInt(e.target.value) })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad_slots_per_listen">Ad Slots per Listen</Label>
              <Input
                id="ad_slots_per_listen"
                type="number"
                step="0.1"
                value={displayData?.ad_slots_per_listen || 0}
                onChange={(e) => setFormData({ ...formData, ad_slots_per_listen: parseFloat(e.target.value) })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fill_rate">Fill Rate (%)</Label>
              <Input
                id="fill_rate"
                type="number"
                step="0.01"
                value={displayData?.fill_rate ? (displayData.fill_rate * 100).toFixed(1) : 0}
                onChange={(e) => setFormData({ ...formData, fill_rate: parseFloat(e.target.value) / 100 })}
                disabled={!isEditing}
              />
            </div>

            {/* CPM Rates */}
            <div className="space-y-2">
              <Label htmlFor="cpm_preroll">CPM Preroll ($)</Label>
              <Input
                id="cpm_preroll"
                type="number"
                step="0.01"
                value={displayData?.cpm_preroll || 0}
                onChange={(e) => setFormData({ ...formData, cpm_preroll: parseFloat(e.target.value) })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpm_midroll">CPM Midroll ($)</Label>
              <Input
                id="cpm_midroll"
                type="number"
                step="0.01"
                value={displayData?.cpm_midroll || 0}
                onChange={(e) => setFormData({ ...formData, cpm_midroll: parseFloat(e.target.value) })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpm_postroll">CPM Postroll ($)</Label>
              <Input
                id="cpm_postroll"
                type="number"
                step="0.01"
                value={displayData?.cpm_postroll || 0}
                onChange={(e) => setFormData({ ...formData, cpm_postroll: parseFloat(e.target.value) })}
                disabled={!isEditing}
              />
            </div>

            {/* Revenue Share */}
            <div className="space-y-2">
              <Label htmlFor="creator_rev_share">Creator Revenue Share (%)</Label>
              <Input
                id="creator_rev_share"
                type="number"
                step="0.01"
                value={displayData?.creator_rev_share ? (displayData.creator_rev_share * 100).toFixed(1) : 0}
                onChange={(e) => setFormData({ ...formData, creator_rev_share: parseFloat(e.target.value) / 100 })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform_variable_cost_pct">Platform Variable Cost (%)</Label>
              <Input
                id="platform_variable_cost_pct"
                type="number"
                step="0.01"
                value={displayData?.platform_variable_cost_pct ? (displayData.platform_variable_cost_pct * 100).toFixed(1) : 0}
                onChange={(e) => setFormData({ ...formData, platform_variable_cost_pct: parseFloat(e.target.value) / 100 })}
                disabled={!isEditing}
              />
            </div>

            {/* Campaigns */}
            <div className="space-y-2">
              <Label htmlFor="starting_campaigns">Starting Campaigns</Label>
              <Input
                id="starting_campaigns"
                type="number"
                value={displayData?.starting_campaigns || 0}
                onChange={(e) => setFormData({ ...formData, starting_campaigns: parseInt(e.target.value) })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_campaign_growth">Monthly Campaign Growth (%)</Label>
              <Input
                id="monthly_campaign_growth"
                type="number"
                step="0.01"
                value={displayData?.monthly_campaign_growth ? (displayData.monthly_campaign_growth * 100).toFixed(1) : 0}
                onChange={(e) => setFormData({ ...formData, monthly_campaign_growth: parseFloat(e.target.value) / 100 })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avg_campaign_monthly_budget">Avg Campaign Monthly Budget ($)</Label>
              <Input
                id="avg_campaign_monthly_budget"
                type="number"
                value={displayData?.avg_campaign_monthly_budget || 0}
                onChange={(e) => setFormData({ ...formData, avg_campaign_monthly_budget: parseFloat(e.target.value) })}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={handleEdit}>
                <Save className="h-4 w-4 mr-2" />
                Edit Assumptions
              </Button>
            ) : (
              <>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  Cancel
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
