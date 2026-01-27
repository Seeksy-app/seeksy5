import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SpreadsheetUploadFormProps {
  onUploadSuccess?: () => void;
}

export function SpreadsheetUploadForm({ onUploadSuccess }: SpreadsheetUploadFormProps) {
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [period, setPeriod] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileType === 'csv' || fileType === 'xlsx') {
        setFile(selectedFile);
      } else {
        toast.error("Please upload a CSV or XLSX file");
        e.target.value = '';
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !name) {
      toast.error("Please provide a name and select a file");
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileType = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('investor-spreadsheets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database record
      const result = await (supabase as any)
        .from('investor_spreadsheets')
        .insert({
          name,
          description,
          period,
          file_path: filePath,
          file_type: fileType,
          uploaded_by: user.id,
        });

      if (result.error) throw result.error;

      toast.success("Spreadsheet uploaded successfully!");
      
      // Reset form
      setName("");
      setDescription("");
      setPeriod("");
      setFile(null);
      
      const fileInput = document.getElementById('spreadsheet-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      onUploadSuccess?.();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Spreadsheet
        </CardTitle>
        <CardDescription>
          Upload financial spreadsheets for investors to view
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Spreadsheet Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 2024 Q4 Financials"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the spreadsheet contents"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Period</Label>
            <Input
              id="period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="e.g., Q4 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="spreadsheet-file">File (CSV or XLSX) *</Label>
            <Input
              id="spreadsheet-file"
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              required
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <Button type="submit" disabled={uploading} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Spreadsheet
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
