import { IntentToFileFormData, MILITARY_BRANCHES, DISCHARGE_TYPES } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Calendar, Award } from "lucide-react";

interface Props {
  formData: IntentToFileFormData;
  updateFormData: (updates: Partial<IntentToFileFormData>) => void;
}

export function ServiceInfoStep({ formData, updateFormData }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Service History</h2>
        <p className="text-muted-foreground">
          This helps us match you with the right representative and forms.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Branch */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="branch" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Branch of Service *
          </Label>
          <Select
            value={formData.branch}
            onValueChange={(value) => updateFormData({ branch: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your branch" />
            </SelectTrigger>
            <SelectContent>
              {MILITARY_BRANCHES.map((branch) => (
                <SelectItem key={branch.value} value={branch.value}>
                  {branch.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Service Start Date */}
        <div className="space-y-2">
          <Label htmlFor="serviceStartDate" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Service Start Date
          </Label>
          <Input
            id="serviceStartDate"
            type="date"
            value={formData.serviceStartDate}
            onChange={(e) => updateFormData({ serviceStartDate: e.target.value })}
          />
        </div>

        {/* Service End Date */}
        <div className="space-y-2">
          <Label htmlFor="serviceEndDate" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Service End Date
          </Label>
          <Input
            id="serviceEndDate"
            type="date"
            value={formData.serviceEndDate}
            onChange={(e) => updateFormData({ serviceEndDate: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Leave blank if still serving</p>
        </div>

        {/* Discharge Type */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="dischargeType" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Discharge Type
          </Label>
          <Select
            value={formData.dischargeType}
            onValueChange={(value) => updateFormData({ dischargeType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select discharge type" />
            </SelectTrigger>
            <SelectContent>
              {DISCHARGE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 mt-6">
        <p className="text-sm text-green-800 dark:text-green-200">
          <strong>Good to know:</strong> Most discharge types qualify for VA benefits. 
          Even Other Than Honorable discharges may qualify - your representative can help determine eligibility.
        </p>
      </div>
    </div>
  );
}
