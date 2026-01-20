import { useState, useEffect } from "react";
import { IntentToFileFormData } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, Clock, MapPin, Phone, Mail, Loader2 } from "lucide-react";

interface Props {
  formData: IntentToFileFormData;
  updateFormData: (updates: Partial<IntentToFileFormData>) => void;
}

interface VSORepresentative {
  id: string;
  full_name: string;
  organization_name: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  accreditation_type: string;
}

export function RepAssignmentStep({ formData, updateFormData }: Props) {
  const [reps, setReps] = useState<VSORepresentative[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (formData.state && formData.repChoice === "vso") {
      loadReps();
    }
  }, [formData.state, formData.repChoice]);

  const loadReps = async () => {
    if (!formData.state) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("vso_representatives")
        .select("id, full_name, organization_name, city, state, phone, email, accreditation_type")
        .eq("state", formData.state)
        .limit(5);

      if (error) throw error;
      setReps(data || []);
    } catch (error) {
      console.error("Error loading reps:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepSelect = (rep: VSORepresentative) => {
    updateFormData({
      selectedRepId: rep.id,
      selectedRepName: rep.full_name,
      selectedRepOrg: rep.organization_name,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Choose Your Representative</h2>
        <p className="text-muted-foreground">
          An accredited representative can help you file and maximize your claim.
        </p>
      </div>

      <RadioGroup
        value={formData.repChoice}
        onValueChange={(value) => {
          updateFormData({ 
            repChoice: value as IntentToFileFormData["repChoice"],
            selectedRepId: null,
            selectedRepName: null,
            selectedRepOrg: null,
          });
        }}
        className="space-y-4"
      >
        {/* VSO Option */}
        <Label
          htmlFor="vso"
          className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
            formData.repChoice === "vso"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <RadioGroupItem value="vso" id="vso" className="mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium">VSO (Veterans Service Organization)</span>
              <Badge variant="secondary">Free</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Connect with a free, accredited VSO representative in your state
            </p>
          </div>
        </Label>

        {/* Show local VSOs if selected */}
        {formData.repChoice === "vso" && (
          <div className="ml-8 space-y-3">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading representatives in {formData.state}...
              </div>
            ) : reps.length > 0 ? (
              <>
                <p className="text-sm font-medium">Recommended VSOs in your area:</p>
                {reps.map((rep) => (
                  <Card
                    key={rep.id}
                    className={`cursor-pointer transition-all ${
                      formData.selectedRepId === rep.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => handleRepSelect(rep)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{rep.full_name}</p>
                          {rep.organization_name && (
                            <p className="text-sm text-muted-foreground">{rep.organization_name}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {rep.city && rep.state && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {rep.city}, {rep.state}
                              </span>
                            )}
                          </div>
                        </div>
                        {formData.selectedRepId === rep.id && (
                          <Badge>Selected</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-4">
                No VSOs found in {formData.state}. You can still proceed - we'll help connect you with one.
              </p>
            )}
          </div>
        )}

        {/* Claims Partner Option */}
        <Label
          htmlFor="claims_partner"
          className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
            formData.repChoice === "claims_partner"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <RadioGroupItem value="claims_partner" id="claims_partner" className="mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Claims Partner</span>
              <Badge variant="outline">Premium Service</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Work with a professional claims agent who specializes in maximizing ratings
            </p>
          </div>
        </Label>

        {/* Later Option */}
        <Label
          htmlFor="later"
          className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
            formData.repChoice === "later"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <RadioGroupItem value="later" id="later" className="mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="font-medium">I'll choose later</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Proceed with your Intent to File and choose a representative later
            </p>
          </div>
        </Label>
      </RadioGroup>

      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 mt-6">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Important:</strong> To submit your claim to the VA, you'll need to appoint a 
          representative using VA Form 21-22 (VSO) or 21-22a (Attorney/Agent). We'll generate 
          the correct form for you.
        </p>
      </div>
    </div>
  );
}
