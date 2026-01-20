import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, Plus, Search, Eye, Send, Copy, 
  CheckCircle, Clock, AlertCircle, XCircle,
  ExternalLink, Users
} from "lucide-react";
import { format } from "date-fns";

interface DocInstance {
  id: string;
  tenant_id: string;
  form_template_id: string;
  status: string;
  submission_json: unknown;
  merged_docx_url: string | null;
  preview_pdf_url: string | null;
  final_pdf_url: string | null;
  audit_json: unknown;
  created_at: string;
  updated_at: string;
  form_templates?: {
    id: string;
    name: string;
  };
}

interface DocSigner {
  id: string;
  doc_instance_id: string;
  role: string;
  name: string | null;
  email: string;
  signing_order: number;
  status: string;
  signed_at: string | null;
  access_token: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  draft: { label: "Draft", icon: FileText, color: "bg-gray-500/10 text-gray-500" },
  collecting: { label: "Collecting", icon: Clock, color: "bg-blue-500/10 text-blue-500" },
  ready_to_sign: { label: "Ready to Sign", icon: AlertCircle, color: "bg-amber-500/10 text-amber-500" },
  signing: { label: "Signing", icon: Clock, color: "bg-purple-500/10 text-purple-500" },
  completed: { label: "Completed", icon: CheckCircle, color: "bg-green-500/10 text-green-500" },
  void: { label: "Void", icon: XCircle, color: "bg-red-500/10 text-red-500" },
};

export default function DocInstances() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstance, setSelectedInstance] = useState<DocInstance | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(searchParams.has("template"));
  const queryClient = useQueryClient();

  // Fetch documents
  const { data: instances = [], isLoading } = useQuery({
    queryKey: ["doc-instances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doc_instances")
        .select(`
          *,
          form_templates (id, name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as DocInstance[];
    },
  });

  // Fetch templates for create dialog
  const { data: templates = [] } = useQuery({
    queryKey: ["form-templates-for-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_templates")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const filteredInstances = instances.filter((doc) => {
    const templateName = doc.form_templates?.name || "";
    return templateName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Document Instances</h1>
          <p className="text-muted-foreground">
            Manage document signing workflows
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Document
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(STATUS_CONFIG).slice(0, 4).map(([status, config]) => {
          const Icon = config.icon;
          const count = instances.filter(i => i.status === status).length;
          return (
            <Card key={status}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">{config.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredInstances.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No documents found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstances.map((doc) => {
                  const config = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
                  const Icon = config.icon;
                  
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {doc.form_templates?.name || "Unknown Template"}
                      </TableCell>
                      <TableCell>
                        <Badge className={config.color} variant="secondary">
                          <Icon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(doc.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(doc.updated_at), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedInstance(doc)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <CreateDocDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        templates={templates}
        defaultTemplateId={searchParams.get("template") || undefined}
        onSuccess={(docId) => {
          setIsCreateOpen(false);
          queryClient.invalidateQueries({ queryKey: ["doc-instances"] });
          // Open the new doc
          const newDoc = instances.find(i => i.id === docId);
          if (newDoc) setSelectedInstance(newDoc);
        }}
      />

      {/* Detail Dialog */}
      {selectedInstance && (
        <DocDetailDialog
          doc={selectedInstance}
          open={!!selectedInstance}
          onOpenChange={() => setSelectedInstance(null)}
        />
      )}
    </div>
  );
}

function CreateDocDialog({
  open,
  onOpenChange,
  templates,
  defaultTemplateId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: { id: string; name: string }[];
  defaultTemplateId?: string;
  onSuccess: (docId: string) => void;
}) {
  const [templateId, setTemplateId] = useState(defaultTemplateId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!templateId) {
      toast.error("Please select a template");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Get template to fetch tenant_id
      const { data: template, error: templateError } = await supabase
        .from("form_templates")
        .select("tenant_id")
        .eq("id", templateId)
        .single();

      if (templateError) throw templateError;

      // Create doc instance
      const { data, error } = await supabase
        .from("doc_instances")
        .insert({
          tenant_id: template.tenant_id,
          form_template_id: templateId,
          status: "draft",
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Document created");
      onSuccess(data.id);
    } catch (err: any) {
      console.error("Create doc error:", err);
      toast.error(err.message || "Failed to create document");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isSubmitting || !templateId}>
            {isSubmitting ? "Creating..." : "Create Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DocDetailDialog({
  doc,
  open,
  onOpenChange,
}: {
  doc: DocInstance;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [addSignerOpen, setAddSignerOpen] = useState(false);

  // Fetch signers
  const { data: signers = [], refetch: refetchSigners } = useQuery({
    queryKey: ["doc-signers", doc.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doc_signers")
        .select("*")
        .eq("doc_instance_id", doc.id)
        .order("signing_order");
      
      if (error) throw error;
      return data as DocSigner[];
    },
    enabled: open,
  });

  const generateTokenMutation = useMutation({
    mutationFn: async (signerId: string) => {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      const { error } = await supabase
        .from("doc_signers")
        .update({
          access_token: token,
          token_expires_at: expiresAt.toISOString(),
        })
        .eq("id", signerId);

      if (error) throw error;
      return token;
    },
    onSuccess: (token) => {
      const url = `${window.location.origin}/sign/${token}/form`;
      navigator.clipboard.writeText(url);
      toast.success("Signing link copied to clipboard");
      refetchSigners();
    },
    onError: () => toast.error("Failed to generate link"),
  });

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/sign/${token}/form`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const config = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
  const StatusIcon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {doc.form_templates?.name || "Document"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-4">
            <Badge className={config.color} variant="secondary">
              <StatusIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Created {format(new Date(doc.created_at), "MMM d, yyyy")}
            </span>
          </div>

          {/* Documents */}
          {(doc.preview_pdf_url || doc.final_pdf_url) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {doc.preview_pdf_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={doc.preview_pdf_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview PDF
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                )}
                {doc.final_pdf_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={doc.final_pdf_url} target="_blank" rel="noopener noreferrer">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Final Signed PDF
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Signers */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Signers
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setAddSignerOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Signer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {signers.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  No signers added yet
                </p>
              ) : (
                <div className="space-y-3">
                  {signers.map((signer) => (
                    <div 
                      key={signer.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {signer.signing_order}
                        </div>
                        <div>
                          <p className="font-medium">
                            {signer.name || signer.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {signer.role} • {signer.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          signer.status === "signed" ? "default" :
                          signer.status === "viewed" ? "secondary" : "outline"
                        }>
                          {signer.status}
                        </Badge>
                        {signer.access_token ? (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => copyLink(signer.access_token!)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateTokenMutation.mutate(signer.id)}
                            disabled={generateTokenMutation.isPending}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Generate Link
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Signer Dialog */}
        <AddSignerDialog
          open={addSignerOpen}
          onOpenChange={setAddSignerOpen}
          docInstanceId={doc.id}
          existingSignersCount={signers.length}
          onSuccess={() => {
            setAddSignerOpen(false);
            refetchSigners();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddSignerDialog({
  open,
  onOpenChange,
  docInstanceId,
  existingSignersCount,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docInstanceId: string;
  existingSignersCount: number;
  onSuccess: () => void;
}) {
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!role || !email) {
      toast.error("Role and email are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("doc_signers")
        .insert({
          doc_instance_id: docInstanceId,
          role,
          name: name || null,
          email,
          signing_order: existingSignersCount + 1,
        });

      if (error) throw error;

      toast.success("Signer added");
      setRole("");
      setName("");
      setEmail("");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to add signer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Signer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Role *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="purchaser">Purchaser</SelectItem>
                <SelectItem value="seller">Seller</SelectItem>
                <SelectItem value="chairman">Chairman</SelectItem>
                <SelectItem value="witness">Witness</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              placeholder="signer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={isSubmitting || !role || !email}>
            {isSubmitting ? "Adding..." : "Add Signer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
