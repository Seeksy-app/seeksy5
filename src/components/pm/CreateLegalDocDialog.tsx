import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateLegalDocDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  editingDoc?: any;
}

export const CreateLegalDocDialog = ({ 
  open, 
  onOpenChange, 
  userId,
  editingDoc 
}: CreateLegalDocDialogProps) => {
  const [documentType, setDocumentType] = useState<string>("privacy_policy");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (editingDoc) {
      setDocumentType(editingDoc.document_type);
      setTitle(editingDoc.title);
      setContent(editingDoc.content);
    } else {
      setDocumentType("privacy_policy");
      setTitle("");
      setContent("");
    }
  }, [editingDoc, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (editingDoc) {
        const { error } = await (supabase as any)
          .from("legal_documents")
          .update({
            document_type: documentType,
            title,
            content,
          })
          .eq("id", editingDoc.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("legal_documents")
          .insert({
            user_id: userId,
            document_type: documentType,
            title,
            content,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-documents"] });
      toast({
        title: "Success",
        description: `Legal document ${editingDoc ? 'updated' : 'created'} successfully`,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingDoc ? 'Edit' : 'Create'} Legal Document</DialogTitle>
          <DialogDescription>
            {editingDoc ? 'Update' : 'Create'} a legal document to include in your proposals and invoices
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="privacy_policy">Privacy Policy</SelectItem>
                <SelectItem value="terms_conditions">Terms & Conditions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Company Privacy Policy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Enter the full legal document text..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={() => mutation.mutate()}
            disabled={!title || !content || mutation.isPending}
            className="flex-1"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {editingDoc ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{editingDoc ? 'Update' : 'Create'} Document</>
            )}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};