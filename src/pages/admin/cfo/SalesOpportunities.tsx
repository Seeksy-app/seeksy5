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
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Save, 
  Trash2, 
  Pencil,
  DollarSign,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Target,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

interface SalesOpportunity {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  video_url: string | null;
  demo_url: string | null;
  site_url: string | null;
  thumbnail_url: string | null;
  target_market: string | null;
  market_size: string | null;
  revenue_model: string | null;
  projected_revenue_year1: number | null;
  projected_revenue_year2: number | null;
  projected_revenue_year3: number | null;
  competitive_advantage: string | null;
  status: string;
  is_featured: boolean;
  display_order: number;
  access_code: string | null;
  created_at: string;
}

const EMPTY_OPPORTUNITY = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  video_url: "",
  demo_url: "",
  site_url: "",
  thumbnail_url: "",
  target_market: "",
  market_size: "",
  revenue_model: "",
  projected_revenue_year1: "",
  projected_revenue_year2: "",
  projected_revenue_year3: "",
  competitive_advantage: "",
  status: "draft",
  is_featured: false,
  display_order: 0,
};

export default function AdminSalesOpportunities() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_OPPORTUNITY);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: opportunities, isLoading } = useQuery<SalesOpportunity[]>({
    queryKey: ["admin-sales-opportunities"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("sales_opportunities") as any)
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        tagline: data.tagline || null,
        description: data.description || null,
        video_url: data.video_url || null,
        demo_url: data.demo_url || null,
        site_url: data.site_url || null,
        thumbnail_url: data.thumbnail_url || null,
        target_market: data.target_market || null,
        market_size: data.market_size || null,
        revenue_model: data.revenue_model || null,
        projected_revenue_year1: data.projected_revenue_year1 ? parseFloat(data.projected_revenue_year1) : null,
        projected_revenue_year2: data.projected_revenue_year2 ? parseFloat(data.projected_revenue_year2) : null,
        projected_revenue_year3: data.projected_revenue_year3 ? parseFloat(data.projected_revenue_year3) : null,
        competitive_advantage: data.competitive_advantage || null,
        status: data.status,
        is_featured: data.is_featured,
        display_order: data.display_order,
      };

      if (editingId) {
        const { error } = await (supabase.from("sales_opportunities") as any)
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("sales_opportunities") as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Opportunity updated" : "Opportunity created");
      queryClient.invalidateQueries({ queryKey: ["admin-sales-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["board-sales-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["sales-opportunities-list"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save opportunity");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("sales_opportunities") as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Opportunity deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-sales-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["board-sales-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["sales-opportunities-list"] });
    },
  });

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData(EMPTY_OPPORTUNITY);
  };

  const handleEdit = (opp: SalesOpportunity) => {
    setEditingId(opp.id);
    setFormData({
      name: opp.name,
      slug: opp.slug,
      tagline: opp.tagline || "",
      description: opp.description || "",
      video_url: opp.video_url || "",
      demo_url: opp.demo_url || "",
      site_url: opp.site_url || "",
      thumbnail_url: opp.thumbnail_url || "",
      target_market: opp.target_market || "",
      market_size: opp.market_size || "",
      revenue_model: opp.revenue_model || "",
      projected_revenue_year1: opp.projected_revenue_year1?.toString() || "",
      projected_revenue_year2: opp.projected_revenue_year2?.toString() || "",
      projected_revenue_year3: opp.projected_revenue_year3?.toString() || "",
      competitive_advantage: opp.competitive_advantage || "",
      status: opp.status,
      is_featured: opp.is_featured,
      display_order: opp.display_order,
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Please enter a name");
      return;
    }
    saveMutation.mutate(formData);
  };

  const copyShareLink = (slug: string) => {
    const shareUrl = `${window.location.origin}/invest/${slug}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedSlug(slug);
    toast.success("Share link copied");
    setTimeout(() => setCopiedSlug(null), 2000);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "draft":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Opportunities</h1>
          <p className="text-muted-foreground">
            Create and manage investment opportunities for Board to share with investors
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setFormData(EMPTY_OPPORTUNITY); }}>
              <Plus className="w-4 h-4 mr-2" />
              New Opportunity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Sales Opportunity" : "Create Sales Opportunity"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Veteran Benefits Platform"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated from name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Short description for cards"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Full description of the opportunity..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
                />
                <Label>Featured Opportunity</Label>
              </div>

              <Separator />

              {/* URLs */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  Links & Media
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Demo URL</Label>
                    <Input
                      value={formData.demo_url}
                      onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Live Site URL</Label>
                    <Input
                      value={formData.site_url}
                      onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Video URL</Label>
                    <Input
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Thumbnail URL</Label>
                    <Input
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Market Info */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
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
                    <Label>Market Size</Label>
                    <Input
                      value={formData.market_size}
                      onChange={(e) => setFormData({ ...formData, market_size: e.target.value })}
                      placeholder="e.g., $50B"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Revenue Model</Label>
                    <Input
                      value={formData.revenue_model}
                      onChange={(e) => setFormData({ ...formData, revenue_model: e.target.value })}
                      placeholder="e.g., SaaS + Lead Gen"
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label>Competitive Advantage</Label>
                  <Textarea
                    value={formData.competitive_advantage}
                    onChange={(e) => setFormData({ ...formData, competitive_advantage: e.target.value })}
                    placeholder="What makes this opportunity unique..."
                    rows={2}
                  />
                </div>
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
                      value={formData.projected_revenue_year1}
                      onChange={(e) => setFormData({ ...formData, projected_revenue_year1: e.target.value })}
                      placeholder="$0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year 2</Label>
                    <Input
                      type="number"
                      value={formData.projected_revenue_year2}
                      onChange={(e) => setFormData({ ...formData, projected_revenue_year2: e.target.value })}
                      placeholder="$0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year 3</Label>
                    <Input
                      type="number"
                      value={formData.projected_revenue_year3}
                      onChange={(e) => setFormData({ ...formData, projected_revenue_year3: e.target.value })}
                      placeholder="$0"
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

      {/* Opportunities Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {opportunities?.map((opp) => (
          <Card key={opp.id} className="group relative overflow-hidden hover:shadow-lg transition-all duration-200">
            {/* Status indicator */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${getStatusColor(opp.status)}`} />
            
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-base truncate">{opp.name}</CardTitle>
                    {opp.is_featured && (
                      <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs shrink-0">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="truncate">
                    {opp.tagline || opp.target_market || "No description"}
                  </CardDescription>
                </div>
                <Badge variant={opp.status === "active" ? "default" : "secondary"}>
                  {opp.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Revenue Projections */}
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="p-2 rounded bg-muted/50">
                  <p className="text-xs text-muted-foreground">Y1</p>
                  <p className="text-sm font-medium">{formatCurrency(opp.projected_revenue_year1)}</p>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <p className="text-xs text-muted-foreground">Y2</p>
                  <p className="text-sm font-medium">{formatCurrency(opp.projected_revenue_year2)}</p>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <p className="text-xs text-muted-foreground">Y3</p>
                  <p className="text-sm font-medium">{formatCurrency(opp.projected_revenue_year3)}</p>
                </div>
              </div>

              {/* Quick Links */}
              <div className="flex flex-wrap gap-2 mb-4 text-xs">
                {opp.demo_url && (
                  <a 
                    href={opp.demo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Demo
                  </a>
                )}
                {opp.site_url && (
                  <a 
                    href={opp.site_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Site
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t">
                <Button 
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(opp)}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyShareLink(opp.slug)}
                >
                  {copiedSlug === opp.slug ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <a 
                  href={`/invest/${opp.slug}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </a>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this opportunity?")) {
                      deleteMutation.mutate(opp.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {opportunities?.length === 0 && (
        <Card className="p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Opportunities Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first sales opportunity for the board to share with investors.
          </p>
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Opportunity
          </Button>
        </Card>
      )}
    </div>
  );
}
