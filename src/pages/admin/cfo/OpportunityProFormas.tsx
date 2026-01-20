import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  BarChart3, 
  Save, 
  Trash2, 
  Pencil,
  DollarSign,
  TrendingUp,
  Target,
  Building2
} from "lucide-react";
import { toast } from "sonner";

interface OpportunityProforma {
  id: string;
  opportunity_id: string;
  name: string;
  description: string | null;
  revenue_year1: number | null;
  revenue_year2: number | null;
  revenue_year3: number | null;
  expenses_year1: number | null;
  expenses_year2: number | null;
  expenses_year3: number | null;
  ebitda_year1: number | null;
  ebitda_year2: number | null;
  ebitda_year3: number | null;
  target_market: string | null;
  market_size: string | null;
  addressable_market: string | null;
  status: string;
  created_at: string;
}

interface SalesOpportunity {
  id: string;
  name: string;
  slug: string;
}

const EMPTY_PROFORMA = {
  name: "",
  description: "",
  opportunity_id: "",
  revenue_year1: "",
  revenue_year2: "",
  revenue_year3: "",
  expenses_year1: "",
  expenses_year2: "",
  expenses_year3: "",
  target_market: "",
  market_size: "",
  addressable_market: "",
  status: "draft",
};

export default function OpportunityProFormas() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_PROFORMA);
  const queryClient = useQueryClient();

  // Fetch all opportunities
  const { data: opportunities } = useQuery<SalesOpportunity[]>({
    queryKey: ["sales-opportunities-list"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("sales_opportunities") as any)
        .select("id, name, slug")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  // Fetch all pro formas
  const { data: proformas, isLoading } = useQuery<OpportunityProforma[]>({
    queryKey: ["all-opportunity-proformas"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("opportunity_proformas") as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        opportunity_id: data.opportunity_id,
        name: data.name,
        description: data.description || null,
        revenue_year1: data.revenue_year1 ? parseFloat(data.revenue_year1) : null,
        revenue_year2: data.revenue_year2 ? parseFloat(data.revenue_year2) : null,
        revenue_year3: data.revenue_year3 ? parseFloat(data.revenue_year3) : null,
        expenses_year1: data.expenses_year1 ? parseFloat(data.expenses_year1) : null,
        expenses_year2: data.expenses_year2 ? parseFloat(data.expenses_year2) : null,
        expenses_year3: data.expenses_year3 ? parseFloat(data.expenses_year3) : null,
        ebitda_year1: data.revenue_year1 && data.expenses_year1
          ? parseFloat(data.revenue_year1) - parseFloat(data.expenses_year1)
          : null,
        ebitda_year2: data.revenue_year2 && data.expenses_year2
          ? parseFloat(data.revenue_year2) - parseFloat(data.expenses_year2)
          : null,
        ebitda_year3: data.revenue_year3 && data.expenses_year3
          ? parseFloat(data.revenue_year3) - parseFloat(data.expenses_year3)
          : null,
        target_market: data.target_market || null,
        market_size: data.market_size || null,
        addressable_market: data.addressable_market || null,
        status: data.status,
      };

      if (editingId) {
        const { error } = await (supabase.from("opportunity_proformas") as any)
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("opportunity_proformas") as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Pro Forma updated" : "Pro Forma created");
      queryClient.invalidateQueries({ queryKey: ["all-opportunity-proformas"] });
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Failed to save Pro Forma");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("opportunity_proformas") as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pro Forma deleted");
      queryClient.invalidateQueries({ queryKey: ["all-opportunity-proformas"] });
    },
  });

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData(EMPTY_PROFORMA);
  };

  const handleEdit = (pf: OpportunityProforma) => {
    setEditingId(pf.id);
    setFormData({
      name: pf.name,
      description: pf.description || "",
      opportunity_id: pf.opportunity_id,
      revenue_year1: pf.revenue_year1?.toString() || "",
      revenue_year2: pf.revenue_year2?.toString() || "",
      revenue_year3: pf.revenue_year3?.toString() || "",
      expenses_year1: pf.expenses_year1?.toString() || "",
      expenses_year2: pf.expenses_year2?.toString() || "",
      expenses_year3: pf.expenses_year3?.toString() || "",
      target_market: pf.target_market || "",
      market_size: pf.market_size || "",
      addressable_market: pf.addressable_market || "",
      status: pf.status,
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.opportunity_id || !formData.name) {
      toast.error("Please select an opportunity and enter a name");
      return;
    }
    saveMutation.mutate(formData);
  };

  const getOpportunityName = (oppId: string) => {
    return opportunities?.find(o => o.id === oppId)?.name || "Unknown";
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Opportunity Pro Formas</h1>
          <p className="text-muted-foreground">
            Create and manage financial projections for sales opportunities
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setFormData(EMPTY_PROFORMA); }}>
              <Plus className="w-4 h-4 mr-2" />
              New Pro Forma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Pro Forma" : "Create Pro Forma"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Opportunity *</Label>
                  <Select
                    value={formData.opportunity_id}
                    onValueChange={(v) => setFormData({ ...formData, opportunity_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select opportunity" />
                    </SelectTrigger>
                    <SelectContent>
                      {opportunities?.map((opp) => (
                        <SelectItem key={opp.id} value={opp.id}>
                          {opp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pro Forma Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Conservative Scenario"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of assumptions..."
                  rows={2}
                />
              </div>

              <Separator />

              {/* Revenue Projections */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Revenue Projections
                </h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Year 1</Label>
                    <Input
                      type="number"
                      value={formData.revenue_year1}
                      onChange={(e) => setFormData({ ...formData, revenue_year1: e.target.value })}
                      placeholder="$0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year 2</Label>
                    <Input
                      type="number"
                      value={formData.revenue_year2}
                      onChange={(e) => setFormData({ ...formData, revenue_year2: e.target.value })}
                      placeholder="$0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year 3</Label>
                    <Input
                      type="number"
                      value={formData.revenue_year3}
                      onChange={(e) => setFormData({ ...formData, revenue_year3: e.target.value })}
                      placeholder="$0"
                    />
                  </div>
                </div>
              </div>

              {/* Expense Projections */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-red-600" />
                  Expense Projections
                </h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Year 1</Label>
                    <Input
                      type="number"
                      value={formData.expenses_year1}
                      onChange={(e) => setFormData({ ...formData, expenses_year1: e.target.value })}
                      placeholder="$0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year 2</Label>
                    <Input
                      type="number"
                      value={formData.expenses_year2}
                      onChange={(e) => setFormData({ ...formData, expenses_year2: e.target.value })}
                      placeholder="$0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year 3</Label>
                    <Input
                      type="number"
                      value={formData.expenses_year3}
                      onChange={(e) => setFormData({ ...formData, expenses_year3: e.target.value })}
                      placeholder="$0"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Market Info */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  Market Information
                </h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Target Market</Label>
                    <Input
                      value={formData.target_market}
                      onChange={(e) => setFormData({ ...formData, target_market: e.target.value })}
                      placeholder="e.g., Military Veterans"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Market Size (TAM)</Label>
                    <Input
                      value={formData.market_size}
                      onChange={(e) => setFormData({ ...formData, market_size: e.target.value })}
                      placeholder="e.g., $50B"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Addressable Market (SAM)</Label>
                    <Input
                      value={formData.addressable_market}
                      onChange={(e) => setFormData({ ...formData, addressable_market: e.target.value })}
                      placeholder="e.g., $5B"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pro Formas Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {proformas?.map((pf) => (
          <Card key={pf.id} className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base truncate">{pf.name}</CardTitle>
                  <CardDescription className="truncate">
                    {getOpportunityName(pf.opportunity_id)}
                  </CardDescription>
                </div>
                <Badge variant={pf.status === "active" ? "default" : "secondary"}>
                  {pf.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {pf.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {pf.description}
                </p>
              )}

              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="p-2 rounded bg-muted/50">
                  <p className="text-xs text-muted-foreground">Y1</p>
                  <p className="text-sm font-medium">{formatCurrency(pf.revenue_year1)}</p>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <p className="text-xs text-muted-foreground">Y2</p>
                  <p className="text-sm font-medium">{formatCurrency(pf.revenue_year2)}</p>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <p className="text-xs text-muted-foreground">Y3</p>
                  <p className="text-sm font-medium">{formatCurrency(pf.revenue_year3)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(pf)}>
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(pf.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {proformas?.length === 0 && (
        <Card className="p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Pro Formas Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create financial projections for your sales opportunities
          </p>
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Pro Forma
          </Button>
        </Card>
      )}
    </div>
  );
}
