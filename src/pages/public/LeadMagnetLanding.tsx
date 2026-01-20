import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLeadMagnetBySlug } from "@/hooks/useLeadMagnets";
import { 
  FileText, Download, Check, Loader2, ArrowRight,
  Sparkles, Users, Calendar, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email").max(255),
  userType: z.enum(["creator", "brand", "event"]),
  gdprConsent: z.boolean().refine(val => val === true, { message: "You must agree to the privacy policy" }),
});

interface FormState {
  name: string;
  email: string;
  userType: "creator" | "brand" | "event";
  gdprConsent: boolean;
}

type FormData = z.infer<typeof formSchema>;

// Default lead magnets for static routes
const DEFAULT_LEAD_MAGNETS: Record<string, {
  title: string;
  description: string;
  slug: string;
  bullets: string[];
  gradient: string;
  icon: React.ElementType;
  category: string;
}> = {
  "blueprint": {
    title: "Creator Growth Blueprint",
    description: "A step-by-step framework for creators to grow audience, scale monetization, and optimize multi-platform distribution.",
    slug: "creator-growth-blueprint",
    bullets: [
      "Proven strategies to grow your audience across platforms",
      "Monetization frameworks used by top creators",
      "Multi-platform distribution optimization techniques",
      "AI-powered content repurposing strategies",
      "Analytics and metrics that actually matter"
    ],
    gradient: "from-[#053877] to-[#2C6BED]",
    icon: Users,
    category: "Creators"
  },
  "roi-playbook": {
    title: "Brand ROI Advertising Playbook",
    description: "A data-driven guide for brands on tracking influencer campaigns, attribution, ROI forecasting, and media optimization.",
    slug: "brand-roi-playbook",
    bullets: [
      "Complete attribution tracking setup guide",
      "ROI forecasting models and templates",
      "Influencer campaign measurement frameworks",
      "Media mix optimization strategies",
      "Real-world case studies with metrics"
    ],
    gradient: "from-purple-600 to-purple-400",
    icon: TrendingUp,
    category: "Brands & Agencies"
  },
  "event-growth-kit": {
    title: "Event Growth & Engagement Kit",
    description: "A toolkit for event planners to grow attendance, increase engagement, and drive post-event lead generation.",
    slug: "event-growth-kit",
    bullets: [
      "Pre-event promotion playbook",
      "Engagement tactics for virtual & hybrid events",
      "Post-event lead nurturing sequences",
      "Attendee experience optimization",
      "Sponsorship value maximization"
    ],
    gradient: "from-green-600 to-emerald-400",
    icon: Calendar,
    category: "Events"
  }
};

export default function LeadMagnetLanding() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormState>({
    name: "",
    email: "",
    userType: "creator",
    gdprConsent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Try to fetch from database first
  const { data: dbLeadMagnet, isLoading } = useLeadMagnetBySlug(slug || "");
  
  // Use database data or fall back to static data
  const staticData = slug ? DEFAULT_LEAD_MAGNETS[slug] : null;
  
  const leadMagnet = dbLeadMagnet || (staticData ? {
    id: slug,
    title: staticData.title,
    description: staticData.description,
    slug: staticData.slug,
    bullets: staticData.bullets,
    storage_path: `${staticData.slug}.pdf`,
    audience_roles: [],
    is_active: true,
    download_count: 0,
    created_at: "",
    updated_at: ""
  } : null);

  const gradient = staticData?.gradient || "from-[#053877] to-[#2C6BED]";
  const Icon = staticData?.icon || FileText;
  const category = staticData?.category || "General";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!leadMagnet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Resource Not Found</h1>
          <p className="text-muted-foreground mb-4">This lead magnet doesn't exist or is no longer available.</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-lead-magnet", {
        body: {
          name: formData.name,
          email: formData.email,
          persona: formData.userType,
          offerId: leadMagnet.slug,
          offerTitle: leadMagnet.title,
          pdfPath: leadMagnet.storage_path,
          bullets: leadMagnet.bullets,
          source: "landing_page",
        },
      });

      if (error) throw error;

      // Navigate to thank you page with download URL
      navigate(`/thank-you/${slug}`, { 
        state: { 
          downloadUrl: data.downloadUrl,
          title: leadMagnet.title,
          name: formData.name
        } 
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{leadMagnet.title} | Free Download | Seeksy</title>
        <meta name="description" content={leadMagnet.description || ""} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className={`bg-gradient-to-br ${gradient} text-white`}>
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 bg-white/20 text-white border-0">
                {category}
              </Badge>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Icon className="h-10 w-10" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {leadMagnet.title}
              </h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                {leadMagnet.description}
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
            {/* What You'll Learn */}
            <div>
              <h2 className="text-2xl font-bold mb-6">What You'll Learn</h2>
              <div className="space-y-4">
                {leadMagnet.bullets?.map((bullet, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-muted-foreground">{bullet}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-medium">Instant Download</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Get immediate access to your PDF guide via email.
                </p>
              </div>
            </div>

            {/* Lead Capture Form */}
            <div>
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Download className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Download Now</h3>
                    <p className="text-sm text-muted-foreground">
                      Fill in your details to get instant access
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name || ""}
                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                        placeholder="John Doe"
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                        placeholder="john@example.com"
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <Label>I am a... *</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {[
                          { value: "creator", label: "Creator" },
                          { value: "brand", label: "Brand" },
                          { value: "event", label: "Event Host" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, userType: option.value as any }))}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                              formData.userType === option.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="gdpr"
                        checked={formData.gdprConsent}
                        onCheckedChange={(checked) => 
                          setFormData(p => ({ ...p, gdprConsent: checked as boolean }))
                        }
                      />
                      <Label htmlFor="gdpr" className="text-xs text-muted-foreground leading-tight">
                        I agree to receive this resource and occasional emails about Seeksy. 
                        I can unsubscribe anytime. View our{" "}
                        <a href="/privacy" className="underline">Privacy Policy</a>.
                      </Label>
                    </div>
                    {errors.gdprConsent && <p className="text-xs text-destructive">{errors.gdprConsent}</p>}

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Get My Free Download
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t py-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Seeksy. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
}
