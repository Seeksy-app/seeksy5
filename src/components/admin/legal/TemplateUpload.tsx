import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Info, Download } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TemplateInfo {
  name: string;
  size: number;
  updated_at: string;
}

export default function TemplateUpload() {
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [templateInfo, setTemplateInfo] = useState<TemplateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTemplateInfo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from("legal-templates")
        .list("investment-documents", { limit: 10 });

      if (error) throw error;

      const template = data?.find(f => f.name === "stock-purchase-agreement.docx");
      if (template) {
        setTemplateInfo({
          name: template.name,
          size: template.metadata?.size || 0,
          updated_at: template.updated_at || template.created_at || "",
        });
      }
    } catch (err) {
      console.error("Error fetching template info:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplateInfo();
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".docx")) {
      toast.error("Please upload a .docx file");
      return;
    }

    setUploading(true);
    try {
      const { error } = await supabase.storage
        .from("legal-templates")
        .upload("investment-documents/stock-purchase-agreement.docx", file, {
          upsert: true,
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

      if (error) throw error;

      toast.success("Template uploaded successfully");
      await fetchTemplateInfo();
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

  const handleGenerateTemplate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-default-template");

      if (error) throw error;

      if (data?.document) {
        // Download the generated template
        const byteCharacters = atob(data.document);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { 
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename || "Stock_Purchase_Agreement_Template.docx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Template generated and downloaded! Also saved to storage.");
        await fetchTemplateInfo();
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
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Stock Purchase Agreement Template
        </CardTitle>
        <CardDescription>
          Upload your Word template with placeholders for dynamic content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Template Placeholders</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Use these placeholders in your Word document:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div className="font-medium mt-2 col-span-2 text-foreground">Parties & Dates:</div>
              <li><code className="bg-muted px-1 rounded">[PURCHASER_NAME]</code></li>
              <li><code className="bg-muted px-1 rounded">[PURCHASER_ADDRESS]</code></li>
              <li><code className="bg-muted px-1 rounded">[SELLER_NAME]</code></li>
              <li><code className="bg-muted px-1 rounded">[SELLER_ADDRESS]</code></li>
              <li><code className="bg-muted px-1 rounded">[SELLER_EMAIL]</code></li>
              <li><code className="bg-muted px-1 rounded">[BUYER_EMAIL]</code></li>
              <li><code className="bg-muted px-1 rounded">[CHAIRMAN_NAME]</code></li>
              <li><code className="bg-muted px-1 rounded">[CHAIRMAN_TITLE]</code></li>
              <li><code className="bg-muted px-1 rounded">[COMPANY_NAME]</code></li>
              <li><code className="bg-muted px-1 rounded">[AGREEMENT_DATE]</code></li>
              
              <div className="font-medium mt-2 col-span-2 text-foreground">Investment Details:</div>
              <li><code className="bg-muted px-1 rounded">[NUMBER_OF_SHARES]</code></li>
              <li><code className="bg-muted px-1 rounded">[NUMBER_OF_SHARES_WORDS]</code></li>
              <li><code className="bg-muted px-1 rounded">[PRICE_PER_SHARE]</code></li>
              <li><code className="bg-muted px-1 rounded">[PURCHASE_AMOUNT]</code></li>
              
              <div className="font-medium mt-2 col-span-2 text-foreground">Investor Certification Checkboxes:</div>
              <li className="col-span-2"><code className="bg-muted px-1 rounded">[CERT_NET_WORTH]</code> - ☑/☐ Net worth</li>
              <li className="col-span-2"><code className="bg-muted px-1 rounded">[CERT_INCOME]</code> - ☑/☐ Income</li>
              <li className="col-span-2"><code className="bg-muted px-1 rounded">[CERT_DIRECTOR]</code> - ☑/☐ Director/Officer</li>
              <li className="col-span-2"><code className="bg-muted px-1 rounded">[CERT_SOPHISTICATED]</code> - ☑/☐ Sophisticated Investor</li>
              <li className="col-span-2"><code className="bg-muted px-1 rounded">[INVESTOR_CERTIFICATION]</code> - Full text description</li>
            </div>
          </AlertDescription>
        </Alert>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking for existing template...
          </div>
        ) : templateInfo ? (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">{templateInfo.name}</p>
                <p className="text-sm text-muted-foreground">
                  {templateInfo.updated_at && 
                    `Updated ${format(new Date(templateInfo.updated_at), "MMM d, yyyy 'at' h:mm a")}`
                  }
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Replace"}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">No template uploaded</p>
                <p className="text-sm text-muted-foreground">
                  Generate a default template or upload your own
                </p>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          onChange={handleUpload}
          className="hidden"
        />

        <div className="flex gap-2">
          <Button 
            onClick={handleGenerateTemplate}
            disabled={generating}
            variant="outline"
            className="flex-1"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Default Template
              </>
            )}
          </Button>
          
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {templateInfo ? "Upload New" : "Upload Template"}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
