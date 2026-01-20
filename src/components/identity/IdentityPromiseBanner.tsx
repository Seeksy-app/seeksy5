import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

export const IdentityPromiseBanner = () => {
  return (
    <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Seeksy Identity Promise</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your likeness is yours. Seeksy will never sell, license, or use your face or voice without your explicit permission. 
              Every use of your identity — clips, AI generation, or advertising — is logged and recorded for transparency.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
