import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Papa from "papaparse";

interface ListImportTabProps {
  listId: string;
}

interface ParsedRow {
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
}

export function ListImportTab({ listId }: ListImportTabProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "preferences" | "complete">("upload");
  const [preferences, setPreferences] = useState({
    marketing: true,
    system: true,
    events: true,
    identity: false,
  });
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setFile(selectedFile);

    // Parse CSV
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as ParsedRow[];
        setParsedData(data);
        setStep("preview");
      },
      error: (error) => {
        toast.error("Failed to parse CSV: " + error.message);
      },
    });
  };

  const importSubscribers = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let successCount = 0;
      let errorCount = 0;

      for (const row of parsedData) {
        try {
          if (!row.email) {
            errorCount++;
            continue;
          }

          // Check if contact exists
          let { data: existingContact } = await supabase
            .from("contacts")
            .select("id")
            .eq("email", row.email)
            .eq("user_id", user.id)
            .single();

          let contactId = existingContact?.id;

          // Create contact if doesn't exist
          if (!contactId) {
            const name = row.name || `${row.first_name || ""} ${row.last_name || ""}`.trim() || row.email;
            const { data: newContact, error: contactError } = await supabase
              .from("contacts")
              .insert({
                name,
                email: row.email,
                user_id: user.id,
              })
              .select("id")
              .single();

            if (contactError) {
              errorCount++;
              continue;
            }
            contactId = newContact.id;
          }

          // Check if already in list
          const { data: existingMember } = await supabase
            .from("contact_list_members")
            .select("id")
            .eq("list_id", listId)
            .eq("contact_id", contactId)
            .single();

          if (existingMember) {
            continue; // Skip duplicates
          }

          // Add to list
          const { error: memberError } = await supabase
            .from("contact_list_members")
            .insert({
              list_id: listId,
              contact_id: contactId,
            });

          if (memberError) {
            errorCount++;
            continue;
          }

          // Create/update preferences
          await supabase
            .from("contact_preferences")
            .upsert({
              contact_id: contactId,
              marketing_emails: preferences.marketing,
              system_notifications: preferences.system,
              event_updates: preferences.events,
              identity_notifications: preferences.identity,
            });

          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      return { success: successCount, errors: errorCount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["list-members", listId] });
      queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
      setImportResult(result);
      setStep("complete");
      toast.success(`Imported ${result.success} subscribers successfully`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to import subscribers");
    },
  });

  const resetImport = () => {
    setFile(null);
    setParsedData([]);
    setStep("upload");
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {step === "upload" && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Import Subscribers</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a CSV file with your subscriber data. Required column: <code className="bg-muted px-1 py-0.5 rounded">email</code>
          </p>

          <div className="border-2 border-dashed rounded-xl p-12 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium mb-2">Upload CSV File</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Supported columns: email, first_name, last_name, name
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              <FileText className="h-4 w-4 mr-2" />
              Select CSV File
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Preview Import</h3>
              <p className="text-sm text-muted-foreground">
                Found {parsedData.length} rows in {file?.name}
              </p>
            </div>
            <Button variant="outline" onClick={resetImport}>
              Cancel
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Name</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2">{row.email}</td>
                    <td className="px-4 py-2">
                      {row.name || `${row.first_name || ""} ${row.last_name || ""}`.trim() || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {parsedData.length > 5 && (
            <p className="text-xs text-muted-foreground mb-4">
              Showing first 5 rows. {parsedData.length - 5} more rows will be imported.
            </p>
          )}

          <Button onClick={() => setStep("preferences")}>
            Continue to Preferences
          </Button>
        </div>
      )}

      {step === "preferences" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Set Default Preferences</h3>
            <Button variant="outline" onClick={() => setStep("preview")}>
              Back
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Choose which communication channels these subscribers will receive by default.
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="marketing"
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences((p) => ({ ...p, marketing: !!checked }))
                }
              />
              <Label htmlFor="marketing" className="cursor-pointer">
                Marketing Updates
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="system"
                checked={preferences.system}
                onCheckedChange={(checked) =>
                  setPreferences((p) => ({ ...p, system: !!checked }))
                }
              />
              <Label htmlFor="system" className="cursor-pointer">
                System Notifications
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="events"
                checked={preferences.events}
                onCheckedChange={(checked) =>
                  setPreferences((p) => ({ ...p, events: !!checked }))
                }
              />
              <Label htmlFor="events" className="cursor-pointer">
                Event Invites
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="identity"
                checked={preferences.identity}
                onCheckedChange={(checked) =>
                  setPreferences((p) => ({ ...p, identity: !!checked }))
                }
              />
              <Label htmlFor="identity" className="cursor-pointer">
                Identity/Verification
              </Label>
            </div>
          </div>

          <Button
            onClick={() => importSubscribers.mutate()}
            disabled={importSubscribers.isPending}
          >
            {importSubscribers.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Import {parsedData.length} Subscribers
          </Button>
        </div>
      )}

      {step === "complete" && importResult && (
        <div className="text-center py-8">
          {importResult.errors === 0 ? (
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          ) : (
            <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          )}
          <h3 className="text-xl font-semibold mb-2">Import Complete</h3>
          <p className="text-muted-foreground mb-6">
            Successfully imported {importResult.success} subscribers.
            {importResult.errors > 0 && ` ${importResult.errors} errors occurred.`}
          </p>
          <Button onClick={resetImport}>
            Import Another File
          </Button>
        </div>
      )}
    </div>
  );
}
