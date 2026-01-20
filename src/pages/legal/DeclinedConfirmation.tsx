import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Home, Mail, Phone } from "lucide-react";

export default function DeclinedConfirmation() {
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
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Document Declined</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6 pb-8">
          <p className="text-muted-foreground">
            You have declined to sign this document. The sender has been notified.
          </p>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Have questions or concerns?</p>
            <p className="text-sm text-muted-foreground">
              If you'd like to discuss the document or have any questions, our team is here to help.
            </p>
          </div>

          {instanceId && (
            <p className="text-xs text-muted-foreground">
              Reference: {instanceId.slice(0, 8)}...
            </p>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild variant="default" className="bg-[#2C6BED] hover:bg-[#053877]">
              <a href="mailto:legal@seeksy.io">
                <Mail className="mr-2 h-4 w-4" />
                Contact Legal Team
              </a>
            </Button>
            <Button asChild variant="outline">
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
