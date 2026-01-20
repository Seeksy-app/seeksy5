import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IntentToFileFormData } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Download, 
  ExternalLink, 
  Mail, 
  Calendar,
  FileText,
  ArrowRight,
  Shield
} from "lucide-react";

interface Props {
  leadId: string;
  formData: IntentToFileFormData;
}

export function SuccessStep({ leadId, formData }: Props) {
  const navigate = useNavigate();
  const [emailSent, setEmailSent] = useState(false);

  const effectiveDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleAccessVA = () => {
    window.open("https://www.va.gov/disability/file-disability-claim-form-21-526ez/", "_blank");
  };

  const handleEmailRep = () => {
    // This would trigger an email to the rep in a real implementation
    setEmailSent(true);
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your Claim is Prepared!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your Intent to File has been prepared. Your effective date is locked in at{" "}
          <strong>{effectiveDate}</strong>.
        </p>
      </div>

      {/* What's Next */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            What Happens Next
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Badge className="mt-0.5">1</Badge>
            <div>
              <p className="font-medium">Download Your Forms</p>
              <p className="text-sm text-muted-foreground">
                We've prepared VA Form 21-0966 (Intent to File) for you to review and sign.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge className="mt-0.5">2</Badge>
            <div>
              <p className="font-medium">Log into AccessVA</p>
              <p className="text-sm text-muted-foreground">
                Use ID.me to access the VA's secure submission portal.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge className="mt-0.5">3</Badge>
            <div>
              <p className="font-medium">Upload & Submit</p>
              <p className="text-sm text-muted-foreground">
                Upload your prepared form through QuickSubmit. Takes about 3 minutes.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge className="mt-0.5">4</Badge>
            <div>
              <p className="font-medium">Gather Evidence</p>
              <p className="text-sm text-muted-foreground">
                You have 1 year to complete your full claim with supporting evidence.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={handleAccessVA}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <ExternalLink className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Continue to AccessVA</p>
                <p className="text-sm text-muted-foreground">Submit your Intent to File</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Download Forms</p>
                <p className="text-sm text-muted-foreground">Get your prepared documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {formData.repChoice !== "later" && (
          <Card 
            className={`cursor-pointer transition-colors ${emailSent ? "border-green-500" : "hover:border-primary"}`}
            onClick={handleEmailRep}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">
                    {emailSent ? "Email Sent!" : "Email My Representative"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {emailSent ? "They'll contact you soon" : "Send introduction email"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/yourbenefits/dashboard")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Shield className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Go to Dashboard</p>
                <p className="text-sm text-muted-foreground">Track your claim progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Footer */}
      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          We help prepare your VA claim and connect you with accredited representatives. 
          Final submission must be completed by you through VA's secure systems.
        </p>
      </div>

      {/* Reference ID */}
      <div className="text-center text-sm text-muted-foreground">
        Reference ID: {leadId.slice(0, 8).toUpperCase()}
      </div>
    </div>
  );
}
