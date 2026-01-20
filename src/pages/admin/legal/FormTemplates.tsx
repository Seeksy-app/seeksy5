import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
  FileText, Plus, Search, Edit, Trash2, 
  Upload, FileSignature, Eye, Users, AlertCircle
} from "lucide-react";

interface FormTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  docx_template_url: string;
  schema_json: unknown;
  signer_config_json: unknown;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SCHEMA = {
  version: 1,
  fields: [
    { key: "purchaser_name", label: "Purchaser Name", type: "text", required: true, token: "[PURCHASER_NAME]" },
    { key: "purchaser_email", label: "Purchaser Email", type: "email", required: true, validation: { format: "email" }, token: "[PURCHASER_EMAIL]" },
  ],
  ui: {
    sections: [
      { title: "Purchaser Information", fieldKeys: ["purchaser_name", "purchaser_email"] }
    ]
  }
};

const DEFAULT_SIGNER_CONFIG = {
  version: 1,
  mode: "sequential",
  roles: [
    { role: "purchaser", order: 1, required: true, signatureToken: "{%SIGNATURE_PURCHASER%}" },
    { role: "seller", order: 2, required: true, signatureToken: "{%SIGNATURE_SELLER%}" }
  ]
};

export default function FormTemplates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const queryClient = useQueryClient();
  
  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["form-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_templates")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as FormTemplate[];
    },
  });

  // Fetch doc instances count per template
  const { data: instanceCounts = {} } = useQuery({
    queryKey: ["form-templates-instance-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doc_instances")
        .select("form_template_id");
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach((row) => {
        counts[row.form_template_id] = (counts[row.form_template_id] || 0) + 1;
      });
      return counts;
    },
  });

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Form Templates</h1>
          <p className="text-muted-foreground">
            Create and manage form-first e-signature templates
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Form Template</DialogTitle>
            </DialogHeader>
            <CreateTemplateForm 
              onSuccess={() => {
                setIsCreateOpen(false);
                queryClient.invalidateQueries({ queryKey: ["form-templates"] });
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{templates.length}</p>
                <p className="text-sm text-muted-foreground">Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <FileSignature className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{templates.filter(t => t.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Object.values(instanceCounts).reduce((a, b) => a + b, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No templates found</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setIsCreateOpen(true)}
            >
              Create your first template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              instanceCount={instanceCounts[template.id] || 0}
              onEdit={() => setEditingTemplate(template)}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Template: {editingTemplate.name}</DialogTitle>
            </DialogHeader>
            <EditTemplateForm 
              template={editingTemplate}
              onSuccess={() => {
                setEditingTemplate(null);
                queryClient.invalidateQueries({ queryKey: ["form-templates"] });
              }} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TemplateCard({ 
  template, 
  instanceCount,
  onEdit 
}: { 
  template: FormTemplate; 
  instanceCount: number;
  onEdit: () => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const signerConfig = template.signer_config_json as { roles?: { role: string }[] };
  const signerCount = signerConfig?.roles?.length || 0;

  const toggleMutation = useMutation({
    mutationFn: async (is_active: boolean) => {
      const { error } = await supabase
        .from("form_templates")
        .update({ is_active })
        .eq("id", template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-templates"] });
      toast.success("Template updated");
    },
    onError: () => toast.error("Failed to update template"),
  });

  return (
    <Card className={!template.is_active ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileSignature className="w-5 h-5 text-primary" />
          </div>
          <Switch
            checked={template.is_active}
            onCheckedChange={(checked) => toggleMutation.mutate(checked)}
          />
        </div>
        <CardTitle className="text-lg mt-3">{template.name}</CardTitle>
        {template.description && (
          <CardDescription>{template.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Badge variant="outline">{signerCount} signer{signerCount !== 1 ? 's' : ''}</Badge>
          <span>•</span>
          <span>{instanceCount} document{instanceCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button size="sm" className="flex-1" onClick={() => navigate(`/admin/legal/docs/new?template=${template.id}`)}>
            <Plus className="w-4 h-4 mr-1" />
            Create Doc
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateTemplateForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [schemaJson, setSchemaJson] = useState(JSON.stringify(DEFAULT_SCHEMA, null, 2));
  const [signerConfigJson, setSignerConfigJson] = useState(JSON.stringify(DEFAULT_SIGNER_CONFIG, null, 2));
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonErrors, setJsonErrors] = useState<{ schema?: string; signer?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateJsonFields = () => {
    const errors: { schema?: string; signer?: string } = {};
    try {
      JSON.parse(schemaJson);
    } catch {
      errors.schema = "Invalid JSON format";
    }
    try {
      JSON.parse(signerConfigJson);
    } catch {
      errors.signer = "Invalid JSON format";
    }
    setJsonErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!name || !docxFile) {
      toast.error("Name and DOCX template are required");
      return;
    }
    if (!validateJsonFields()) return;

    setIsSubmitting(true);
    try {
      // Upload DOCX to storage
      const fileName = `${Date.now()}-${docxFile.name}`;
      const filePath = `form-templates/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("legal-templates")
        .upload(filePath, docxFile);
      
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("legal-templates")
        .getPublicUrl(filePath);

      // Get default tenant (seeksy_platform)
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("tenant_type", "seeksy_platform")
        .single();

      if (!tenant) throw new Error("No platform tenant found");

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Insert template
      const { error: insertError } = await supabase
        .from("form_templates")
        .insert({
          tenant_id: tenant.id,
          name,
          description: description || null,
          docx_template_url: urlData.publicUrl,
          schema_json: JSON.parse(schemaJson),
          signer_config_json: JSON.parse(signerConfigJson),
          created_by: user?.id,
        });

      if (insertError) throw insertError;

      toast.success("Template created");
      onSuccess();
    } catch (err: any) {
      console.error("Create template error:", err);
      toast.error(err.message || "Failed to create template");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Template Name *</Label>
        <Input
          id="name"
          placeholder="e.g., Stock Purchase Agreement"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Brief description of this template..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>DOCX Template *</Label>
        <div className="flex gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={(e) => setDocxFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {docxFile ? docxFile.name : "Upload DOCX Template"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Use tokens like [PURCHASER_NAME] for field replacement and {'{'}%SIGNATURE_PURCHASER%{'}'} for signatures
        </p>
      </div>

      <div className="space-y-2">
        <Label>Form Schema (JSON)</Label>
        <Textarea
          value={schemaJson}
          onChange={(e) => {
            setSchemaJson(e.target.value);
            setJsonErrors(prev => ({ ...prev, schema: undefined }));
          }}
          rows={10}
          className="font-mono text-sm"
        />
        {jsonErrors.schema && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {jsonErrors.schema}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Signer Configuration (JSON)</Label>
        <Textarea
          value={signerConfigJson}
          onChange={(e) => {
            setSignerConfigJson(e.target.value);
            setJsonErrors(prev => ({ ...prev, signer: undefined }));
          }}
          rows={8}
          className="font-mono text-sm"
        />
        {jsonErrors.signer && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {jsonErrors.signer}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Template"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function EditTemplateForm({ template, onSuccess }: { template: FormTemplate; onSuccess: () => void }) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description || "");
  const [schemaJson, setSchemaJson] = useState(JSON.stringify(template.schema_json, null, 2));
  const [signerConfigJson, setSignerConfigJson] = useState(JSON.stringify(template.signer_config_json, null, 2));
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonErrors, setJsonErrors] = useState<{ schema?: string; signer?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateJsonFields = () => {
    const errors: { schema?: string; signer?: string } = {};
    try {
      JSON.parse(schemaJson);
    } catch {
      errors.schema = "Invalid JSON format";
    }
    try {
      JSON.parse(signerConfigJson);
    } catch {
      errors.signer = "Invalid JSON format";
    }
    setJsonErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!name) {
      toast.error("Name is required");
      return;
    }
    if (!validateJsonFields()) return;

    setIsSubmitting(true);
    try {
      let docxUrl = template.docx_template_url;

      // Upload new DOCX if provided
      if (docxFile) {
        const fileName = `${Date.now()}-${docxFile.name}`;
        const filePath = `form-templates/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from("legal-docs")
          .upload(filePath, docxFile);
        
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("legal-docs")
          .getPublicUrl(filePath);
        
        docxUrl = urlData.publicUrl;
      }

      // Update template
      const { error: updateError } = await supabase
        .from("form_templates")
        .update({
          name,
          description: description || null,
          docx_template_url: docxUrl,
          schema_json: JSON.parse(schemaJson),
          signer_config_json: JSON.parse(signerConfigJson),
        })
        .eq("id", template.id);

      if (updateError) throw updateError;

      toast.success("Template updated");
      onSuccess();
    } catch (err: any) {
      console.error("Update template error:", err);
      toast.error(err.message || "Failed to update template");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Template Name *</Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>DOCX Template</Label>
        <div className="flex gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={(e) => setDocxFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {docxFile ? docxFile.name : "Replace DOCX Template (optional)"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Current: {template.docx_template_url.split("/").pop()}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Form Schema (JSON)</Label>
        <Textarea
          value={schemaJson}
          onChange={(e) => {
            setSchemaJson(e.target.value);
            setJsonErrors(prev => ({ ...prev, schema: undefined }));
          }}
          rows={10}
          className="font-mono text-sm"
        />
        {jsonErrors.schema && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {jsonErrors.schema}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Signer Configuration (JSON)</Label>
        <Textarea
          value={signerConfigJson}
          onChange={(e) => {
            setSignerConfigJson(e.target.value);
            setJsonErrors(prev => ({ ...prev, signer: undefined }));
          }}
          rows={8}
          className="font-mono text-sm"
        />
        {jsonErrors.signer && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {jsonErrors.signer}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </div>
  );
}
