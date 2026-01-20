import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, DollarSign, Loader2, Trophy, Upload } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import ImageUpload from "@/components/ImageUpload";

export default function PurchaseSponsorship() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [sponsorInfo, setSponsorInfo] = useState({
    sponsor_name: "",
    sponsor_email: "",
    sponsor_website_url: "",
    sponsor_logo_url: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    tiktok: "",
    facebook: "",
    hashtags: "",
    mentions: "",
  });

  const { data: program, isLoading: programLoading } = useQuery({
    queryKey: ["awards-program-public", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("awards_programs")
        .select("*, sponsorship_flyer_url")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ["sponsorship-packages-public", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("award_sponsorship_packages")
        .select("*")
        .eq("program_id", id)
        .order("display_order");
      
      if (error) throw error;
      return data;
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const selectedPkg = packages?.find(p => p.id === selectedPackage);
      if (!selectedPkg) throw new Error("Package not found");

      // Prepare social media handles
      const socialMediaHandles = {
        instagram: sponsorInfo.instagram || null,
        twitter: sponsorInfo.twitter || null,
        linkedin: sponsorInfo.linkedin || null,
        tiktok: sponsorInfo.tiktok || null,
        facebook: sponsorInfo.facebook || null,
      };

      // Prepare hashtags and mentions arrays
      const hashtagsArray = sponsorInfo.hashtags
        .split(",")
        .map(h => h.trim())
        .filter(h => h.length > 0);
      
      const mentionsArray = sponsorInfo.mentions
        .split(",")
        .map(m => m.trim())
        .filter(m => m.length > 0);

      // Create Stripe payment session (which also creates sponsorship record)
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        "awards-create-sponsorship-payment",
        {
          body: {
            programId: id,
            packageId: selectedPackage,
            sponsorName: sponsorInfo.sponsor_name,
            sponsorEmail: sponsorInfo.sponsor_email,
            sponsorWebsiteUrl: sponsorInfo.sponsor_website_url || null,
            sponsorLogoUrl: sponsorInfo.sponsor_logo_url || null,
            socialMediaHandles,
            hashtags: hashtagsArray,
            mentions: mentionsArray,
          },
        }
      );

      if (paymentError) throw paymentError;
      if (!paymentData?.url) throw new Error("No payment URL received");

      return { paymentUrl: paymentData.url };
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.open(data.paymentUrl, "_blank");
      toast.success("Redirecting to payment...");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to process payment");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) {
      toast.error("Please select a sponsorship package");
      return;
    }
    createPaymentMutation.mutate();
  };

  if (programLoading || packagesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-brand-gold" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Program Not Found</h1>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const selectedPkg = packages?.find(p => p.id === selectedPackage);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-brand-navy text-white py-12">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/awards/${id}/vote`)}
            className="text-white hover:text-white/80 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Program
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-brand-gold" />
            <h1 className="text-3xl font-bold">{program.title}</h1>
          </div>
          <p className="text-white/80">Become a Sponsor</p>
          {program.ceremony_date && (
            <Badge variant="secondary" className="mt-2">
              Ceremony: {format(new Date(program.ceremony_date), "MMMM d, yyyy")}
            </Badge>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Sponsorship Flyer Section */}
        {(program as any).sponsorship_flyer_url && (
          <Card className="mb-8 p-6 border-brand-gold/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Sponsorship Information</h2>
                <p className="text-sm text-muted-foreground">
                  View our sponsorship flyer for detailed package information
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.open((program as any).sponsorship_flyer_url, "_blank")}
                className="border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-white"
              >
                <Upload className="mr-2 h-4 w-4" />
                View Flyer
              </Button>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sponsorship Packages */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Select a Sponsorship Package</h2>
            
          {packages && packages.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {packages.map((pkg) => {
                  const feeConfig = (pkg.fee_configuration as any) || { creator_percentage: 0 };
                  const hasServiceFee = feeConfig.creator_percentage > 0;
                  const serviceFee = hasServiceFee 
                    ? Number(pkg.price) * (feeConfig.creator_percentage / 100) + 10.95
                    : 0;
                  const totalPrice = Number(pkg.price) + serviceFee;

                  return (
                    <Card
                      key={pkg.id}
                      className={`p-6 cursor-pointer transition-all ${
                        selectedPackage === pkg.id
                          ? "border-2 border-brand-gold shadow-glow"
                          : "border-brand-gold/20 hover:border-brand-gold/50"
                      }`}
                      onClick={() => setSelectedPackage(pkg.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-xl">{pkg.package_name}</h3>
                          <p className="text-3xl font-bold text-brand-gold mt-2">
                            ${Number(pkg.price).toLocaleString()}
                          </p>
                          {hasServiceFee && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Total with fees: ${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                        <div className={`rounded-full p-1 ${
                          selectedPackage === pkg.id ? "bg-brand-gold" : "border-2 border-muted"
                        }`}>
                          {selectedPackage === pkg.id && <Check className="h-4 w-4 text-white" />}
                        </div>
                      </div>

                      {pkg.package_description && (
                        <p className="text-sm text-muted-foreground mb-4">{pkg.package_description}</p>
                      )}

                      {pkg.benefits && (pkg.benefits as string[]).length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">BENEFITS:</p>
                          <ul className="space-y-2">
                            {(pkg.benefits as string[]).map((benefit, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="text-brand-gold mt-1">•</span>
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {pkg.max_sponsors && pkg.max_sponsors > 1 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-muted-foreground">
                            Limited availability
                          </p>
                        </div>
                      )}
                      {pkg.max_sponsors === 1 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-muted-foreground">
                            Limited to 1 sponsor
                          </p>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-12 text-center border-dashed">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  No sponsorship packages available at this time
                </p>
              </Card>
            )}
          </div>

          {/* Sponsor Information Form */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h3 className="text-xl font-bold mb-4">Your Information</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="sponsor_name">
                    Name / Company Name *
                  </Label>
                  <Input
                    id="sponsor_name"
                    value={sponsorInfo.sponsor_name}
                    onChange={(e) => setSponsorInfo({ ...sponsorInfo, sponsor_name: e.target.value })}
                    placeholder="Enter your name or company"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="sponsor_email">
                    Email Address *
                  </Label>
                  <Input
                    id="sponsor_email"
                    type="email"
                    value={sponsorInfo.sponsor_email}
                    onChange={(e) => setSponsorInfo({ ...sponsorInfo, sponsor_email: e.target.value })}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="sponsor_website">
                    Website / CTA URL (Optional)
                  </Label>
                  <Input
                    id="sponsor_website"
                    type="url"
                    value={sponsorInfo.sponsor_website_url}
                    onChange={(e) => setSponsorInfo({ ...sponsorInfo, sponsor_website_url: e.target.value })}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div>
                  <Label>Logo Upload (Optional)</Label>
                  <ImageUpload
                    currentImage={sponsorInfo.sponsor_logo_url}
                    onImageUploaded={(url) => setSponsorInfo({ ...sponsorInfo, sponsor_logo_url: url })}
                    bucket="avatars"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Social Media Handles (Optional)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Instagram"
                      value={sponsorInfo.instagram}
                      onChange={(e) => setSponsorInfo({ ...sponsorInfo, instagram: e.target.value })}
                    />
                    <Input
                      placeholder="Twitter/X"
                      value={sponsorInfo.twitter}
                      onChange={(e) => setSponsorInfo({ ...sponsorInfo, twitter: e.target.value })}
                    />
                    <Input
                      placeholder="LinkedIn"
                      value={sponsorInfo.linkedin}
                      onChange={(e) => setSponsorInfo({ ...sponsorInfo, linkedin: e.target.value })}
                    />
                    <Input
                      placeholder="TikTok"
                      value={sponsorInfo.tiktok}
                      onChange={(e) => setSponsorInfo({ ...sponsorInfo, tiktok: e.target.value })}
                    />
                    <Input
                      placeholder="Facebook"
                      value={sponsorInfo.facebook}
                      onChange={(e) => setSponsorInfo({ ...sponsorInfo, facebook: e.target.value })}
                      className="col-span-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="hashtags">
                    Hashtags (Optional)
                  </Label>
                  <Input
                    id="hashtags"
                    value={sponsorInfo.hashtags}
                    onChange={(e) => setSponsorInfo({ ...sponsorInfo, hashtags: e.target.value })}
                    placeholder="#example, #hashtags, #separated"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Separate with commas</p>
                </div>

                <div>
                  <Label htmlFor="mentions">
                    Mentions (Optional)
                  </Label>
                  <Input
                    id="mentions"
                    value={sponsorInfo.mentions}
                    onChange={(e) => setSponsorInfo({ ...sponsorInfo, mentions: e.target.value })}
                    placeholder="@username1, @username2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Separate with commas</p>
                </div>

                <div className="pt-4 border-t">
                  {selectedPkg && (() => {
                    const feeConfig = (selectedPkg.fee_configuration as any) || { creator_percentage: 0 };
                    const hasServiceFee = feeConfig.creator_percentage > 0;
                    const serviceFee = hasServiceFee 
                      ? Number(selectedPkg.price) * (feeConfig.creator_percentage / 100) + 10.95
                      : 0;
                    const totalPrice = Number(selectedPkg.price) + serviceFee;

                    return (
                      <div className="mb-4 p-3 bg-brand-gold/10 rounded-lg space-y-2">
                        <p className="text-sm font-medium mb-1">Selected Package:</p>
                        <p className="font-bold">{selectedPkg.package_name}</p>
                        <div className="pt-2 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Package Price:</span>
                            <span className="font-semibold">${Number(selectedPkg.price).toFixed(2)}</span>
                          </div>
                          {hasServiceFee && (
                            <>
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Service Fee ({feeConfig.creator_percentage}% + $10.95):</span>
                                <span>${serviceFee.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm font-bold pt-2 border-t">
                                <span>Total:</span>
                                <span className="text-brand-gold">${totalPrice.toFixed(2)}</span>
                              </div>
                            </>
                          )}
                          {!hasServiceFee && (
                            <p className="text-2xl font-bold text-brand-gold mt-2">
                              ${Number(selectedPkg.price).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <Button
                    type="submit"
                    className="w-full bg-brand-gold hover:bg-brand-darkGold text-white"
                    disabled={!selectedPackage || createPaymentMutation.isPending}
                  >
                    {createPaymentMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-3">
                    You'll receive payment instructions via email
                  </p>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
