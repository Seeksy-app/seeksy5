import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) {
      setError("Invalid unsubscribe link");
      setLoading(false);
      return;
    }

    handleUnsubscribe();
  }, [email]);

  const handleUnsubscribe = async () => {
    if (!email) return;

    try {
      const { error: updateError } = await supabase
        .from("newsletter_subscribers")
        .update({
          status: "unsubscribed",
          unsubscribed_at: new Date().toISOString(),
        })
        .eq("email", email);

      if (updateError) throw updateError;

      setSuccess(true);
      toast.success("Successfully unsubscribed");
    } catch (err: any) {
      console.error("Unsubscribe error:", err);
      setError("Failed to unsubscribe. Please try again or contact support.");
      toast.error("Failed to unsubscribe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {loading ? (
              <Mail className="w-12 h-12 text-muted-foreground animate-pulse" />
            ) : success ? (
              <CheckCircle className="w-12 h-12 text-green-500" />
            ) : (
              <XCircle className="w-12 h-12 text-destructive" />
            )}
          </div>
          <CardTitle>
            {loading ? "Unsubscribing..." : success ? "Unsubscribed Successfully" : "Unsubscribe Failed"}
          </CardTitle>
          <CardDescription>
            {loading
              ? "Processing your request..."
              : success
              ? `You have been unsubscribed from our newsletter (${email})`
              : error || "Something went wrong"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {success && (
            <>
              <p className="text-sm text-muted-foreground">
                You won't receive any more emails from us. We're sorry to see you go!
              </p>
              <p className="text-sm text-muted-foreground">
                Changed your mind? You can always resubscribe from our website.
              </p>
            </>
          )}
          <Link to="/">
            <Button variant="outline" className="w-full">
              Return to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
