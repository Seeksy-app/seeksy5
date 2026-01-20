import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Loader2, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { demoAdvertisers } from "@/data/salesLeadsDemo";

export default function CreateCampaign() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    advertiser_id: (location.state as any)?.preSelectedAdvertiserId || "",
    budget: "",
    start_date: "",
    end_date: "",
    status: "draft",
    cpm_bid: "",
  });
  const [selectedUnits, setSelectedUnits] = useState<Record<string, { selected: boolean; cpm: string; impressions: string }>>({});

  const { data: advertisers } = useQuery({
    queryKey: ["advertisers-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advertisers")
        .select("id, company_name")
        .eq("status", "active")
        .order("company_name");

      if (error) throw error;
      // Return demo data if no advertisers exist
      if (!data || data.length === 0) {
        return demoAdvertisers;
      }
      return data;
    },
  });

  const { data: inventoryUnits } = useQuery({
    queryKey: ["inventory-units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_inventory_units")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const handleUnitToggle = (unitId: string, unit: any) => {
    setSelectedUnits((prev) => ({
      ...prev,
      [unitId]: {
        selected: !prev[unitId]?.selected,
        cpm: prev[unitId]?.cpm || unit.target_cpm.toString(),
        impressions: prev[unitId]?.impressions || "10000",
      },
    }));
  };

  const handleUnitChange = (unitId: string, field: "cpm" | "impressions", value: string) => {
    setSelectedUnits((prev) => ({
      ...prev,
      [unitId]: {
        ...prev[unitId],
        [field]: value,
      },
    }));
  };

  const calculateTotals = () => {
    let totalCost = 0;
    let totalImpressions = 0;

    Object.entries(selectedUnits).forEach(([unitId, data]) => {
      if (data.selected) {
        const cpm = parseFloat(data.cpm) || 0;
        const impressions = parseFloat(data.impressions) || 0;
        totalCost += (impressions / 1000) * cpm;
        totalImpressions += impressions;
      }
    });

    const seeksyRevenue = totalCost * 0.30; // 30% platform fee
    const creatorPayout = totalCost * 0.70; // 70% creator payout

    return { totalCost, totalImpressions, seeksyRevenue, creatorPayout };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedUnitsList = Object.entries(selectedUnits)
        .filter(([_, data]) => data.selected)
        .map(([unitId, data]) => ({
          unit_id: unitId,
          cpm: parseFloat(data.cpm),
          expected_impressions: parseFloat(data.impressions),
        }));

      if (selectedUnitsList.length === 0) {
        toast.error("Please select at least one ad unit");
        setLoading(false);
        return;
      }

      const avgCpm = selectedUnitsList.reduce((sum, u) => sum + u.cpm, 0) / selectedUnitsList.length;

      const { data: campaign, error } = await supabase
        .from("ad_campaigns")
        .insert({
          name: formData.name,
          advertiser_id: formData.advertiser_id,
          total_budget: parseFloat(formData.budget),
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status,
          cpm_bid: avgCpm,
          targeting_rules: {
            selected_units: selectedUnitsList,
          },
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Campaign created successfully");
      navigate(`/admin/advertising/campaigns/${campaign.id}`);
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      toast.error(error.message || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/admin/ad-campaigns")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Campaigns
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Campaign</h1>
        <p className="text-muted-foreground mt-1">
          Set up a new advertising campaign
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Basic campaign information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Summer 2024 Campaign"
              />
            </div>

            <div>
              <Label htmlFor="advertiser">Advertiser *</Label>
              <Select
                value={formData.advertiser_id}
                onValueChange={(value) => setFormData({ ...formData, advertiser_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select advertiser" />
                </SelectTrigger>
                <SelectContent>
                  {advertisers?.map((advertiser) => (
                    <SelectItem key={advertiser.id} value={advertiser.id}>
                      {advertiser.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Total Budget ($) *</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Ad Units</CardTitle>
            <CardDescription>Choose inventory units and set CPM for each</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inventoryUnits?.map((unit) => (
              <div key={unit.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedUnits[unit.id]?.selected || false}
                    onCheckedChange={() => handleUnitToggle(unit.id, unit)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{unit.name}</h4>
                      <Badge variant="outline">{unit.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Floor: ${unit.floor_cpm} | Target: ${unit.target_cpm} | Ceiling: ${unit.ceiling_cpm}
                    </p>

                    {selectedUnits[unit.id]?.selected && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`cpm-${unit.id}`}>CPM ($)</Label>
                          <Input
                            id={`cpm-${unit.id}`}
                            type="number"
                            step="0.01"
                            value={selectedUnits[unit.id].cpm}
                            onChange={(e) => handleUnitChange(unit.id, "cpm", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`impressions-${unit.id}`}>Expected Impressions</Label>
                          <Input
                            id={`impressions-${unit.id}`}
                            type="number"
                            value={selectedUnits[unit.id].impressions}
                            onChange={(e) => handleUnitChange(unit.id, "impressions", e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Impressions:</span>
                  <span className="font-semibold">{totals.totalImpressions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Cost:</span>
                  <span className="font-semibold">${totals.totalCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seeksy Revenue (30%):</span>
                  <span className="font-semibold text-green-600">${totals.seeksyRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creator Payout (70%):</span>
                  <span className="font-semibold">${totals.creatorPayout.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/ad-campaigns")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Campaign
          </Button>
        </div>
      </form>
    </div>
  );
}
