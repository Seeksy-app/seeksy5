import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function DownloadTemplate() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
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
        
        // Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename || "stock-purchase-agreement-template.docx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success("Template downloaded successfully");
      }
    } catch (error: any) {
      console.error("Error generating template:", error);
      toast.error("Failed to generate template: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const placeholders = [
    { name: "[AGREEMENT_DATE]", description: "Date of the agreement" },
    { name: "[SELLER_NAME]", description: "Full name of the seller" },
    { name: "[SELLER_ADDRESS]", description: "Seller's address" },
    { name: "[SELLER_EMAIL]", description: "Seller's email address" },
    { name: "[BUYER_NAME]", description: "Full name of the buyer/purchaser" },
    { name: "[BUYER_ADDRESS]", description: "Buyer's address" },
    { name: "[BUYER_EMAIL]", description: "Buyer's email address" },
    { name: "[NUMBER_OF_SHARES]", description: "Number of shares being purchased" },
    { name: "[NUMBER_OF_SHARES_WORDS]", description: "Number of shares in words (e.g., Forty Thousand)" },
    { name: "[PRICE_PER_SHARE]", description: "Price per share in dollars" },
    { name: "[PURCHASE_AMOUNT]", description: "Total purchase amount" },
    { name: "[CHAIRMAN_NAME]", description: "Name of the Chairman of the Board" },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Stock Purchase Agreement Template</h1>
        <p className="text-muted-foreground mt-2">
          Download a Word document template with placeholders for the Common Stock Purchase Agreement
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Download Template
            </CardTitle>
            <CardDescription>
              Get a Word document (.docx) with highlighted placeholders that you can edit and upload back to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleDownload} 
              disabled={isGenerating}
              size="lg"
              className="w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Word Template
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Placeholders Reference</CardTitle>
            <CardDescription>
              The following placeholders are used in the template and will be replaced with actual values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {placeholders.map((placeholder) => (
                <div 
                  key={placeholder.name} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded text-primary">
                      {placeholder.name}
                    </code>
                    <p className="text-sm text-muted-foreground mt-1">
                      {placeholder.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
              <li>
                <span className="text-foreground font-medium">Download the template</span> - Click the button above to get the Word document
              </li>
              <li>
                <span className="text-foreground font-medium">Review and customize</span> - Open in Microsoft Word or Google Docs and make any legal adjustments needed
              </li>
              <li>
                <span className="text-foreground font-medium">Keep placeholders intact</span> - Ensure all [PLACEHOLDER] text remains exactly as shown for auto-filling to work
              </li>
              <li>
                <span className="text-foreground font-medium">Upload to Template Library</span> - Go to Pending Investments → Template tab and upload your customized version
              </li>
              <li>
                <span className="text-foreground font-medium">Generate agreements</span> - When approving investments, the system will use your template and fill in the placeholders automatically
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
