import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Phone, Mail, Building2, ExternalLink, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Representative {
  id: string;
  full_name: string;
  organization_name: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  accreditation_type: string | null;
}

interface FindRepFormProps {
  onRepSelected?: (rep: Representative) => void;
  onClose?: () => void;
}

type RepType = "vso" | "attorney" | "claims_agent" | "any";

export function FindRepForm({ onRepSelected, onClose }: FindRepFormProps) {
  const [step, setStep] = useState<"form" | "results" | "contact">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [repType, setRepType] = useState<RepType>("vso");
  const [radius, setRadius] = useState("50");
  const [results, setResults] = useState<Representative[]>([]);
  const [selectedRep, setSelectedRep] = useState<Representative | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchReps = async () => {
    if (!zipCode || zipCode.length < 5) {
      toast.error("Please enter a valid ZIP code");
      return;
    }

    setIsLoading(true);
    try {
      // Extract state from ZIP (simplified - in production would use a ZIP API)
      // For now, we'll search by the first 2 digits pattern or let backend handle it
      const typeMap: Record<RepType, string | null> = {
        vso: "Accredited VSO Representative",
        attorney: "Accredited Attorney",
        claims_agent: "Accredited Claims Agent",
        any: null,
      };

      let query = supabase
        .from("vso_representatives")
        .select("id, full_name, organization_name, city, state, phone, email, accreditation_type")
        .eq("is_active", true)
        .limit(10);

      if (typeMap[repType]) {
        query = query.eq("accreditation_type", typeMap[repType]);
      }

      const { data, error } = await query;

      if (error) throw error;

      setResults(data || []);
      setStep("results");

      if (!data || data.length === 0) {
        toast.info("No representatives found. Try a different ZIP or rep type.");
      }
    } catch (error) {
      console.error("Rep search error:", error);
      toast.error("Unable to search representatives. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRep = (rep: Representative) => {
    setSelectedRep(rep);
    setStep("contact");
    onRepSelected?.(rep);
  };

  const handleRequestContact = async () => {
    if (!contactForm.name || !contactForm.email) {
      toast.error("Please provide your name and email");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("veteran_leads").insert({
        full_name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone || null,
        source: "find-a-rep",
        intent_type: "rep_request",
        status: "new",
        notes: `Requested contact with: ${selectedRep?.full_name} (${selectedRep?.organization_name || selectedRep?.accreditation_type}). Message: ${contactForm.message || "No message"}`,
      });

      if (error) throw error;

      toast.success("Request submitted! A representative will contact you soon.");
      onClose?.();
    } catch (error) {
      console.error("Lead submission error:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "form") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="zip">Your ZIP Code</Label>
          <Input
            id="zip"
            placeholder="e.g. 22314"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
            maxLength={5}
          />
        </div>

        <div className="space-y-2">
          <Label>Representative Type</Label>
          <RadioGroup value={repType} onValueChange={(v) => setRepType(v as RepType)} className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="vso" id="vso" />
              <Label htmlFor="vso" className="font-normal cursor-pointer">
                VSO Representative (free, recommended)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="attorney" id="attorney" />
              <Label htmlFor="attorney" className="font-normal cursor-pointer">
                Attorney (may charge fees)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="claims_agent" id="claims_agent" />
              <Label htmlFor="claims_agent" className="font-normal cursor-pointer">
                Claims Agent (may charge fees)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="any" id="any" />
              <Label htmlFor="any" className="font-normal cursor-pointer">
                Show all types
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Search Radius</Label>
          <Select value={radius} onValueChange={setRadius}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 miles</SelectItem>
              <SelectItem value="50">50 miles</SelectItem>
              <SelectItem value="100">100 miles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={searchReps} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            "Find Representatives"
          )}
        </Button>
      </div>
    );
  }

  if (step === "results") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">
            {results.length} Representative{results.length !== 1 ? "s" : ""} Found
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setStep("form")}>
            ← New Search
          </Button>
        </div>

        {results.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No representatives found for your criteria. Try adjusting your search.
          </p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {results.map((rep) => (
              <Card key={rep.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{rep.full_name}</h4>
                      {rep.organization_name && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {rep.organization_name}
                        </p>
                      )}
                      {(rep.city || rep.state) && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {[rep.city, rep.state].filter(Boolean).join(", ")}
                        </p>
                      )}
                      {rep.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {rep.phone}
                        </p>
                      )}
                      <p className="text-xs text-primary mt-1">{rep.accreditation_type}</p>
                    </div>
                    <Button size="sm" onClick={() => handleSelectRep(rep)}>
                      <UserCheck className="w-4 h-4 mr-1" />
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Contact form step
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Request Contact</h3>
        <Button variant="ghost" size="sm" onClick={() => setStep("results")}>
          ← Back to Results
        </Button>
      </div>

      {selectedRep && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3">
            <p className="font-medium">{selectedRep.full_name}</p>
            <p className="text-sm text-muted-foreground">
              {selectedRep.organization_name || selectedRep.accreditation_type}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <div>
          <Label htmlFor="contact-name">Your Name *</Label>
          <Input
            id="contact-name"
            value={contactForm.name}
            onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="contact-email">Email *</Label>
          <Input
            id="contact-email"
            type="email"
            value={contactForm.email}
            onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="contact-phone">Phone (optional)</Label>
          <Input
            id="contact-phone"
            value={contactForm.phone}
            onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="contact-message">Brief message (optional)</Label>
          <Input
            id="contact-message"
            placeholder="e.g. I need help with my PTSD claim"
            value={contactForm.message}
            onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
          />
        </div>
      </div>

      <Button onClick={handleRequestContact} disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          "Request Contact"
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By submitting, you consent to being contacted about your VA claim.
      </p>
    </div>
  );
}
