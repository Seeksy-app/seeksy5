import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ChevronRight, ChevronLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  getPersonaOptions,
  fetchLeadMagnetsFromDB,
  type LeadMagnetOffer,
} from "@/config/leadMagnets";

interface LeadMagnetModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: string;
  initialPersona?: string;
}

type Step = "persona" | "offers" | "contact" | "success";

export function LeadMagnetModal({
  isOpen,
  onClose,
  source = "homepage",
  initialPersona,
}: LeadMagnetModalProps) {
  const [step, setStep] = useState<Step>(initialPersona ? "offers" : "persona");
  const [selectedPersona, setSelectedPersona] = useState<string>(initialPersona || "");
  const [selectedOffer, setSelectedOffer] = useState<LeadMagnetOffer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [offers, setOffers] = useState<LeadMagnetOffer[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    purpose: "",
  });

  const personaOptions = getPersonaOptions();

  // Load offers when persona changes
  useEffect(() => {
    if (selectedPersona) {
      setIsLoadingOffers(true);
      fetchLeadMagnetsFromDB(selectedPersona)
        .then(setOffers)
        .finally(() => setIsLoadingOffers(false));
    } else {
      setOffers([]);
    }
  }, [selectedPersona]);

  const handlePersonaSelect = (personaId: string) => {
    setSelectedPersona(personaId);
    setSelectedOffer(null);
    setStep("offers");
  };

  const handleOfferSelect = (offer: LeadMagnetOffer) => {
    setSelectedOffer(offer);
    setStep("contact");
  };

  const handleBack = () => {
    if (step === "offers") {
      setStep("persona");
      setSelectedPersona("");
    } else if (step === "contact") {
      setStep("offers");
      setSelectedOffer(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !selectedPersona) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-lead-magnet", {
        body: {
          name: formData.name,
          email: formData.email,
          company: formData.company,
          persona: selectedPersona,
          offerId: selectedOffer.id,
          offerTitle: selectedOffer.title,
          pdfPath: selectedOffer.pdfPath,
          purpose: formData.purpose,
          source,
          bullets: selectedOffer.bullets,
        },
      });

      if (error) throw error;

      setStep("success");
      toast.success("Your report is on the way!");
    } catch (error) {
      console.error("Error sending lead magnet:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(initialPersona ? "offers" : "persona");
    setSelectedPersona(initialPersona || "");
    setSelectedOffer(null);
    setFormData({ name: "", email: "", company: "", purpose: "" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4"
          >
            <div className="bg-background rounded-2xl shadow-2xl overflow-hidden border">
              <div className="relative bg-gradient-to-r from-[#053877] to-[#2C6BED] p-6 text-white">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                {step !== "success" && (
                  <div className="flex items-center gap-2 text-sm text-white/80 mb-2">
                    <span className={step === "persona" ? "text-white font-medium" : ""}>1. You</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className={step === "offers" ? "text-white font-medium" : ""}>2. Report</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className={step === "contact" ? "text-white font-medium" : ""}>3. Delivery</span>
                  </div>
                )}

                <h2 className="text-xl font-bold">
                  {step === "persona" && "What best describes you?"}
                  {step === "offers" && "Choose your free report"}
                  {step === "contact" && "Where should we send it?"}
                  {step === "success" && "You're all set! 🎉"}
                </h2>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {step === "persona" && (
                    <motion.div
                      key="persona"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="grid grid-cols-2 gap-3"
                    >
                      {personaOptions.map((persona) => (
                        <button
                          key={persona.id}
                          onClick={() => handlePersonaSelect(persona.id)}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                            "hover:border-primary hover:bg-primary/5",
                            selectedPersona === persona.id
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          )}
                        >
                          <span className="text-2xl">{persona.icon}</span>
                          <span className="font-medium text-sm">{persona.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {step === "offers" && (
                    <motion.div
                      key="offers"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-3"
                    >
                      <button
                        onClick={handleBack}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Change persona
                      </button>

                      {isLoadingOffers ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : offers.length > 0 ? (
                        offers.map((offer) => (
                          <button
                            key={offer.id}
                            onClick={() => handleOfferSelect(offer)}
                            className={cn(
                              "w-full p-4 rounded-xl border-2 transition-all text-left",
                              "hover:border-primary hover:bg-primary/5",
                              selectedOffer?.id === offer.id
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <Download className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <h3 className="font-semibold text-sm mb-1">{offer.title}</h3>
                                <p className="text-xs text-muted-foreground">{offer.description}</p>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No reports available for this persona yet.
                        </p>
                      )}
                    </motion.div>
                  )}

                  {step === "contact" && selectedOffer && (
                    <motion.div
                      key="contact"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <button
                        onClick={handleBack}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Choose different report
                      </button>

                      <div className="bg-muted/50 rounded-lg p-3 mb-4">
                        <p className="text-sm font-medium">{selectedOffer.title}</p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="name" className="text-xs">Name</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Your name"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="company" className="text-xs">Company</Label>
                            <Input
                              id="company"
                              value={formData.company}
                              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                              placeholder="Optional"
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="email" className="text-xs">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="you@example.com"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="purpose" className="text-xs">What are you looking to achieve?</Label>
                          <Input
                            id="purpose"
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                            placeholder="Optional"
                            className="mt-1"
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-[#2C6BED] hover:bg-[#2C6BED]/90"
                          disabled={isSubmitting || !formData.email}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Get My Free Report
                            </>
                          )}
                        </Button>

                        <p className="text-xs text-muted-foreground text-center">
                          We respect your privacy. No spam, ever.
                        </p>
                      </form>
                    </motion.div>
                  )}

                  {step === "success" && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6"
                    >
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Your report is on the way!</h3>
                      <p className="text-muted-foreground text-sm mb-6">
                        Check your inbox at <strong>{formData.email}</strong> for your personalized report.
                      </p>
                      <Button onClick={handleClose} variant="outline">
                        Close
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
