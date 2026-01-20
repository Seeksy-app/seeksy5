import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { VeteranInfoStep } from "./steps/VeteranInfoStep";
import { ServiceInfoStep } from "./steps/ServiceInfoStep";
import { ClaimIntentStep } from "./steps/ClaimIntentStep";
import { RepAssignmentStep } from "./steps/RepAssignmentStep";
import { ReviewStep } from "./steps/ReviewStep";
import { SuccessStep } from "./steps/SuccessStep";
import { IntentToFileFormData, INITIAL_FORM_DATA } from "./types";

const STEPS = [
  { id: 1, title: "Your Information", description: "Basic contact details" },
  { id: 2, title: "Service History", description: "Military service details" },
  { id: 3, title: "Claim Intent", description: "What you're claiming" },
  { id: 4, title: "Representative", description: "Choose who helps you" },
  { id: 5, title: "Review", description: "Confirm your information" },
];

export function IntentToFileForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<IntentToFileFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const updateFormData = (updates: Partial<IntentToFileFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.fullName.trim() && formData.email.trim() && formData.state);
      case 2:
        return !!(formData.branch);
      case 3:
        return !!(formData.intentType && formData.conditions.length > 0);
      case 4:
        return !!(formData.repChoice);
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5 && canProceed()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();

      // Create the veteran lead
      const { data: lead, error: leadError } = await supabase
        .from("veteran_leads")
        .insert({
          user_id: user?.id || null,
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone?.trim() || null,
          dob: formData.dob || null,
          state: formData.state,
          branch: formData.branch,
          service_start_date: formData.serviceStartDate || null,
          service_end_date: formData.serviceEndDate || null,
          discharge_type: formData.dischargeType || null,
          intent_type: formData.intentType,
          is_first_time_filer: formData.isFirstTimeFiler,
          status: "prepared",
          source: "intent-to-file-form",
        })
        .select("id")
        .single();

      if (leadError) throw leadError;

      setLeadId(lead.id);

      // Create claim intents for each condition category
      const claimIntentsToInsert = formData.claimCategories.map(category => ({
        veteran_lead_id: lead.id,
        claim_category: category,
        conditions: formData.conditions.filter(c => c.startsWith(category)),
        is_secondary: formData.intentType === "secondary",
        effective_date: new Date().toISOString().split("T")[0],
      }));

      if (claimIntentsToInsert.length > 0) {
        const { error: intentsError } = await supabase
          .from("claim_intents")
          .insert(claimIntentsToInsert);

        if (intentsError) {
          console.error("Error saving claim intents:", intentsError);
        }
      }

      // Create rep assignment
      const { error: repError } = await supabase
        .from("rep_assignments")
        .insert({
          veteran_lead_id: lead.id,
          rep_type: formData.repChoice === "vso" ? "vso" : 
                    formData.repChoice === "claims_partner" ? "claims_agent" : "pending",
          rep_id: formData.selectedRepId || null,
          rep_name: formData.selectedRepName || null,
          rep_organization: formData.selectedRepOrg || null,
          assignment_method: formData.repChoice === "later" ? "manual" : "user_selected",
        });

      if (repError) {
        console.error("Error saving rep assignment:", repError);
      }

      toast.success("Your Intent to File has been prepared!");
      setIsComplete(true);

    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete && leadId) {
    return <SuccessStep leadId={leadId} formData={formData} />;
  }

  const progress = (currentStep / 5) * 100;

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-xl">Step {currentStep} of 5</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].title}</CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            {STEPS[currentStep - 1].description}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent className="pt-6">
        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <VeteranInfoStep formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 2 && (
            <ServiceInfoStep formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 3 && (
            <ClaimIntentStep formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 4 && (
            <RepAssignmentStep formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 5 && (
            <ReviewStep formData={formData} onEdit={setCurrentStep} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < 5 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Prepare My Intent to File"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
