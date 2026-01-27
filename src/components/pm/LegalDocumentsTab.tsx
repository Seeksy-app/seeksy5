import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { CreateLegalDocDialog } from "./CreateLegalDocDialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LegalDocumentsTabProps {
  userId: string;
}

export const LegalDocumentsTab = ({ userId }: LegalDocumentsTabProps) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [deleteDoc, setDeleteDoc] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: legalDocs } = useQuery({
    queryKey: ["legal-documents", userId],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("legal_documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (result.error) throw result.error;
      return (result.data || []) as any[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("legal_documents")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-documents"] });
      toast({
        title: "Success",
        description: "Legal document deleted successfully",
      });
      setDeleteDoc(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const privacyPolicies = legalDocs?.filter(doc => doc.document_type === 'privacy_policy') || [];
  const termsConditions = legalDocs?.filter(doc => doc.document_type === 'terms_conditions') || [];

  return (
    <div className="space-y-8">
      {/* Privacy Policies */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Privacy Policies</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Create privacy policies to include in proposals and invoices
            </p>
          </div>
          <Button onClick={() => {
            setEditingDoc(null);
            setCreateOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            New Privacy Policy
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {privacyPolicies.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {doc.title}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => {
                        setEditingDoc(doc);
                        setCreateOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => setDeleteDoc(doc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {doc.content.substring(0, 200)}...
                </p>
              </CardContent>
            </Card>
          ))}

          {privacyPolicies.length === 0 && (
            <Card className="md:col-span-2">
              <CardContent className="py-12 text-center text-muted-foreground">
                No privacy policies yet. Create one to add to your proposals and invoices.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Terms & Conditions</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Create terms and conditions to include in proposals and invoices
            </p>
          </div>
          <Button onClick={() => {
            setEditingDoc(null);
            setCreateOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            New Terms & Conditions
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {termsConditions.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {doc.title}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => {
                        setEditingDoc(doc);
                        setCreateOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => setDeleteDoc(doc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {doc.content.substring(0, 200)}...
                </p>
              </CardContent>
            </Card>
          ))}

          {termsConditions.length === 0 && (
            <Card className="md:col-span-2">
              <CardContent className="py-12 text-center text-muted-foreground">
                No terms & conditions yet. Create one to add to your proposals and invoices.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CreateLegalDocDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        userId={userId}
        editingDoc={editingDoc}
      />

      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Legal Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDoc && deleteMutation.mutate(deleteDoc)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};