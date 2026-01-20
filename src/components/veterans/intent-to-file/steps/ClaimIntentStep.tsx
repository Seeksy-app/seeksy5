import { IntentToFileFormData, CLAIM_CATEGORIES, INTENT_TYPES } from "../types";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FileText, Plus, TrendingUp, Link2, Scale } from "lucide-react";

interface Props {
  formData: IntentToFileFormData;
  updateFormData: (updates: Partial<IntentToFileFormData>) => void;
}

const intentIcons = {
  new_claim: FileText,
  increase: TrendingUp,
  secondary: Link2,
  appeal: Scale,
};

export function ClaimIntentStep({ formData, updateFormData }: Props) {
  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    const newCategories = checked
      ? [...formData.claimCategories, categoryId]
      : formData.claimCategories.filter((c) => c !== categoryId);
    
    // Also remove conditions from that category if unchecked
    const category = CLAIM_CATEGORIES.find(c => c.id === categoryId);
    const newConditions = checked 
      ? formData.conditions 
      : formData.conditions.filter(c => !category?.conditions.includes(c));
    
    updateFormData({ 
      claimCategories: newCategories,
      conditions: newConditions
    });
  };

  const handleConditionToggle = (condition: string, checked: boolean) => {
    const newConditions = checked
      ? [...formData.conditions, condition]
      : formData.conditions.filter((c) => c !== condition);
    updateFormData({ conditions: newConditions });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">What Are You Claiming?</h2>
        <p className="text-muted-foreground">
          Select the type of claim and conditions you want to file for.
        </p>
      </div>

      {/* Intent Type */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Claim Type *</Label>
        <RadioGroup
          value={formData.intentType}
          onValueChange={(value) => updateFormData({ intentType: value as IntentToFileFormData["intentType"] })}
          className="grid md:grid-cols-2 gap-3"
        >
          {INTENT_TYPES.map((type) => {
            const Icon = intentIcons[type.value as keyof typeof intentIcons];
            return (
              <Label
                key={type.value}
                htmlFor={type.value}
                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                  formData.intentType === type.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{type.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                </div>
              </Label>
            );
          })}
        </RadioGroup>
      </div>

      {/* First Time Filer */}
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
        <Checkbox
          id="firstTimeFiler"
          checked={formData.isFirstTimeFiler}
          onCheckedChange={(checked) => updateFormData({ isFirstTimeFiler: checked === true })}
        />
        <Label htmlFor="firstTimeFiler" className="cursor-pointer">
          This is my first time filing a VA disability claim
        </Label>
      </div>

      {/* Condition Categories */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Conditions to Claim *</Label>
        <p className="text-sm text-muted-foreground">
          Select all categories that apply, then choose specific conditions.
        </p>

        <div className="space-y-4">
          {CLAIM_CATEGORIES.map((category) => {
            const isSelected = formData.claimCategories.includes(category.id);
            return (
              <Card
                key={category.id}
                className={`p-4 transition-all ${
                  isSelected ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={category.id}
                    checked={isSelected}
                    onCheckedChange={(checked) => handleCategoryToggle(category.id, checked === true)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={category.id} className="font-medium cursor-pointer">
                      {category.label}
                    </Label>
                    
                    {isSelected && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {category.conditions.map((condition) => (
                          <Badge
                            key={condition}
                            variant={formData.conditions.includes(condition) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => handleConditionToggle(
                              condition, 
                              !formData.conditions.includes(condition)
                            )}
                          >
                            {formData.conditions.includes(condition) ? "✓ " : "+ "}
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {formData.conditions.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Selected conditions ({formData.conditions.length}):</strong>{" "}
            {formData.conditions.join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
