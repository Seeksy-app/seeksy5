import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SignaturePad } from "@/components/legal/SignaturePad";
import { Loader2, FileSignature, AlertCircle, Clock, CheckCircle, Download, Eye } from "lucide-react";
import { toast } from "sonner";

interface SignerContext {
  doc_instance_id: string;
  signer_id: string;
  role: string;
  email: string;
  signing_order: number;
  status: string;
  is_current_signer_allowed: boolean;
  form_template: {
    name: string;
  };
  doc_instance: {
    status: string;
    preview_pdf_url: string | null;
    final_pdf_url: string | null;
  };
}

export default function SignerReviewPage() {
  const { accessToken } = useParams<{ accessToken: string }>();
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<SignerContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    const fetchContext = async () => {
      if (!accessToken) {
        setError("Invalid access link");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase.functions.invoke("legal-get-signer-context", {
          body: { accessToken },
        });

        if (fetchError) throw fetchError;
        if (data.error) throw new Error(data.error);

        setContext(data);
        if (data.status === "signed") {
          setSigned(true);
        }
      } catch (err: any) {
        console.error("Fetch context error:", err);
        setError(err.message || "Failed to load document");
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, [accessToken]);

  const handleSign = async (signatureDataUrl: string) => {
    if (!context) return;

    setSigning(true);
    try {
      const { data, error: signError } = await supabase.functions.invoke("legal-sign-and-finalize", {
        body: { 
          accessToken,
          signature_png_base64: signatureDataUrl,
          signature_type: "drawn",
        },
      });

      if (signError) throw signError;
      if (data.error) throw new Error(data.error);

      setSigned(true);
      setSignDialogOpen(false);
      toast.success("Document signed successfully!");

      // Update context with new data if available
      if (data.final_pdf_url) {
        setContext(prev => prev ? {
          ...prev,
          status: "signed",
          doc_instance: {
            ...prev.doc_instance,
            final_pdf_url: data.final_pdf_url,
          }
        } : null);
      }
    } catch (err: any) {
      console.error("Sign error:", err);
      toast.error(err.message || "Failed to sign document");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
              <h2 className="mt-4 text-lg font-semibold">Access Error</h2>
              <p className="mt-2 text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!context) {
    return null;
  }

  // Check if waiting for previous signer
  if (!context.is_current_signer_allowed && !signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-12 h-12 mx-auto text-amber-500" />
              <h2 className="mt-4 text-lg font-semibold">Waiting for Previous Signer</h2>
              <p className="mt-2 text-muted-foreground">
                This document requires signatures in a specific order. 
                Please wait for the previous signer to complete their signature.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state after signing
  if (signed || context.status === "signed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
              <h2 className="mt-4 text-xl font-semibold">Document Signed!</h2>
              <p className="mt-2 text-muted-foreground">
                Thank you for signing. 
                {context.doc_instance.status !== "completed" && " Other signers will be notified."}
              </p>
              
              {context.doc_instance.final_pdf_url && (
                <Button className="mt-6" asChild>
                  <a href={context.doc_instance.final_pdf_url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download Signed Document
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No preview available
  if (!context.doc_instance.preview_pdf_url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-amber-500" />
              <h2 className="mt-4 text-lg font-semibold">Document Not Ready</h2>
              <p className="mt-2 text-muted-foreground">
                The document preview is not available yet. Please complete the form first.
              </p>
              <Button 
                className="mt-4" 
                variant="outline"
                onClick={() => window.location.href = `/sign/${accessToken}/form`}
              >
                Go to Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <FileSignature className="w-12 h-12 mx-auto text-primary" />
          <h1 className="mt-4 text-2xl font-bold">{context.form_template.name}</h1>
          <p className="mt-2 text-muted-foreground">
            Review the document below and sign when ready
          </p>
        </div>

        {/* Signer Info */}
        <Alert>
          <AlertDescription>
            Signing as: <strong>{context.email}</strong> ({context.role})
          </AlertDescription>
        </Alert>

        {/* PDF Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Document Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden bg-white">
              <iframe
                src={context.doc_instance.preview_pdf_url}
                className="w-full h-[600px]"
                title="Document Preview"
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              Scroll through the document to review all pages before signing
            </p>
          </CardContent>
        </Card>

        {/* Sign Button */}
        <div className="flex justify-center">
          <Button 
            size="lg" 
            onClick={() => setSignDialogOpen(true)}
            className="min-w-[200px]"
          >
            <FileSignature className="w-5 h-5 mr-2" />
            Sign Document
          </Button>
        </div>

        {/* Legal Notice */}
        <p className="text-xs text-muted-foreground text-center max-w-xl mx-auto">
          By signing this document, you acknowledge that you have read, understand, and agree 
          to be bound by the terms and conditions set forth in this agreement. Your electronic 
          signature has the same legal effect as a handwritten signature.
        </p>
      </div>

      {/* Signature Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sign Document</DialogTitle>
          </DialogHeader>
          
          <SignaturePad
            title={`Sign as ${context.role}`}
            onSign={handleSign}
            disabled={signing}
          />

          {signing && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Processing signature...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
