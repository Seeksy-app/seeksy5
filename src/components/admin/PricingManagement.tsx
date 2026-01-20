import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, DollarSign, TrendingUp, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PricingTier {
  id: string;
  tier_name: string;
  cpm_min: number;
  cpm_max: number;
  min_deposit: number;
  conversational_ad_rate: number;
  conversational_ad_discount: number;
  features: string[];
  display_order: number;
  is_active: boolean;
}

export function PricingManagement() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
  const [formData, setFormData] = useState({
    tier_name: "",
    cpm_min: "",
    cpm_max: "",
    min_deposit: "",
    conversational_ad_rate: "0.25",
    conversational_ad_discount: "0",
    features: "",
    display_order: "1",
    is_active: true,
  });

  // Fetch pricing tiers
  const { data: pricingTiers = [], isLoading } = useQuery({
    queryKey: ["advertiser-pricing-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advertiser_pricing_tiers")
        .select("*")
        .order("display_order");

      if (error) throw error;
      return data as PricingTier[];
    },
  });

  // Create/Update tier mutation
  const saveTierMutation = useMutation({
    mutationFn: async (tier: any) => {
      const tierData = {
        tier_name: tier.tier_name,
        cpm_min: parseFloat(tier.cpm_min),
        cpm_max: parseFloat(tier.cpm_max),
        min_deposit: parseFloat(tier.min_deposit),
        conversational_ad_rate: parseFloat(tier.conversational_ad_rate),
        conversational_ad_discount: parseFloat(tier.conversational_ad_discount),
        features: typeof tier.features === "string" 
          ? tier.features.split("\n").filter((f: string) => f.trim())
          : tier.features,
        display_order: parseInt(tier.display_order),
        is_active: tier.is_active,
      };

      if (tier.id) {
        const { error } = await supabase
          .from("advertiser_pricing_tiers")
          .update(tierData)
          .eq("id", tier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("advertiser_pricing_tiers")
          .insert([tierData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advertiser-pricing-tiers"] });
      toast.success(editingTier ? "Tier updated" : "Tier created");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("Failed to save tier: " + error.message);
    },
  });

  // Delete tier mutation
  const deleteTierMutation = useMutation({
    mutationFn: async (tierId: string) => {
      const { error } = await supabase
        .from("advertiser_pricing_tiers")
        .delete()
        .eq("id", tierId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advertiser-pricing-tiers"] });
      toast.success("Tier deleted");
    },
    onError: (error: any) => {
      toast.error("Failed to delete tier: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      tier_name: "",
      cpm_min: "",
      cpm_max: "",
      min_deposit: "",
      conversational_ad_rate: "0.25",
      conversational_ad_discount: "0",
      features: "",
      display_order: (pricingTiers.length + 1).toString(),
      is_active: true,
    });
    setEditingTier(null);
  };

  const handleEdit = (tier: PricingTier) => {
    setEditingTier(tier);
    setFormData({
      tier_name: tier.tier_name,
      cpm_min: tier.cpm_min.toString(),
      cpm_max: tier.cpm_max.toString(),
      min_deposit: tier.min_deposit.toString(),
      conversational_ad_rate: tier.conversational_ad_rate.toString(),
      conversational_ad_discount: tier.conversational_ad_discount?.toString() || "0",
      features: Array.isArray(tier.features) ? tier.features.join("\n") : "",
      display_order: tier.display_order.toString(),
      is_active: tier.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveTierMutation.mutate({
      ...(editingTier && { id: editingTier.id }),
      ...formData,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Pricing & Revenue Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage advertiser pricing tiers, platform fees, and service rates
          </p>
        </div>
      </div>

      <Tabs defaultValue="advertiser-tiers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="advertiser-tiers" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Advertiser Tiers
          </TabsTrigger>
          <TabsTrigger value="platform-fees" className="gap-2">
            <Settings className="h-4 w-4" />
            Platform Fees
          </TabsTrigger>
        </TabsList>

        <TabsContent value="advertiser-tiers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Advertiser Pricing Tiers</CardTitle>
                  <CardDescription>
                    Configure CPM rates, deposit minimums, and features for each tier
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tier
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingTier ? "Edit Pricing Tier" : "Create Pricing Tier"}
                      </DialogTitle>
                      <DialogDescription>
                        Set up advertiser pricing tiers with CPM ranges and features
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tier_name">Tier Name</Label>
                          <Input
                            id="tier_name"
                            value={formData.tier_name}
                            onChange={(e) =>
                              setFormData({ ...formData, tier_name: e.target.value })
                            }
                            placeholder="e.g., Starter, Professional, Enterprise"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="display_order">Display Order</Label>
                          <Input
                            id="display_order"
                            type="number"
                            value={formData.display_order}
                            onChange={(e) =>
                              setFormData({ ...formData, display_order: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cpm_min">CPM Min ($)</Label>
                          <Input
                            id="cpm_min"
                            type="number"
                            step="0.01"
                            value={formData.cpm_min}
                            onChange={(e) =>
                              setFormData({ ...formData, cpm_min: e.target.value })
                            }
                            placeholder="e.g., 5.00"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cpm_max">CPM Max ($)</Label>
                          <Input
                            id="cpm_max"
                            type="number"
                            step="0.01"
                            value={formData.cpm_max}
                            onChange={(e) =>
                              setFormData({ ...formData, cpm_max: e.target.value })
                            }
                            placeholder="e.g., 15.00"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="min_deposit">Minimum Deposit ($)</Label>
                          <Input
                            id="min_deposit"
                            type="number"
                            step="0.01"
                            value={formData.min_deposit}
                            onChange={(e) =>
                              setFormData({ ...formData, min_deposit: e.target.value })
                            }
                            placeholder="e.g., 500.00"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="conversational_ad_rate">
                            Conversational Ad Rate ($/min)
                          </Label>
                          <Input
                            id="conversational_ad_rate"
                            type="number"
                            step="0.01"
                            value={formData.conversational_ad_rate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                conversational_ad_rate: e.target.value,
                              })
                            }
                            placeholder="e.g., 0.25"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="conversational_ad_discount">
                          Conversational Ad Discount (%)
                        </Label>
                        <Input
                          id="conversational_ad_discount"
                          type="number"
                          step="0.01"
                          value={formData.conversational_ad_discount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              conversational_ad_discount: e.target.value,
                            })
                          }
                          placeholder="e.g., 10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="features">
                          Features (one per line)
                        </Label>
                        <Textarea
                          id="features"
                          value={formData.features}
                          onChange={(e) =>
                            setFormData({ ...formData, features: e.target.value })
                          }
                          placeholder="Standard CPM rates&#10;Email support&#10;Basic analytics"
                          rows={5}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, is_active: checked })
                          }
                        />
                        <Label htmlFor="is_active">Active</Label>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={saveTierMutation.isPending}
                        >
                          {saveTierMutation.isPending ? "Saving..." : "Save Tier"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading pricing tiers...
                </div>
              ) : pricingTiers.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No pricing tiers configured yet
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Tier
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead>CPM Range</TableHead>
                      <TableHead>Min Deposit</TableHead>
                      <TableHead>Conv. Ad Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingTiers.map((tier) => (
                      <TableRow key={tier.id}>
                        <TableCell className="font-medium">
                          {tier.tier_name}
                        </TableCell>
                        <TableCell>
                          ${tier.cpm_min} - ${tier.cpm_max}
                        </TableCell>
                        <TableCell>${tier.min_deposit}</TableCell>
                        <TableCell>${tier.conversational_ad_rate}/min</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              tier.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {tier.is_active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(tier)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this tier?"
                                  )
                                ) {
                                  deleteTierMutation.mutate(tier.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
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

        <TabsContent value="platform-fees">
          <Card>
            <CardHeader>
              <CardTitle>Platform Fees & Settings</CardTitle>
              <CardDescription>
                Configure platform commission rates and processing fees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Platform fee configuration coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
