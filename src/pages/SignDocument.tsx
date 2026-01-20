import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import { CheckCircle2, FileCheck } from "lucide-react";

export default function SignDocument() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(false);
  const [signed, setSigned] = useState(false);
  const sigCanvas = useRef<SignatureCanvas>(null);

  const { data: document } = useQuery({
    queryKey: ["signature-document", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signature_documents")
        .select("*")
        .eq("access_token", token)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  const handleSign = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      toast.error("Please provide your signature");
      return;
    }

    setLoading(true);
    try {
      const signatureData = sigCanvas.current.toDataURL();

      const { error } = await supabase
        .from("signature_documents")
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
          signature_data: [
            {
              signer: document?.recipient_name,
              signature: signatureData,
              signed_at: new Date().toISOString(),
            },
          ],
        })
        .eq("access_token", token);

      if (error) throw error;

      setSigned(true);
      toast.success("Document signed successfully!");
    } catch (error) {
      console.error("Error signing document:", error);
      toast.error("Failed to sign document");
    } finally {
      setLoading(false);
    }
  };

  if (!document) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading document...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (document.status === "signed" || signed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle2 className="w-6 h-6" />
              Document Signed
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              This document has been successfully signed.
            </p>
            <p className="text-sm text-muted-foreground">
              Signed on: {new Date(document.signed_at || Date.now()).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-6 h-6" />
              {document.document_title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Please review and sign the document below
            </p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {document.document_content}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Signature</CardTitle>
            <p className="text-sm text-muted-foreground">
              Please sign in the box below using your mouse or touchscreen
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg bg-white">
              <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{
                  className: "w-full h-48 touch-none",
                }}
                backgroundColor="white"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => sigCanvas.current?.clear()}
              >
                Clear
              </Button>
              <Button onClick={handleSign} disabled={loading}>
                {loading ? "Signing..." : "Sign Document"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              By signing this document, you agree to its terms and conditions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
