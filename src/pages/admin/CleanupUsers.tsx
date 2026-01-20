import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CleanupResult {
  deleted: number;
  error?: string;
}

export default function CleanupUsers() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Record<string, CleanupResult> | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const { toast } = useToast();

  const handleCleanup = async () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("cleanup-all-users");

      if (error) throw error;

      setResults(data.results);
      toast({
        title: "Cleanup complete",
        description: "All user data has been wiped",
      });
    } catch (error: any) {
      console.error("Cleanup error:", error);
      toast({
        title: "Cleanup failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setConfirmed(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Full User Data Cleanup
          </CardTitle>
          <CardDescription>
            This will delete ALL user data from the database including profiles, roles, invitations, and auth users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning: Destructive Action</AlertTitle>
            <AlertDescription>
              This action cannot be undone. All user accounts, profiles, roles, and related data will be permanently deleted.
            </AlertDescription>
          </Alert>

          {confirmed && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Are you absolutely sure?</AlertTitle>
              <AlertDescription>
                Click the button again to confirm deletion of all user data.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleCleanup} 
            disabled={isLoading}
            variant="destructive"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cleaning up...
              </>
            ) : confirmed ? (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Click Again to Confirm
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Wipe All User Data
              </>
            )}
          </Button>

          {results && (
            <div className="mt-6 space-y-2">
              <h3 className="font-semibold">Cleanup Results:</h3>
              <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                {Object.entries(results).map(([table, result]) => (
                  <div key={table} className="flex justify-between items-center">
                    <span className="font-mono">{table}</span>
                    <span className={result.error ? "text-destructive" : "text-green-600"}>
                      {result.error ? (
                        <span title={result.error}>Error</span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {result.deleted} deleted
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
