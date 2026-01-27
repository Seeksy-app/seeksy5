import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, DollarSign, Copy } from "lucide-react";

interface EventSponsorshipPackageManagerProps {
  eventId: string;
}

export function EventSponsorshipPackageManager({ eventId }: EventSponsorshipPackageManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    package_name: "",
    package_description: "",
    price: "",
    max_sponsors: "",
    benefits: [""],
  });

  const queryClient = useQueryClient();

  const { data: packages } = useQuery({
    queryKey: ["event-sponsorship-packages", eventId],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("event_sponsorship_packages")
        .select(`
          *,
          event_sponsorships!event_sponsorships_package_id_fkey(
            id,
            status
          )
        `)
        .eq("event_id", eventId)
        .order("display_order", { ascending: true });

      if (result.error) throw result.error;
      return (result.data || []) as any[];
    },
  });

  const handleAddBenefit = () => {
    setFormData({ ...formData, benefits: [...formData.benefits, ""] });
  };

  const handleBenefitChange = (index: number, value: string) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData({ ...formData, benefits: newBenefits });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const filteredBenefits = formData.benefits.filter((b) => b.trim() !== "");
      
      if (filteredBenefits.length === 0) {
        toast.error("Please add at least one benefit");
        return;
      }

      const result = await (supabase as any)
        .from("event_sponsorship_packages")
        .insert({
          event_id: eventId,
          package_name: formData.package_name,
          package_description: formData.package_description || null,
          price: parseFloat(formData.price),
          max_sponsors: formData.max_sponsors ? parseInt(formData.max_sponsors) : null,
          benefits: filteredBenefits,
        });

      if (result.error) throw result.error;

      toast.success("Sponsorship package created successfully!");
      queryClient.invalidateQueries({ queryKey: ["event-sponsorship-packages", eventId] });
      
      setFormData({
        package_name: "",
        package_description: "",
        price: "",
        max_sponsors: "",
        benefits: [""],
      });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error creating package:", error);
      toast.error(error.message || "Failed to create sponsorship package");
    } finally {
      setLoading(false);
    }
  };

  const copySponsorshipLink = async () => {
    const url = `${window.location.origin}/sponsorship/event/${eventId}`;
    await navigator.clipboard.writeText(url);
    toast.success("Sponsorship link copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Sponsorship Packages</h2>
          <p className="text-muted-foreground mt-1">
            Create sponsorship opportunities for your event
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copySponsorshipLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Sponsor Link
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Package
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Sponsorship Package</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="package_name">Package Name *</Label>
                  <Input
                    id="package_name"
                    value={formData.package_name}
                    onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                    placeholder="e.g., Platinum Sponsor"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="package_description">Description</Label>
                  <Textarea
                    id="package_description"
                    value={formData.package_description}
                    onChange={(e) => setFormData({ ...formData, package_description: e.target.value })}
                    placeholder="Describe what this sponsorship includes..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="5000.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_sponsors">Max Sponsors</Label>
                    <Input
                      id="max_sponsors"
                      type="number"
                      min="1"
                      value={formData.max_sponsors}
                      onChange={(e) => setFormData({ ...formData, max_sponsors: e.target.value })}
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Benefits *</Label>
                  {formData.benefits.map((benefit, index) => (
                    <Input
                      key={index}
                      value={benefit}
                      onChange={(e) => handleBenefitChange(index, e.target.value)}
                      placeholder="e.g., Logo on event materials"
                    />
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={handleAddBenefit}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Benefit
                  </Button>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Creating..." : "Create Package"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {packages?.map((pkg: any) => {
          const paidSponsors = pkg.event_sponsorships?.filter((s: any) => s.status === 'paid').length || 0;
          return (
            <Card key={pkg.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{pkg.package_name}</span>
                  <span className="flex items-center text-primary">
                    <DollarSign className="h-4 w-4" />
                    {pkg.price.toLocaleString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pkg.package_description && (
                  <p className="text-sm text-muted-foreground">{pkg.package_description}</p>
                )}
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Benefits:</h4>
                  <ul className="space-y-1">
                    {(pkg.benefits as string[]).map((benefit: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {pkg.max_sponsors && (
                  <div className="text-sm text-muted-foreground">
                    {paidSponsors} / {pkg.max_sponsors} sponsors
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!packages || packages.length === 0) && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <DollarSign className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg mb-2">No sponsorship packages yet</h3>
              <p className="text-muted-foreground mb-4">
                Create sponsorship packages to attract sponsors for your event
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
