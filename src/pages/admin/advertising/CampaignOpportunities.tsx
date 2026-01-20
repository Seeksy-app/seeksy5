import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Users, DollarSign, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CampaignOpportunitiesProps {
  campaignId: string;
}

interface Opportunity {
  id: string;
  campaign_id: string;
  title: string;
  description: string | null;
  format: string;
  payout_type: string;
  payout_amount: number | null;
  revshare_percent: number | null;
  eligibility_tags: string[];
  max_creators: number;
  status: string;
  created_at: string;
}

const FORMAT_OPTIONS = [
  { value: "host_read", label: "Host Read" },
  { value: "pre_roll", label: "Pre-Roll" },
  { value: "post_roll", label: "Post-Roll" },
  { value: "branded_segment", label: "Branded Segment" },
  { value: "video_integration", label: "Video Integration" },
  { value: "event_sponsorship", label: "Event Sponsorship" },
];

const PAYOUT_TYPE_OPTIONS = [
  { value: "flat", label: "Flat Rate" },
  { value: "revshare", label: "Revenue Share" },
  { value: "hybrid", label: "Hybrid" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "closed", label: "Closed" },
];

export default function CampaignOpportunities({ campaignId }: CampaignOpportunitiesProps) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    format: "host_read",
    payout_type: "flat",
    payout_amount: "",
    revshare_percent: "",
    eligibility_tags: "",
    max_creators: "10",
    status: "draft",
  });

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ["campaign-opportunities", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_opportunities")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Opportunity[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("ad_opportunities").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-opportunities", campaignId] });
      toast.success("Opportunity created successfully");
      handleCloseForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create opportunity");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("ad_opportunities").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-opportunities", campaignId] });
      toast.success("Opportunity updated successfully");
      handleCloseForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update opportunity");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ad_opportunities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-opportunities", campaignId] });
      toast.success("Opportunity deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete opportunity");
    },
  });

  const handleOpenCreate = () => {
    setEditingOpportunity(null);
    setFormData({
      title: "",
      description: "",
      format: "host_read",
      payout_type: "flat",
      payout_amount: "",
      revshare_percent: "",
      eligibility_tags: "",
      max_creators: "10",
      status: "draft",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    setFormData({
      title: opportunity.title,
      description: opportunity.description || "",
      format: opportunity.format,
      payout_type: opportunity.payout_type,
      payout_amount: opportunity.payout_amount?.toString() || "",
      revshare_percent: opportunity.revshare_percent?.toString() || "",
      eligibility_tags: opportunity.eligibility_tags?.join(", ") || "",
      max_creators: opportunity.max_creators?.toString() || "10",
      status: opportunity.status,
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingOpportunity(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      campaign_id: campaignId,
      title: formData.title,
      description: formData.description || null,
      format: formData.format,
      payout_type: formData.payout_type,
      payout_amount: formData.payout_amount ? parseFloat(formData.payout_amount) : null,
      revshare_percent: formData.revshare_percent ? parseFloat(formData.revshare_percent) : null,
      eligibility_tags: formData.eligibility_tags
        ? formData.eligibility_tags.split(",").map((t) => t.trim())
        : [],
      max_creators: parseInt(formData.max_creators) || 10,
      status: formData.status,
    };

    if (editingOpportunity) {
      updateMutation.mutate({ id: editingOpportunity.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this opportunity?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      published: "default",
      draft: "secondary",
      closed: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getFormatLabel = (format: string) => {
    return FORMAT_OPTIONS.find((f) => f.value === format)?.label || format;
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Creator Opportunities</h3>
          <p className="text-sm text-muted-foreground">
            Define opportunities for creators to participate in this campaign
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Opportunity
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading opportunities...</div>
      ) : !opportunities || opportunities.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No opportunities yet</h3>
            <p className="text-muted-foreground mb-4">
              Create opportunities for creators to join this campaign
            </p>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Opportunity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opportunity) => (
            <Card key={opportunity.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                      {getStatusBadge(opportunity.status)}
                    </div>
                    <CardDescription>{getFormatLabel(opportunity.format)}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleOpenEdit(opportunity)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(opportunity.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {opportunity.description && (
                  <p className="text-sm text-muted-foreground mb-4">{opportunity.description}</p>
                )}
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Payout</p>
                      <p className="font-semibold">
                        {opportunity.payout_type === "flat" && opportunity.payout_amount
                          ? `$${opportunity.payout_amount}`
                          : opportunity.payout_type === "revshare" && opportunity.revshare_percent
                          ? `${opportunity.revshare_percent}%`
                          : opportunity.payout_type === "hybrid"
                          ? `$${opportunity.payout_amount || 0} + ${opportunity.revshare_percent || 0}%`
                          : "TBD"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Max Creators</p>
                      <p className="font-semibold">{opportunity.max_creators}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Eligibility Tags</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {opportunity.eligibility_tags?.length > 0 ? (
                          opportunity.eligibility_tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">No tags</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingOpportunity ? "Edit Opportunity" : "Create Opportunity"}
            </DialogTitle>
            <DialogDescription>
              {editingOpportunity
                ? "Update the details for this creator opportunity"
                : "Define a new opportunity for creators to participate"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Mid-roll host read for finance podcasts"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the opportunity..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="format">Format *</Label>
                <Select
                  value={formData.format}
                  onValueChange={(value) => setFormData({ ...formData, format: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payout_type">Payout Type *</Label>
                <Select
                  value={formData.payout_type}
                  onValueChange={(value) => setFormData({ ...formData, payout_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYOUT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="max_creators">Max Creators</Label>
                <Input
                  id="max_creators"
                  type="number"
                  value={formData.max_creators}
                  onChange={(e) => setFormData({ ...formData, max_creators: e.target.value })}
                />
              </div>
            </div>

            {(formData.payout_type === "flat" || formData.payout_type === "hybrid") && (
              <div>
                <Label htmlFor="payout_amount">Flat Payout Amount ($)</Label>
                <Input
                  id="payout_amount"
                  type="number"
                  step="0.01"
                  value={formData.payout_amount}
                  onChange={(e) => setFormData({ ...formData, payout_amount: e.target.value })}
                  placeholder="100.00"
                />
              </div>
            )}

            {(formData.payout_type === "revshare" || formData.payout_type === "hybrid") && (
              <div>
                <Label htmlFor="revshare_percent">Revenue Share (%)</Label>
                <Input
                  id="revshare_percent"
                  type="number"
                  step="0.1"
                  value={formData.revshare_percent}
                  onChange={(e) => setFormData({ ...formData, revshare_percent: e.target.value })}
                  placeholder="15"
                />
              </div>
            )}

            <div>
              <Label htmlFor="eligibility_tags">Eligibility Tags (comma-separated)</Label>
              <Input
                id="eligibility_tags"
                value={formData.eligibility_tags}
                onChange={(e) => setFormData({ ...formData, eligibility_tags: e.target.value })}
                placeholder="veteran, business, US audience"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingOpportunity ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
