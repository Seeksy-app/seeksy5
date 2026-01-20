import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  signer_config_json: {
    roles?: Array<{
      role: string;
      order: number;
      required: boolean;
    }>;
  };
}

interface SignerEntry {
  role: string;
  name: string;
  email: string;
  order: number;
}

export default function DocCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const templateIdFromUrl = searchParams.get("template");

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templateIdFromUrl || "");
  const [documentTitle, setDocumentTitle] = useState("");
  const [signers, setSigners] = useState<SignerEntry[]>([]);

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["form-templates-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_templates")
        .select("id, name, description, signer_config_json")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data as FormTemplate[];
    },
  });

  // Get selected template
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Initialize signers when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const roles = selectedTemplate.signer_config_json?.roles || [];
      setSigners(
        roles.map(r => ({
          role: r.role,
          name: "",
          email: "",
          order: r.order,
        }))
      );
      // Set default title
      if (!documentTitle) {
        setDocumentTitle(`${selectedTemplate.name} - ${format(new Date(), "MMM d, yyyy")}`);
      }
    }
  }, [selectedTemplate]);

  // Set template from URL on load
  useEffect(() => {
    if (templateIdFromUrl && !selectedTemplateId) {
      setSelectedTemplateId(templateIdFromUrl);
    }
  }, [templateIdFromUrl]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedTemplateId) {
        throw new Error("Missing user or template selection");
      }

      const insertPayload = {
        tenant_id: "a0000000-0000-0000-0000-000000000001",
        form_template_id: selectedTemplateId,
        status: "draft",
        submission_json: { document_title: documentTitle.trim() },
        created_by: user.id,
      };

      console.log("Creating doc_instance with payload:", insertPayload);

      const { data: instance, error } = await supabase
        .from("doc_instances")
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error("doc_instances insert error:", error);
        throw new Error(error.message || "Database insert failed");
      }

      console.log("Created doc_instance:", instance);

      // Create signer records
      const signerRecords = signers
        .filter(s => s.email)
        .map(s => ({
          doc_instance_id: instance.id,
          role: s.role,
          name: s.name || s.role,
          email: s.email,
          signing_order: s.order,
          status: "pending",
        }));

      if (signerRecords.length > 0) {
        const { error: signersError } = await supabase
          .from("doc_signers")
          .insert(signerRecords);

        if (signersError) {
          console.error("doc_signers insert error:", signersError);
          throw new Error(signersError.message || "Failed to create signers");
        }
      }

      return instance;
    },
    onSuccess: (instance) => {
      toast.success("Document created successfully");
      navigate(`/admin/legal/docs`);
    },
    onError: (error: Error) => {
      console.error("Create document failed:", error);
      toast.error(`Failed: ${error.message}`);
    },
  });

  const updateSigner = (index: number, field: keyof SignerEntry, value: string) => {
    setSigners(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const canCreate = selectedTemplateId && documentTitle.trim();

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Create Document
          </CardTitle>
          <CardDescription>
            Create a new document instance from a template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Template *</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate?.description && (
              <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
            )}
          </div>

          {/* Document Title */}
          <div className="space-y-2">
            <Label>Document Title *</Label>
            <Input
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Enter document title..."
            />
          </div>

          {/* Signers */}
          {signers.length > 0 && (
            <div className="space-y-4">
              <Label>Signers</Label>
              <div className="space-y-3">
                {signers.map((signer, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">
                        {signer.order}. {signer.role}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={signer.name}
                          onChange={(e) => updateSigner(index, "name", e.target.value)}
                          placeholder="Signer name"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Email</Label>
                        <Input
                          type="email"
                          value={signer.email}
                          onChange={(e) => updateSigner(index, "email", e.target.value)}
                          placeholder="signer@example.com"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                You can add signer details now or fill them in later when editing the document.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createMutation.mutate()}
              disabled={!canCreate || createMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              {createMutation.isPending ? "Creating..." : "Create Document"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}