import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, Loader2, CheckCircle, Trash2, Download, FolderOpen, Plus, MoreVertical, Wand2 } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Template {
  name: string;
  size: number;
  updated_at: string;
  id: string;
}

interface TemplateLibraryProps {
  onSelectTemplate?: (templateName: string) => void;
  selectedTemplate?: string;
  selectionMode?: boolean;
}

export default function TemplateLibrary({ 
  onSelectTemplate, 
  selectedTemplate,
  selectionMode = false 
}: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from("legal-templates")
        .list("investment-documents", { limit: 100 });

      if (error) {
        // Folder might not exist yet, that's ok
        if (error.message.includes("not found")) {
          setTemplates([]);
          return;
        }
        throw error;
      }

      const templateList = (data || [])
        .filter(f => f.name.endsWith(".docx"))
        .map(f => ({
          name: f.name,
          size: f.metadata?.size || 0,
          updated_at: f.updated_at || f.created_at || "",
          id: f.id,
        }));

      setTemplates(templateList);
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".docx")) {
      toast.error("Please upload a .docx file");
      return;
    }

    setPendingFile(file);
    setNewTemplateName(file.name.replace(".docx", ""));
    setShowUploadDialog(true);
  };

  const handleUpload = async () => {
    if (!pendingFile || !newTemplateName.trim()) {
      toast.error("Please provide a template name");
      return;
    }

    setUploading(true);
    try {
      const fileName = `${newTemplateName.trim().replace(/[^a-zA-Z0-9-_]/g, "_")}.docx`;
      const filePath = `investment-documents/${fileName}`;

      const { error } = await supabase.storage
        .from("legal-templates")
        .upload(filePath, pendingFile, {
          upsert: true,
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

      if (error) throw error;

      toast.success("Template uploaded successfully");
      setShowUploadDialog(false);
      setPendingFile(null);
      setNewTemplateName("");
      await fetchTemplates();
    } catch (err: any) {
      console.error("Error uploading template:", err);
      toast.error(err.message || "Failed to upload template");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (templateName: string) => {
    if (!confirm(`Are you sure you want to delete "${templateName}"?`)) return;

    setDeleting(templateName);
    try {
      const { error } = await supabase.storage
        .from("legal-templates")
        .remove([`investment-documents/${templateName}`]);

      if (error) throw error;

      toast.success("Template deleted");
      await fetchTemplates();
    } catch (err: any) {
      console.error("Error deleting template:", err);
      toast.error(err.message || "Failed to delete template");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (templateName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("legal-templates")
        .download(`investment-documents/${templateName}`);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = templateName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Error downloading template:", err);
      toast.error(err.message || "Failed to download template");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleGenerateDefaultTemplate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-stock-agreement-template");
      
      if (error) throw error;
      
      if (data?.document) {
        // Convert base64 to blob
        const binaryString = atob(data.document);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { 
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
        });
        
        // Upload to storage
        const fileName = data.filename || "stock-purchase-agreement-template.docx";
        const filePath = `investment-documents/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from("legal-templates")
          .upload(filePath, blob, {
            upsert: true,
            contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
        
        if (uploadError) throw uploadError;
        
        toast.success("Default template generated and uploaded");
        await fetchTemplates();
      }
    } catch (err: any) {
      console.error("Error generating template:", err);
      toast.error(err.message || "Failed to generate template");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Investment Document Templates
            </CardTitle>
            <CardDescription>
              Upload and manage Word templates for stock purchase agreements
            </CardDescription>
          </div>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Template Placeholders</AlertTitle>
          <AlertDescription>
            Use these placeholders in your Word document:
            <div className="mt-2 flex flex-wrap gap-2">
              <code className="bg-muted px-2 py-0.5 rounded text-xs">[PURCHASER_NAME]</code>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">[PURCHASER_ADDRESS]</code>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">[BUYER_NAME]</code>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">[BUYER_ADDRESS]</code>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">[BUYER_EMAIL]</code>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">[SELLER_NAME]</code>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">[SELLER_ADDRESS]</code>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">[SELLER_EMAIL]</code>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">[NUMBER_OF_SHARES]</code>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">[NUMBER_OF_SHARES_WORDS]</code>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">[PRICE_PER_SHARE]</code>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">[PURCHASE_AMOUNT]</code>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">[AGREEMENT_DATE]</code>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">[CHAIRMAN_NAME]</code>
            </div>
          </AlertDescription>
        </Alert>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground mb-3">No templates uploaded yet</p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Template
              </Button>
              <Button onClick={handleGenerateDefaultTemplate} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Default Template
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.name}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  selectionMode && selectedTemplate === template.name
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                } ${selectionMode ? "cursor-pointer" : ""}`}
                onClick={() => selectionMode && onSelectTemplate?.(template.name)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{template.name.replace(".docx", "")}</p>
                      {selectedTemplate === template.name && (
                        <Badge variant="secondary" className="text-xs">Selected</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(template.size)} • 
                      {template.updated_at && ` Updated ${format(new Date(template.updated_at), "MMM d, yyyy")}`}
                    </p>
                  </div>
                </div>
                
                {!selectionMode && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border shadow-lg z-50">
                      <DropdownMenuItem onClick={() => handleDownload(template.name)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(template.name)}
                        className="text-destructive focus:text-destructive"
                        disabled={deleting === template.name}
                      >
                        {deleting === template.name ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Template</DialogTitle>
            <DialogDescription>
              Give your template a descriptive name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g., Stock Purchase Agreement v2"
              />
            </div>
            {pendingFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{pendingFile.name}</span>
                <span>({formatFileSize(pendingFile.size)})</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !newTemplateName.trim()}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
