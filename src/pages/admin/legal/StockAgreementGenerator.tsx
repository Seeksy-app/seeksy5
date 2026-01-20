import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileDown, Loader2, Send, PenLine } from "lucide-react";

export default function StockAgreementGenerator() {
  const [loading, setLoading] = useState(false);
  const [sendingForSignature, setSendingForSignature] = useState(false);
  const [formData, setFormData] = useState({
    purchaserName: "",
    purchaserEmail: "",
    purchaserAddress: "",
    numberOfShares: "",
    pricePerShare: "0.20",
    agreementDate: new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    // Seller/Chairman info for e-signature
    sellerName: "Seeksy, Inc.",
    sellerEmail: "",
    chairmanName: "",
    chairmanEmail: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    const shares = parseFloat(formData.numberOfShares) || 0;
    const price = parseFloat(formData.pricePerShare) || 0;
    return (shares * price).toFixed(2);
  };

  const generateDocumentBase64 = async (): Promise<string | null> => {
    const { data, error } = await supabase.functions.invoke(
      "generate-stock-agreement-docx",
      {
        body: {
          purchaserName: formData.purchaserName,
          purchaserAddress: formData.purchaserAddress,
          numberOfShares: parseInt(formData.numberOfShares),
          pricePerShare: parseFloat(formData.pricePerShare),
          agreementDate: formData.agreementDate,
        },
      }
    );

    if (error) {
      console.error("Error generating document:", error);
      throw error;
    }

    return data.document;
  };

  const handleGenerate = async () => {
    if (!formData.purchaserName || !formData.numberOfShares) {
      toast.error("Please fill in purchaser name and number of shares");
      return;
    }

    setLoading(true);
    try {
      const documentBase64 = await generateDocumentBase64();
      if (!documentBase64) throw new Error("No document generated");

      // Convert base64 to blob and download
      const byteCharacters = atob(documentBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Stock_Purchase_Agreement_${formData.purchaserName.replace(/\s+/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Document generated and downloaded!");
    } catch (err) {
      console.error("Error generating document:", err);
      toast.error("Failed to generate document");
    } finally {
      setLoading(false);
    }
  };

  const handleSendForSignature = async () => {
    // Validate required fields
    if (!formData.purchaserName || !formData.numberOfShares) {
      toast.error("Please fill in purchaser name and number of shares");
      return;
    }
    if (!formData.purchaserEmail) {
      toast.error("Please enter purchaser email for e-signature");
      return;
    }
    if (!formData.sellerEmail) {
      toast.error("Please enter seller email for e-signature");
      return;
    }
    if (!formData.chairmanEmail) {
      toast.error("Please enter chairman email for e-signature");
      return;
    }

    setSendingForSignature(true);
    try {
      // First generate the document
      const documentBase64 = await generateDocumentBase64();
      if (!documentBase64) throw new Error("No document generated");

      // Create a legal_doc_instances record to track this agreement
      const { data: instance, error: instanceError } = await supabase
        .from("legal_doc_instances")
        .insert({
          template_id: "stock-purchase-agreement",
          status: "pending_signatures",
          purchaser_email: formData.purchaserEmail,
          field_values_json: {
            purchaserName: formData.purchaserName,
            purchaserEmail: formData.purchaserEmail,
            purchaserAddress: formData.purchaserAddress,
            numberOfShares: formData.numberOfShares,
            pricePerShare: formData.pricePerShare,
            agreementDate: formData.agreementDate,
            sellerName: formData.sellerName,
            sellerEmail: formData.sellerEmail,
            chairmanName: formData.chairmanName,
            chairmanEmail: formData.chairmanEmail,
          },
          computed_values_json: {
            totalAmount: calculateTotal(),
          },
        })
        .select()
        .single();

      if (instanceError) throw instanceError;

      // Send to SignWell for e-signature
      const { data: signWellResult, error: signWellError } = await supabase.functions.invoke(
        "signwell-send-document",
        {
          body: {
            documentBase64,
            documentName: `Stock_Purchase_Agreement_${formData.purchaserName.replace(/\s+/g, "_")}.docx`,
            instanceId: instance.id,
            subject: `Stock Purchase Agreement - ${formData.purchaserName}`,
            message: `Please review and sign the Stock Purchase Agreement for ${formData.numberOfShares} shares at $${formData.pricePerShare} per share (Total: $${calculateTotal()}).`,
            recipients: [
              {
                id: "purchaser",
                email: formData.purchaserEmail,
                name: formData.purchaserName,
                role: "Purchaser",
              },
              {
                id: "seller",
                email: formData.sellerEmail,
                name: formData.sellerName,
                role: "Seller",
              },
              {
                id: "chairman",
                email: formData.chairmanEmail,
                name: formData.chairmanName || "Chairman",
                role: "Chairman of the Board",
              },
            ],
          },
        }
      );

      if (signWellError) {
        console.error("SignWell invoke error:", signWellError);
        throw new Error(signWellError.message || "SignWell function call failed");
      }

      // Check if the result contains an error from the edge function
      if (signWellResult?.error) {
        console.error("SignWell API error:", signWellResult.error, signWellResult.details);
        throw new Error(signWellResult.details || signWellResult.error);
      }

      if (!signWellResult?.documentId) {
        console.error("No document ID returned:", signWellResult);
        throw new Error("No document ID returned from SignWell");
      }

      // Update the instance with SignWell document ID
      await supabase
        .from("legal_doc_instances")
        .update({
          signwell_document_id: signWellResult.documentId,
          signwell_status: "sent",
        })
        .eq("id", instance.id);

      toast.success("Document sent for e-signature via SignWell!");
    } catch (err: any) {
      console.error("Error sending for signature:", err);
      const errorMessage = err?.message || "Unknown error occurred";
      toast.error(`Failed to send document: ${errorMessage}`);
    } finally {
      setSendingForSignature(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Generate Stock Purchase Agreement</CardTitle>
          <CardDescription>
            Generate a DOCX file or send directly for e-signature via SignWell
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Agreement Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Agreement Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="agreementDate">Agreement Date</Label>
              <Input
                id="agreementDate"
                value={formData.agreementDate}
                onChange={(e) => handleChange("agreementDate", e.target.value)}
                placeholder="January 1, 2025"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfShares">Number of Shares</Label>
                <Input
                  id="numberOfShares"
                  type="number"
                  value={formData.numberOfShares}
                  onChange={(e) => handleChange("numberOfShares", e.target.value)}
                  placeholder="100000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerShare">Price Per Share ($)</Label>
                <Input
                  id="pricePerShare"
                  type="number"
                  step="0.01"
                  value={formData.pricePerShare}
                  onChange={(e) => handleChange("pricePerShare", e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                Total Purchase Amount:{" "}
                <span className="font-semibold text-foreground">
                  ${calculateTotal()}
                </span>
              </p>
            </div>
          </div>

          <Separator />

          {/* Purchaser Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Purchaser Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="purchaserName">Purchaser Name *</Label>
              <Input
                id="purchaserName"
                value={formData.purchaserName}
                onChange={(e) => handleChange("purchaserName", e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaserEmail">Purchaser Email (for e-signature)</Label>
              <Input
                id="purchaserEmail"
                type="email"
                value={formData.purchaserEmail}
                onChange={(e) => handleChange("purchaserEmail", e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaserAddress">Purchaser Address</Label>
              <Input
                id="purchaserAddress"
                value={formData.purchaserAddress}
                onChange={(e) => handleChange("purchaserAddress", e.target.value)}
                placeholder="123 Main St, City, State ZIP"
              />
            </div>
          </div>

          <Separator />

          {/* Seller/Chairman Info (for e-signature) */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Seller & Chairman (for e-signature)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sellerName">Seller Name</Label>
                <Input
                  id="sellerName"
                  value={formData.sellerName}
                  onChange={(e) => handleChange("sellerName", e.target.value)}
                  placeholder="Seeksy, Inc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellerEmail">Seller Email</Label>
                <Input
                  id="sellerEmail"
                  type="email"
                  value={formData.sellerEmail}
                  onChange={(e) => handleChange("sellerEmail", e.target.value)}
                  placeholder="ceo@seeksy.io"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chairmanName">Chairman Name</Label>
                <Input
                  id="chairmanName"
                  value={formData.chairmanName}
                  onChange={(e) => handleChange("chairmanName", e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chairmanEmail">Chairman Email</Label>
                <Input
                  id="chairmanEmail"
                  type="email"
                  value={formData.chairmanEmail}
                  onChange={(e) => handleChange("chairmanEmail", e.target.value)}
                  placeholder="chairman@seeksy.io"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleGenerate}
              disabled={loading || sendingForSignature}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Download DOCX
                </>
              )}
            </Button>

            <Button
              onClick={handleSendForSignature}
              disabled={loading || sendingForSignature}
              className="w-full"
            >
              {sendingForSignature ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending to SignWell...
                </>
              ) : (
                <>
                  <PenLine className="mr-2 h-4 w-4" />
                  Send for E-Signature (SignWell)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
