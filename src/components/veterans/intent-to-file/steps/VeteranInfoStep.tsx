import { IntentToFileFormData, US_STATES } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, Calendar, MapPin } from "lucide-react";

interface Props {
  formData: IntentToFileFormData;
  updateFormData: (updates: Partial<IntentToFileFormData>) => void;
}

export function VeteranInfoStep({ formData, updateFormData }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Tell Us About Yourself</h2>
        <p className="text-muted-foreground">
          We need some basic information to prepare your Intent to File.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Full Legal Name *
          </Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => updateFormData({ fullName: e.target.value })}
            placeholder="As it appears on your DD-214"
            maxLength={100}
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            placeholder="your.email@example.com"
            maxLength={255}
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            placeholder="(555) 123-4567"
            maxLength={20}
          />
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label htmlFor="dob" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date of Birth
          </Label>
          <Input
            id="dob"
            type="date"
            value={formData.dob}
            onChange={(e) => updateFormData({ dob: e.target.value })}
          />
        </div>

        {/* State */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="state" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            State of Residence *
          </Label>
          <Select
            value={formData.state}
            onValueChange={(value) => updateFormData({ state: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Privacy Note:</strong> Your information is encrypted and only shared with your 
          chosen representative. We never sell your data.
        </p>
      </div>
    </div>
  );
}
