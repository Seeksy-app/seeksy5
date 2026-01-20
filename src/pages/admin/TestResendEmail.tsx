import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function TestResendEmail() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const handleSendTest = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("test-resend-email", {
        body: { recipientEmail: email },
      });

      if (error) throw error;

      if (data.success) {
        setResult({ success: true, message: data.message });
        toast({
          title: "Email sent!",
          description: `Test email sent to ${email}`,
        });
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error: any) {
      console.error("Error sending test email:", error);
      setResult({ success: false, message: error.message });
      toast({
        title: "Failed to send email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Test Resend Email
          </CardTitle>
          <CardDescription>
            Send a test email to verify your Resend integration is working.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendTest} 
            disabled={isLoading || !email}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Test Email
              </>
            )}
          </Button>

          {result && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}>
              {result.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="text-sm">{result.message}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
