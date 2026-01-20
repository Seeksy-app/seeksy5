import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function BootstrapAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleBootstrap = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("bootstrap-admin");

      if (error) throw error;

      if (data.success) {
        setResult({ success: true, message: data.message });
        toast({
          title: "Success!",
          description: data.message,
        });
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error: any) {
      console.error("Bootstrap error:", error);
      setResult({ success: false, message: error.message });
      toast({
        title: "Bootstrap failed",
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
            <Shield className="h-5 w-5" />
            Bootstrap Admin
          </CardTitle>
          <CardDescription>
            Assign super_admin role to your account. Only works for pre-approved email addresses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <p className="text-sm text-muted-foreground">
              Logged in as: <strong>{user.email}</strong>
            </p>
          ) : (
            <p className="text-sm text-destructive">
              You must be logged in first. Go to /auth to sign in.
            </p>
          )}

          <Button 
            onClick={handleBootstrap} 
            disabled={isLoading || !user}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Bootstrapping...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Assign Super Admin Role
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
