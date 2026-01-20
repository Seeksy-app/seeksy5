import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  FileText, Plus, Search, Edit, Eye, Send, 
  CheckCircle, Clock, AlertCircle, FileSignature,
  Users, Building2, Shield, Handshake
} from "lucide-react";

interface LegalTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  body_text: string;
  requires_signature: boolean;
  placeholders: unknown;
  target_roles: string[];
  is_active: boolean;
  version: string;
  created_at: string;
}

interface LegalAcceptance {
  id: string;
  user_id: string;
  document_type: string;
  version_accepted: string;
  accepted_at: string;
  ip_address: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  platform: { label: "Platform", icon: FileText, color: "bg-blue-500/10 text-blue-500" },
  creator: { label: "Creator", icon: Users, color: "bg-green-500/10 text-green-500" },
  advertiser: { label: "Advertiser", icon: Building2, color: "bg-purple-500/10 text-purple-500" },
  investor: { label: "Investor", icon: Handshake, color: "bg-amber-500/10 text-amber-500" },
  board: { label: "Board", icon: Shield, color: "bg-red-500/10 text-red-500" },
  nda: { label: "NDA", icon: FileSignature, color: "bg-orange-500/10 text-orange-500" },
  general: { label: "General", icon: FileText, color: "bg-gray-500/10 text-gray-500" },
};

export default function LegalTemplatesLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingTemplate, setEditingTemplate] = useState<LegalTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["legal-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_templates")
        .select("*")
        .order("category", { ascending: true });
      
      if (error) throw error;
      return data as LegalTemplate[];
    },
  });

  // Fetch acceptances for analytics
  const { data: acceptances = [] } = useQuery({
    queryKey: ["legal-acceptances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_acceptances")
        .select("*")
        .order("accepted_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as LegalAcceptance[];
    },
  });

  // Fetch document instances
  const { data: instances = [] } = useQuery({
    queryKey: ["legal-doc-instances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_doc_instances")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  // Toggle template active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("legal_templates")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-templates"] });
      toast.success("Template updated");
    },
    onError: () => toast.error("Failed to update template"),
  });

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getAcceptanceCount = (templateSlug: string) => {
    return acceptances.filter(a => a.document_type === templateSlug).length;
  };

  const getSignedCount = (templateId: string) => {
    return instances.filter(i => i.template_id === templateId && i.status === "completed").length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Legal Documents Library</h1>
          <p className="text-muted-foreground">
            Manage templates for agreements, NDAs, and platform policies
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <CreateTemplateForm onSuccess={() => {
              setIsCreateDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ["legal-templates"] });
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_CONFIG).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{acceptances.length}</p>
                <p className="text-sm text-muted-foreground">Acceptances</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileSignature className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {instances.filter(i => i.status === "completed").length}
                </p>
                <p className="text-sm text-muted-foreground">Signed Docs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {instances.filter(i => i.status === "pending" || i.signwell_status === "partially_signed").length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid */}
      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="instances">Document Instances</TabsTrigger>
          <TabsTrigger value="acceptances">Click-wrap Log</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          {templatesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const config = CATEGORY_CONFIG[template.category] || CATEGORY_CONFIG.general;
                const Icon = config.icon;
                
                return (
                  <Card key={template.id} className={!template.is_active ? "opacity-60" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={template.requires_signature ? "default" : "secondary"}>
                            {template.requires_signature ? "E-Sign" : "Click-wrap"}
                          </Badge>
                          <Switch
                            checked={template.is_active}
                            onCheckedChange={(checked) => 
                              toggleActiveMutation.mutate({ id: template.id, is_active: checked })
                            }
                          />
                        </div>
                      </div>
                      <CardTitle className="text-lg mt-3">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <span>v{template.version}</span>
                        <span>
                          {template.requires_signature 
                            ? `${getSignedCount(template.id)} signed`
                            : `${getAcceptanceCount(template.slug)} accepted`
                          }
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <a href={`/admin/legal/templates/${template.slug}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingTemplate(template)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        {template.requires_signature && (
                          <Button size="sm" className="flex-1" asChild>
                            <a href={`/admin/legal/send/${template.slug}`}>
                              <Send className="w-4 h-4 mr-1" />
                              Send
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="instances" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Instances</CardTitle>
              <CardDescription>All generated and signed legal documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {instances.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No documents yet</p>
                ) : (
                  instances.map((instance: any) => (
                    <div key={instance.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileSignature className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {instance.recipient_name || instance.field_values_json?.purchaserName || "Document"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {instance.recipient_email || instance.purchaser_email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          instance.status === "completed" ? "default" :
                          instance.signwell_status === "partially_signed" ? "secondary" :
                          "outline"
                        }>
                          {instance.status === "completed" ? "Signed" :
                           instance.signwell_status === "partially_signed" ? "Partial" :
                           instance.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(instance.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acceptances" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Click-wrap Acceptance Log</CardTitle>
              <CardDescription>Audit trail of Terms & Privacy acceptances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {acceptances.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No acceptances recorded yet</p>
                ) : (
                  acceptances.map((acceptance) => (
                    <div key={acceptance.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium">{acceptance.document_type}</p>
                          <p className="text-sm text-muted-foreground">
                            Version {acceptance.version_accepted}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {new Date(acceptance.accepted_at).toLocaleString()}
                        </span>
                        {acceptance.ip_address && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {acceptance.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                queryClient.invalidateQueries({ queryKey: ["legal-templates"] });
              }} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Create Template Form
function CreateTemplateForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category: "general",
    description: "",
    body_text: "",
    requires_signature: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("legal_templates").insert({
        ...formData,
        placeholders: [],
        target_roles: [],
      });
      if (error) throw error;
      toast.success("Template created");
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Template Name</Label>
          <Input 
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Creator Agreement"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input 
            value={formData.slug} 
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            placeholder="e.g., creator-agreement"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_CONFIG).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex items-end gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.requires_signature}
              onCheckedChange={(v) => setFormData({ ...formData, requires_signature: v })}
            />
            <Label>Requires E-Signature</Label>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input 
          value={formData.description} 
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this template"
        />
      </div>
      <div className="space-y-2">
        <Label>Document Body</Label>
        <Textarea 
          value={formData.body_text} 
          onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
          placeholder="Enter the full document text with [PLACEHOLDER] markers..."
          rows={10}
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Template"}
        </Button>
      </div>
    </form>
  );
}

// Edit Template Form
function EditTemplateForm({ template, onSuccess }: { template: LegalTemplate; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: template.name,
    description: template.description || "",
    body_text: template.body_text,
    requires_signature: template.requires_signature,
    is_active: template.is_active,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("legal_templates")
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", template.id);
      if (error) throw error;
      toast.success("Template updated");
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Template Name</Label>
        <Input 
          value={formData.name} 
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input 
          value={formData.description} 
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.requires_signature}
            onCheckedChange={(v) => setFormData({ ...formData, requires_signature: v })}
          />
          <Label>Requires E-Signature</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
          />
          <Label>Active</Label>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Document Body</Label>
        <Textarea 
          value={formData.body_text} 
          onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
          rows={15}
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
