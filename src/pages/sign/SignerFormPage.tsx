import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DynamicFormRenderer, validateFormData, FormSchema } from "@/components/legal/DynamicFormRenderer";
import { Loader2, FileSignature, AlertCircle, Clock, CheckCircle } from "lucide-react";
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
    schema_json: FormSchema;
  };
  doc_instance: {
    status: string;
    submission_json: Record<string, unknown> | null;
    preview_pdf_url: string | null;
  };
}

export default function SignerFormPage() {
  const { accessToken } = useParams<{ accessToken: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<SignerContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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
        
        // Pre-fill form if submission exists
        if (data.doc_instance?.submission_json) {
          setFormValues(data.doc_instance.submission_json);
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

  const handleSubmit = async () => {
    if (!context) return;

    // Validate form
    const { valid, errors } = validateFormData(context.form_template.schema_json, formValues);
    if (!valid) {
      setFormErrors(errors);
      toast.error("Please fix the form errors");
      return;
    }
    setFormErrors({});

    setSubmitting(true);
    try {
      const { data, error: submitError } = await supabase.functions.invoke("legal-submit-form-and-generate", {
        body: { 
          accessToken,
          submission_json: formValues,
        },
      });

      if (submitError) throw submitError;
      if (data.error) throw new Error(data.error);

      toast.success("Form submitted successfully");
      navigate(`/sign/${accessToken}/review`);
    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error(err.message || "Failed to submit form");
    } finally {
      setSubmitting(false);
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
  if (!context.is_current_signer_allowed) {
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

  // Check if already signed
  if (context.status === "signed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
              <h2 className="mt-4 text-lg font-semibold">Already Signed</h2>
              <p className="mt-2 text-muted-foreground">
                You have already signed this document.
              </p>
              {context.doc_instance.preview_pdf_url && (
                <Button className="mt-4" variant="outline" asChild>
                  <a href={context.doc_instance.preview_pdf_url} target="_blank" rel="noopener noreferrer">
                    View Document
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if form already submitted - go to review
  if (context.doc_instance.submission_json && context.doc_instance.preview_pdf_url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileSignature className="w-12 h-12 mx-auto text-primary" />
              <h2 className="mt-4 text-lg font-semibold">Ready to Sign</h2>
              <p className="mt-2 text-muted-foreground">
                The document is ready for your signature.
              </p>
              <Button 
                className="mt-4" 
                onClick={() => navigate(`/sign/${accessToken}/review`)}
              >
                Review & Sign
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <FileSignature className="w-12 h-12 mx-auto text-primary" />
          <h1 className="mt-4 text-2xl font-bold">{context.form_template.name}</h1>
          <p className="mt-2 text-muted-foreground">
            Please complete the form below to proceed with signing
          </p>
        </div>

        {/* Signer Info */}
        <Alert>
          <AlertDescription>
            Signing as: <strong>{context.email}</strong> ({context.role})
          </AlertDescription>
        </Alert>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
            <CardDescription>
              Fill in all required fields to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DynamicFormRenderer
              schema={context.form_template.schema_json}
              values={formValues}
              onChange={setFormValues}
              errors={formErrors}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Continue to Review
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
