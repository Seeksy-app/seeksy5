import { useState } from "react";
import { sanitizeEmailHtml } from "@/lib/sanitizeHtml";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Eye, Send, FolderPlus, Folder } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface EmailTemplateFullScreenEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    id: string;
    name: string;
    previewHtml: string;
  };
}

export const EmailTemplateFullScreenEditor = ({ open, onOpenChange, template }: EmailTemplateFullScreenEditorProps) => {
  const [editedHtml, setEditedHtml] = useState(template.previewHtml);
  const [templateName, setTemplateName] = useState(template.name);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: folders } = useQuery({
    queryKey: ["email-template-folders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("email_template_folders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("email_template_folders")
        .insert({ user_id: user.id, name })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-template-folders", user?.id] });
      setSelectedFolderId(data.id);
      setNewFolderName("");
      setShowNewFolderInput(false);
      toast.success("Folder created");
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("saved_email_templates")
        .insert({
          user_id: user.id,
          folder_id: selectedFolderId || null,
          template_id: template.id,
          name: templateName,
          customized_html: editedHtml,
          customization_data: {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-email-templates", user?.id] });
      toast.success("Template saved successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    },
  });

  const handleSave = () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    saveTemplateMutation.mutate();
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }
    createFolderMutation.mutate(newFolderName);
  };

  const handleMergeTagInsert = (tag: string) => {
    setEditedHtml(prev => prev + ` ${tag}`);
  };

  const mergeTags = [
    { label: "First Name", value: "{{contact.FIRSTNAME}}" },
    { label: "Last Name", value: "{{contact.LASTNAME}}" },
    { label: "Email", value: "{{contact.EMAIL}}" },
    { label: "Company", value: "{{company.NAME}}" },
    { label: "Sender Name", value: "{{sender.NAME}}" },
    { label: "Sender Title", value: "{{sender.TITLE}}" },
    { label: "Today's Date", value: "{{date.TODAY}}" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] p-0">
        <div className="flex h-full">
          {/* Left Sidebar - Editor Controls */}
          <div className="w-80 border-r flex flex-col bg-muted/20">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Template Editor</h3>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Template Name */}
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>

              {/* Folder Selection */}
              <div className="space-y-2">
                <Label>Save to Folder</Label>
                {!showNewFolderInput ? (
                  <>
                    <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select folder (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {folders?.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            <div className="flex items-center gap-2">
                              <Folder className="h-4 w-4" style={{ color: folder.color }} />
                              {folder.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewFolderInput(true)}
                      className="w-full"
                    >
                      <FolderPlus className="mr-2 h-4 w-4" />
                      New Folder
                    </Button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Folder name"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewFolderInput(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCreateFolder}
                        disabled={createFolderMutation.isPending}
                        className="flex-1"
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Merge Tags */}
              <div className="space-y-2">
                <Label>Merge Tags</Label>
                <div className="grid grid-cols-2 gap-2">
                  {mergeTags.map((tag) => (
                    <Button
                      key={tag.value}
                      variant="outline"
                      size="sm"
                      onClick={() => handleMergeTagInsert(tag.value)}
                      className="text-xs"
                    >
                      {tag.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t space-y-2">
              <Button onClick={handleSave} disabled={saveTemplateMutation.isPending} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save Template
              </Button>
              <Button variant="outline" className="w-full">
                <Send className="mr-2 h-4 w-4" />
                Send Test Email
              </Button>
            </div>
          </div>

          {/* Main Content - Preview & Code */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'desktop' | 'mobile')}>
                <TabsList>
                  <TabsTrigger value="desktop">Desktop</TabsTrigger>
                  <TabsTrigger value="mobile">Mobile</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>

            <Tabs defaultValue="visual" className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-4">
                <TabsTrigger value="visual">Visual Preview</TabsTrigger>
                <TabsTrigger value="code">HTML Code</TabsTrigger>
              </TabsList>

              <TabsContent value="visual" className="flex-1 p-4 overflow-auto">
                <div className={`mx-auto bg-white shadow-lg ${previewMode === 'mobile' ? 'max-w-sm' : 'max-w-3xl'}`}>
                  <div 
                    dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(editedHtml) }}
                    className="email-preview"
                  />
                </div>
              </TabsContent>

              <TabsContent value="code" className="flex-1 p-4 overflow-auto">
                <textarea
                  value={editedHtml}
                  onChange={(e) => setEditedHtml(e.target.value)}
                  className="w-full h-full font-mono text-sm p-4 border rounded-lg resize-none"
                  spellCheck={false}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
