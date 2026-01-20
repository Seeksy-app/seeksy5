import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, FileText, Keyboard, Loader2, Pencil, Trash2 } from "lucide-react";

export default function Templates() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "General",
    subject: "",
    content: "",
    shortcut_key: "",
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["ticket-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createTemplate = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("ticket_templates")
        .insert({ ...formData, created_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-templates"] });
      toast.success("Template created");
      resetForm();
    },
    onError: () => {
      toast.error("Failed to create template");
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("ticket_templates")
        .update(formData)
        .eq("id", editingTemplate.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-templates"] });
      toast.success("Template updated");
      resetForm();
    },
    onError: () => {
      toast.error("Failed to update template");
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ticket_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-templates"] });
      toast.success("Template deleted");
    },
    onError: () => {
      toast.error("Failed to delete template");
    },
  });

  const resetForm = () => {
    setShowCreateModal(false);
    setEditingTemplate(null);
    setFormData({
      name: "",
      category: "General",
      subject: "",
      content: "",
      shortcut_key: "",
    });
  };

  const openEdit = (template: any) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category || "General",
      subject: template.subject || "",
      content: template.content,
      shortcut_key: template.shortcut_key || "",
    });
    setShowCreateModal(true);
  };

  const groupedTemplates = templates.reduce((acc: any, template: any) => {
    const cat = template.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(template);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Templates & Macros</h1>
          <p className="text-muted-foreground">Pre-written responses for faster replies</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Keyboard Shortcuts Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Keyboard Shortcuts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 text-sm">
            {templates.filter((t: any) => t.shortcut_key).map((t: any) => (
              <div key={t.id} className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{t.shortcut_key}</kbd>
                <span className="text-muted-foreground">{t.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Templates by Category */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : Object.keys(groupedTemplates).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No templates yet</p>
            <p className="text-sm">Create templates to speed up your responses</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedTemplates).map(([category, categoryTemplates]: [string, any]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-lg font-medium">{category}</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {categoryTemplates.map((template: any) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <div className="flex items-center gap-1">
                        {template.shortcut_key && (
                          <Badge variant="outline" className="text-xs font-mono">
                            {template.shortcut_key}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {template.content}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(template)}>
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteTemplate.mutate(template.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="Template name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Shortcut Key</Label>
                <Input
                  placeholder="e.g., G"
                  maxLength={2}
                  value={formData.shortcut_key}
                  onChange={(e) => setFormData({ ...formData, shortcut_key: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Billing">Billing</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject (optional)</Label>
              <Input
                placeholder="Email subject line"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                placeholder="Template content... Use {{customer_name}} for variables"
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Available variables: {"{{customer_name}}"}, {"{{ticket_number}}"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button 
              onClick={() => editingTemplate ? updateTemplate.mutate() : createTemplate.mutate()} 
              disabled={!formData.name || !formData.content || createTemplate.isPending || updateTemplate.isPending}
            >
              {(createTemplate.isPending || updateTemplate.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingTemplate ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}