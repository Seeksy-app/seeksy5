import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
}

export const CreateDocumentDialog = ({ open, onOpenChange, onSuccess, userId }: CreateDocumentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    template_name: "",
    document_content: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.template_name || !formData.document_content) {
      toast.error("Template name and content are required");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("document_templates").insert({
        ...formData,
        user_id: userId,
        signature_fields: [],
      });

      if (error) throw error;

      toast.success("Template created successfully");
      onSuccess();
      onOpenChange(false);
      setFormData({
        template_name: "",
        document_content: "",
      });
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Document Template</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template_name">Template Name *</Label>
            <Input
              id="template_name"
              value={formData.template_name}
              onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
              placeholder="Service Agreement, NDA, Contract, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_content">Document Content *</Label>
            <Textarea
              id="document_content"
              value={formData.document_content}
              onChange={(e) => setFormData({ ...formData, document_content: e.target.value })}
              placeholder="Enter your document content here. You can use {{CLIENT_NAME}}, {{DATE}}, and other placeholders..."
              rows={15}
              required
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Tip: Use placeholders like &#123;&#123;CLIENT_NAME&#125;&#125;, &#123;&#123;DATE&#125;&#125;, &#123;&#123;AMOUNT&#125;&#125; that can be filled in when sending the document.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
