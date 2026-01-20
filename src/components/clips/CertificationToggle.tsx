import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield } from "lucide-react";

interface CertificationToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function CertificationToggle({ enabled, onChange }: CertificationToggleProps) {
  return (
    <div className="flex items-start justify-between space-x-3 p-4 border rounded-lg">
      <div className="flex items-start gap-3 flex-1">
        <div className="p-2 rounded-full bg-primary/10 mt-0.5">
          <Shield className="h-4 w-4 text-primary" />
        </div>
        <div className="space-y-1 flex-1">
          <Label htmlFor="certification-toggle" className="text-sm font-semibold cursor-pointer">
            Blockchain Certification
          </Label>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Seeksy will add a "Certified by Seeksy" badge, create a blockchain certificate, 
            and (optionally) watermark this clip for authenticity.
          </p>
        </div>
      </div>
      <Switch
        id="certification-toggle"
        checked={enabled}
        onCheckedChange={onChange}
        className="mt-1"
      />
    </div>
  );
}
