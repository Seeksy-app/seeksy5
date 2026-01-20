import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Send } from "lucide-react";
import { useState } from "react";
import { CreateDocumentDialog } from "./CreateDocumentDialog";
import { SendDocumentDialog } from "./SendDocumentDialog";

interface DocumentsTabProps {
  userId: string;
}

export const DocumentsTab = ({ userId }: DocumentsTabProps) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const { data: templates, refetch: refetchTemplates } = useQuery({
    queryKey: ["document-templates", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: documents, refetch: refetchDocuments } = useQuery({
    queryKey: ["signature-documents", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signature_documents")
        .select(`
          *,
          client:clients(contact_name, company_name)
        `)
        .eq("user_id", userId)
        .order("sent_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "default";
      case "signed": return "default";
      case "declined": return "destructive";
      default: return "outline";
    }
  };

  const handleSendDocument = (templateId: string) => {
    setSelectedTemplate(templateId);
    setSendOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Document Templates */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Document Templates</h2>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {templates?.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {template.template_name}
                  </CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => handleSendDocument(template.id)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.document_content.substring(0, 150)}...
                </p>
              </CardContent>
            </Card>
          ))}

          {templates?.length === 0 && (
            <Card className="md:col-span-2">
              <CardContent className="py-12 text-center text-muted-foreground">
                No templates yet. Create your first document template for e-signatures.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Sent Documents */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Sent Documents</h2>

        <div className="grid gap-4">
          {documents?.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{doc.document_title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Sent to: {doc.recipient_name} ({doc.recipient_email})
                    </p>
                  </div>
                  <Badge variant={getStatusColor(doc.status)}>{doc.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{doc.client?.company_name || doc.client?.contact_name || "No client"}</span>
                  <span>Sent: {new Date(doc.sent_at).toLocaleDateString()}</span>
                </div>
                {doc.status === "pending" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => {
                      const link = `${window.location.origin}/sign/${doc.access_token}`;
                      navigator.clipboard.writeText(link);
                    }}
                  >
                    Copy Signing Link
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {documents?.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No documents sent yet. Create a template and send it for signature.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CreateDocumentDialog 
        open={createOpen} 
        onOpenChange={setCreateOpen}
        onSuccess={refetchTemplates}
        userId={userId}
      />

      <SendDocumentDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        templateId={selectedTemplate}
        userId={userId}
        onSuccess={refetchDocuments}
      />
    </div>
  );
};
