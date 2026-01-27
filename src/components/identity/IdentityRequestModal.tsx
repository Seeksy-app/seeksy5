import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface IdentityRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  creatorUsername: string;
}

export function IdentityRequestModal({ open, onOpenChange, creatorId, creatorUsername }: IdentityRequestModalProps) {
  const [formData, setFormData] = useState({
    advertiserCompany: "",
    advertiserWebsite: "",
    advertiserEmail: "",
    campaignName: "",
    campaignDescription: "",
    durationDays: "",
    budgetRange: "",
    rightsRequested: [] as string[],
  });

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!formData.advertiserCompany || !formData.advertiserEmail) {
        throw new Error("Company name and email are required");
      }

      if (formData.rightsRequested.length === 0) {
        throw new Error("Please select at least one right to request");
      }

      const result = await (supabase as any)
        .from("identity_requests")
        .insert({
          creator_id: creatorId,
          advertiser_id: user.id,
          advertiser_company: formData.advertiserCompany,
          advertiser_website: formData.advertiserWebsite || null,
          advertiser_email: formData.advertiserEmail,
          campaign_name: formData.campaignName || null,
          campaign_description: formData.campaignDescription || null,
          duration_days: formData.durationDays ? parseInt(formData.durationDays) : null,
          budget_range: formData.budgetRange || null,
          rights_requested: formData.rightsRequested,
        });

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      toast.success("Request submitted successfully");
      onOpenChange(false);
      setFormData({
        advertiserCompany: "",
        advertiserWebsite: "",
        advertiserEmail: "",
        campaignName: "",
        campaignDescription: "",
        durationDays: "",
        budgetRange: "",
        rightsRequested: [],
      });
    },
    onError: (error) => {
      toast.error("Failed to submit request: " + error.message);
    },
  });

  const handleRightsChange = (right: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      rightsRequested: checked
        ? [...prev.rightsRequested, right]
        : prev.rightsRequested.filter((r) => r !== right),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Permission</DialogTitle>
          <DialogDescription>
            Request permission to use {creatorUsername}'s identity in your campaign
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Advertiser Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Advertiser Information</h4>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company Name *</Label>
              <Input
                id="company"
                value={formData.advertiserCompany}
                onChange={(e) => setFormData({ ...formData, advertiserCompany: e.target.value })}
                placeholder="Acme Corp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Company Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.advertiserWebsite}
                onChange={(e) => setFormData({ ...formData, advertiserWebsite: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Contact Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.advertiserEmail}
                onChange={(e) => setFormData({ ...formData, advertiserEmail: e.target.value })}
                placeholder="contact@example.com"
              />
            </div>
          </div>

          {/* Campaign Details */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-sm">Campaign Details</h4>

            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={formData.campaignName}
                onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                placeholder="Summer Product Launch"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Campaign Description</Label>
              <Textarea
                id="description"
                value={formData.campaignDescription}
                onChange={(e) => setFormData({ ...formData, campaignDescription: e.target.value })}
                placeholder="Describe how you plan to use the creator's identity..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                  placeholder="30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget Range</Label>
                <Select
                  value={formData.budgetRange}
                  onValueChange={(value) => setFormData({ ...formData, budgetRange: value })}
                >
                  <SelectTrigger id="budget">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$1,000 - $5,000">$1,000 - $5,000</SelectItem>
                    <SelectItem value="$5,000 - $10,000">$5,000 - $10,000</SelectItem>
                    <SelectItem value="$10,000 - $25,000">$10,000 - $25,000</SelectItem>
                    <SelectItem value="$25,000 - $50,000">$25,000 - $50,000</SelectItem>
                    <SelectItem value="$50,000+">$50,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Rights Requested */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-sm">Rights Requested *</h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="face"
                  checked={formData.rightsRequested.includes("Face Identity")}
                  onCheckedChange={(checked) => handleRightsChange("Face Identity", checked as boolean)}
                />
                <Label htmlFor="face" className="text-sm font-normal cursor-pointer">
                  Face Identity
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="voice"
                  checked={formData.rightsRequested.includes("Voice Identity")}
                  onCheckedChange={(checked) => handleRightsChange("Voice Identity", checked as boolean)}
                />
                <Label htmlFor="voice" className="text-sm font-normal cursor-pointer">
                  Voice Identity
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clips"
                  checked={formData.rightsRequested.includes("Certified Clips")}
                  onCheckedChange={(checked) => handleRightsChange("Certified Clips", checked as boolean)}
                />
                <Label htmlFor="clips" className="text-sm font-normal cursor-pointer">
                  Certified Clips
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ai"
                  checked={formData.rightsRequested.includes("AI Likeness")}
                  onCheckedChange={(checked) => handleRightsChange("AI Likeness", checked as boolean)}
                />
                <Label htmlFor="ai" className="text-sm font-normal cursor-pointer">
                  AI Likeness Generation
                </Label>
              </div>
            </div>
          </div>

          {/* Seeksy Identity Promise */}
          <div className="pt-4 border-t">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
              <p className="text-xs font-semibold mb-1">Seeksy Identity Promise</p>
              <p className="text-xs text-muted-foreground">
                Seeksy will never sell, license, or use a creator's identity without explicit permission. Every use requires consent, recorded on-chain for transparency.
              </p>
            </div>
            
            <Button
              className="w-full"
              onClick={() => createRequestMutation.mutate()}
              disabled={createRequestMutation.isPending}
            >
              {createRequestMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
