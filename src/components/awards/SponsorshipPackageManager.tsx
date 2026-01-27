import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, DollarSign, Copy, Info } from "lucide-react";

interface SponsorshipPackageManagerProps {
  programId: string;
}

export function SponsorshipPackageManager({ programId }: SponsorshipPackageManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    package_name: "",
    package_description: "",
    price: "",
    logo_size: "medium" as const,
    max_sponsors: "",
    benefits: [""],
    addServiceFee: false,
    serviceFeePercentage: "4",
  });

  const { data: packages, refetch } = useQuery({
    queryKey: ["sponsorship-packages", programId],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("award_sponsorship_packages")
        .select("*")
        .eq("program_id", programId)
        .order("display_order");
      
      if (result.error) throw result.error;

      // Fetch sponsor counts for each package
      const packagesWithCounts = await Promise.all(
        (result.data || []).map(async (pkg: any) => {
          const countResult = await (supabase as any)
            .from("award_sponsorships")
            .select("*", { count: "exact", head: true })
            .eq("package_id", pkg.id)
            .eq("status", "paid");

          return { ...pkg, currentSponsors: countResult.count || 0 };
        })
      );
      
      return packagesWithCounts as any[];
    },
  });

  const handleAddBenefit = () => {
    setFormData({
      ...formData,
      benefits: [...formData.benefits, ""],
    });
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
      // Validate service fee percentage
      if (formData.addServiceFee) {
        const feePercent = parseFloat(formData.serviceFeePercentage);
        if (feePercent < 4) {
          toast.error("Service fee must be at least 4%");
          setLoading(false);
          return;
        }
      }

      const feeConfiguration = formData.addServiceFee
        ? {
            creator_percentage: parseFloat(formData.serviceFeePercentage),
            who_pays_processing: "sponsor",
            platform_processing_fee: 10.95,
          }
        : {
            creator_percentage: 0,
            who_pays_processing: "sponsor",
          };

      const result = await (supabase as any)
        .from("award_sponsorship_packages")
        .insert({
          program_id: programId,
          package_name: formData.package_name,
          package_description: formData.package_description,
          price: parseFloat(formData.price),
          logo_size: formData.logo_size,
          max_sponsors: formData.max_sponsors ? parseInt(formData.max_sponsors) : null,
          benefits: formData.benefits.filter(b => b.trim()),
          display_order: (packages?.length || 0) + 1,
          fee_configuration: feeConfiguration,
        });

      if (result.error) throw result.error;

      toast.success("Sponsorship package created!");
      setIsDialogOpen(false);
      setFormData({
        package_name: "",
        package_description: "",
        price: "",
        logo_size: "medium",
        max_sponsors: "",
        benefits: [""],
        addServiceFee: false,
        serviceFeePercentage: "4",
      });
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to create package");
    } finally {
      setLoading(false);
    }
  };

  const copySponsorshipLink = () => {
    const link = `${window.location.origin}/awards/${programId}/sponsor`;
    navigator.clipboard.writeText(link);
    toast.success("Sponsorship link copied!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Sponsorship Packages</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create packages for sponsors to support your awards program
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copySponsorshipLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Sponsor Link
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand-gold hover:bg-brand-darkGold text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Package
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Sponsorship Package</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Package Name *</Label>
                  <Input
                    value={formData.package_name}
                    onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                    placeholder="e.g., Platinum Sponsor"
                    required
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.package_description}
                    onChange={(e) => setFormData({ ...formData, package_description: e.target.value })}
                    placeholder="Describe what sponsors get..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price ($) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="500.00"
                      required
                    />
                  </div>

                  <div>
                    <Label>Max Sponsors (optional)</Label>
                    <Input
                      type="number"
                      value={formData.max_sponsors}
                      onChange={(e) => setFormData({ ...formData, max_sponsors: e.target.value })}
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div>
                  <Label>Benefits</Label>
                  {formData.benefits.map((benefit, index) => (
                    <Input
                      key={index}
                      value={benefit}
                      onChange={(e) => handleBenefitChange(index, e.target.value)}
                      placeholder="e.g., Logo on website"
                      className="mb-2"
                    />
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={handleAddBenefit}>
                    Add Benefit
                  </Button>
                </div>

                {/* Service Fee Section */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="addServiceFee"
                      checked={formData.addServiceFee}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, addServiceFee: checked as boolean })
                      }
                    />
                    <Label
                      htmlFor="addServiceFee"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Add service fee (optional)
                    </Label>
                  </div>

                  {formData.addServiceFee && (
                    <>
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Your fee includes: <strong>{formData.serviceFeePercentage}% + $10.95</strong> (platform processing fee).
                          Minimum 4% required. This fee will be added to the sponsor's total at checkout.
                        </AlertDescription>
                      </Alert>

                      <div>
                        <Label htmlFor="serviceFeePercentage">Service Fee Percentage *</Label>
                        <Input
                          id="serviceFeePercentage"
                          type="number"
                          step="0.1"
                          min="4"
                          value={formData.serviceFeePercentage}
                          onChange={(e) => setFormData({ ...formData, serviceFeePercentage: e.target.value })}
                          placeholder="4.0"
                          required={formData.addServiceFee}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Minimum 4% required (this covers platform costs)
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Package"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {packages && packages.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => {
            const feeConfig = (pkg.fee_configuration as any) || { creator_percentage: 0 };
            const hasServiceFee = feeConfig.creator_percentage > 0;
            const currentSponsors = (pkg as any).currentSponsors || 0;
            const maxSponsors = pkg.max_sponsors;
            
            return (
              <Card key={pkg.id} className="p-6 border-brand-gold/20 hover:border-brand-gold/50 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{pkg.package_name}</h3>
                    <p className="text-2xl font-bold text-brand-gold">${Number(pkg.price).toLocaleString()}</p>
                    {hasServiceFee && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +{feeConfig.creator_percentage}% service fee + $10.95
                      </p>
                    )}
                  </div>
                  <DollarSign className="h-5 w-5 text-brand-gold" />
                </div>
                
                {pkg.package_description && (
                  <p className="text-sm text-muted-foreground mb-4">{pkg.package_description}</p>
                )}

                {pkg.benefits && (pkg.benefits as string[]).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Benefits:</p>
                    <ul className="text-sm space-y-1">
                      {(pkg.benefits as string[]).map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-brand-gold mt-1">•</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {maxSponsors && maxSponsors > 1 && (
                  <p className="text-xs text-muted-foreground mt-4">
                    {currentSponsors} of {maxSponsors} available
                  </p>
                )}
                {maxSponsors === 1 && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Limited to 1 sponsor{currentSponsors > 0 ? " (Sold)" : ""}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No sponsorship packages yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Create packages to monetize your awards program
          </p>
        </Card>
      )}
    </div>
  );
}
