import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AdvertiserFormProps {
  advertiser?: any;
  open: boolean;
  onClose: () => void;
}

export default function AdvertiserForm({ advertiser, open, onClose }: AdvertiserFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    website_url: "",
    primary_goal: "",
    business_description: "",
    status: "pending",
  });

  useEffect(() => {
    if (advertiser) {
      setFormData({
        company_name: advertiser.company_name || "",
        contact_name: advertiser.contact_name || "",
        contact_email: advertiser.contact_email || "",
        contact_phone: advertiser.contact_phone || "",
        website_url: advertiser.website_url || "",
        primary_goal: advertiser.primary_goal || "",
        business_description: advertiser.business_description || "",
        status: advertiser.status || "pending",
      });
    }
  }, [advertiser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (advertiser) {
        // Update existing
        const { error } = await supabase
          .from("advertisers")
          .update(formData)
          .eq("id", advertiser.id);

        if (error) throw error;
        toast.success("Advertiser updated successfully");
      } else {
        // Create new
        const { error } = await supabase
          .from("advertisers")
          .insert({
            ...formData,
            owner_profile_id: user.id,
          });

        if (error) throw error;
        toast.success("Advertiser created successfully");
      }

      onClose();
    } catch (error: any) {
      console.error("Error saving advertiser:", error);
      toast.error(error.message || "Failed to save advertiser");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {advertiser ? "Edit Advertiser" : "Create Advertiser"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="primary_goal">Industry</Label>
              <Input
                id="primary_goal"
                value={formData.primary_goal}
                onChange={(e) =>
                  setFormData({ ...formData, primary_goal: e.target.value })
                }
                placeholder="e.g., Consumer Electronics, SaaS"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_name">Contact Name *</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) =>
                  setFormData({ ...formData, contact_name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) =>
                  setFormData({ ...formData, contact_email: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) =>
                  setFormData({ ...formData, contact_phone: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="website_url">Website</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) =>
                  setFormData({ ...formData, website_url: e.target.value })
                }
                placeholder="https://"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="business_description">Description</Label>
            <Textarea
              id="business_description"
              value={formData.business_description}
              onChange={(e) =>
                setFormData({ ...formData, business_description: e.target.value })
              }
              rows={3}
              placeholder="Describe the advertiser's business..."
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {advertiser ? "Update" : "Create"} Advertiser
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
