import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, Mail } from "lucide-react";

export default function SignedConfirmation() {
  const [searchParams] = useSearchParams();
  const instanceId = searchParams.get("instance");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#2C6BED] flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-0">
        <CardHeader className="text-center pt-8">
          {/* Seeksy Logo */}
          <div className="mx-auto mb-6">
            <img 
              src="/lovable-uploads/7e6fbb49-d079-4eff-a13d-8c6f823a74c0.png" 
              alt="Seeksy" 
              className="h-10 mx-auto"
            />
          </div>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Document Signed!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6 pb-8">
          <p className="text-muted-foreground">
            Thank you for signing the document. All parties will receive a copy via email once everyone has signed.
          </p>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">What happens next?</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Remaining parties will be notified to sign</li>
              <li>• You'll receive the fully executed document via email</li>
              <li>• Check your email shortly for confirmation</li>
            </ul>
          </div>

          {instanceId && (
            <p className="text-xs text-muted-foreground">
              Reference: {instanceId.slice(0, 8)}...
            </p>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild variant="outline">
              <a href="mailto:legal@seeksy.io">
                <Mail className="mr-2 h-4 w-4" />
                Questions? Contact Us
              </a>
            </Button>
            <Button asChild className="bg-[#2C6BED] hover:bg-[#053877]">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Return to Seeksy
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
