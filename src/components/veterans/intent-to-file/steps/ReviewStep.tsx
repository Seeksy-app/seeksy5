import { IntentToFileFormData, US_STATES, MILITARY_BRANCHES, INTENT_TYPES, CLAIM_CATEGORIES } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, User, Shield, FileText, Users, AlertTriangle } from "lucide-react";

interface Props {
  formData: IntentToFileFormData;
  onEdit: (step: number) => void;
}

export function ReviewStep({ formData, onEdit }: Props) {
  const getStateLabel = (value: string) => US_STATES.find(s => s.value === value)?.label || value;
  const getBranchLabel = (value: string) => MILITARY_BRANCHES.find(b => b.value === value)?.label || value;
  const getIntentLabel = (value: string) => INTENT_TYPES.find(t => t.value === value)?.label || value;

  const getRepChoiceLabel = () => {
    switch (formData.repChoice) {
      case "vso":
        return formData.selectedRepName 
          ? `VSO: ${formData.selectedRepName}${formData.selectedRepOrg ? ` (${formData.selectedRepOrg})` : ""}`
          : "VSO Representative (to be assigned)";
      case "claims_partner":
        return "Claims Partner (Premium Service)";
      case "later":
        return "Will choose later";
      default:
        return "Not selected";
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Review Your Information</h2>
        <p className="text-muted-foreground">
          Please verify everything is correct before we prepare your Intent to File.
        </p>
      </div>

      {/* Veteran Info */}
      <Card>
        <CardHeader className="py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            Your Information
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(1)}>
            <Pencil className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium">{formData.fullName}</dd>
            
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{formData.email}</dd>
            
            {formData.phone && (
              <>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="font-medium">{formData.phone}</dd>
              </>
            )}
            
            <dt className="text-muted-foreground">State</dt>
            <dd className="font-medium">{getStateLabel(formData.state)}</dd>
          </dl>
        </CardContent>
      </Card>

      {/* Service Info */}
      <Card>
        <CardHeader className="py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Service History
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(2)}>
            <Pencil className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Branch</dt>
            <dd className="font-medium">{getBranchLabel(formData.branch)}</dd>
            
            {formData.serviceStartDate && (
              <>
                <dt className="text-muted-foreground">Service Dates</dt>
                <dd className="font-medium">
                  {formData.serviceStartDate} - {formData.serviceEndDate || "Present"}
                </dd>
              </>
            )}
            
            {formData.dischargeType && (
              <>
                <dt className="text-muted-foreground">Discharge</dt>
                <dd className="font-medium capitalize">{formData.dischargeType.replace(/_/g, " ")}</dd>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Claim Intent */}
      <Card>
        <CardHeader className="py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Claim Intent
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(3)}>
            <Pencil className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{getIntentLabel(formData.intentType)}</Badge>
            {formData.isFirstTimeFiler && (
              <Badge variant="outline">First-time filer</Badge>
            )}
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">Conditions ({formData.conditions.length}):</p>
            <div className="flex flex-wrap gap-2">
              {formData.conditions.map((condition) => (
                <Badge key={condition} variant="default">
                  {condition}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Representative */}
      <Card>
        <CardHeader className="py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Representative
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(4)}>
            <Pencil className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="font-medium">{getRepChoiceLabel()}</p>
        </CardContent>
      </Card>

      {/* Final Compliance Notice */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium mb-1">Before You Submit</p>
            <p>
              By clicking "Prepare My Intent to File", you acknowledge that:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>We will prepare your claim documents but do not submit to the VA</li>
              <li>Final submission must be completed by you through VA's secure systems</li>
              <li>Your chosen representative will be notified and can assist you</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
