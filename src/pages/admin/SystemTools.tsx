import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

interface MigrationResult {
  migrated: number;
  skipped: number;
  errors: number;
}

interface MigrationResults {
  [tableName: string]: MigrationResult;
}

export default function SystemTools() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<MigrationResults | null>(null);
  const { toast } = useToast();

  const runTokenMigration = async () => {
    setIsRunning(true);
    setLastResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to run security migrations.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('migrate-encrypt-tokens', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('[SystemTools] Migration error:', error);
        toast({
          title: "Migration failed",
          description: error.message || "An error occurred during token migration.",
          variant: "destructive",
        });
        return;
      }

      const results = data?.results as MigrationResults;
      setLastResult(results);
      
      console.log('[SystemTools] Migration results:', results);

      const totalMigrated = Object.values(results || {}).reduce((sum, r) => sum + r.migrated, 0);
      const totalErrors = Object.values(results || {}).reduce((sum, r) => sum + r.errors, 0);

      if (totalErrors > 0) {
        toast({
          title: "Migration completed with errors",
          description: `Migrated ${totalMigrated} tokens. ${totalErrors} errors occurred.`,
          variant: "destructive",
        });
      } else if (totalMigrated === 0) {
        toast({
          title: "No migration needed",
          description: "All tokens are already encrypted.",
        });
      } else {
        toast({
          title: "Migration successful",
          description: `Encrypted ${totalMigrated} tokens across all tables.`,
        });
      }
    } catch (err) {
      console.error('[SystemTools] Unexpected error:', err);
      toast({
        title: "Migration failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">System Tools</h1>
          <p className="text-muted-foreground">Security and maintenance utilities</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Security Token Migration
          </CardTitle>
          <CardDescription>
            Encrypt any plaintext OAuth tokens in the database. This operation is idempotent
            and safe to run multiple times.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runTokenMigration} 
            disabled={isRunning}
            className="w-full sm:w-auto"
          >
            {isRunning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running Migration...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Re-run Security Token Migration
              </>
            )}
          </Button>

          {lastResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Migration Results
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {Object.entries(lastResult).map(([table, result]) => (
                  <div key={table} className="p-3 bg-background rounded border">
                    <div className="font-medium">{table}</div>
                    <div className="text-muted-foreground">
                      <span className="text-green-600">{result.migrated} migrated</span>
                      {result.skipped > 0 && (
                        <span className="ml-2 text-yellow-600">{result.skipped} skipped</span>
                      )}
                      {result.errors > 0 && (
                        <span className="ml-2 text-red-600">{result.errors} errors</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground border-t pt-4 mt-4">
            <h5 className="font-medium mb-2">Tables covered:</h5>
            <ul className="list-disc list-inside space-y-1">
              <li>email_accounts (access_token, refresh_token)</li>
              <li>calendar_connections (access_token, refresh_token)</li>
              <li>zoom_connections (access_token, refresh_token)</li>
              <li>microsoft_connections (access_token, refresh_token)</li>
              <li>social_media_profiles (access_token, refresh_token)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
