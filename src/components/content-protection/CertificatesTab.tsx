import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, FileCheck, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const CertificatesTab = () => {
  // Only fetch CERTIFIED content (has blockchain_tx_hash)
  const { data: certifiedContent, isLoading } = useQuery({
    queryKey: ["certified-content-certificates"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return [];
      const result = await (supabase as any)
        .from("protected_content")
        .select("*")
        .eq("user_id", user.id)
        .not("blockchain_tx_hash", "is", null)
        .order("created_at", { ascending: false });

      if (result.error) throw result.error;
      return (result.data as any[]) || [];
    },
  });

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success("Hash copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Proof Certificates</h2>
        <p className="text-sm text-muted-foreground">
          Verifiable proof certificates for your protected content
        </p>
      </div>

      {certifiedContent && certifiedContent.length > 0 ? (
        <div className="grid gap-4">
          {certifiedContent.map((content) => (
            <Card 
              key={content.id} 
              className="p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
              onClick={() => window.open(`https://polygonscan.com/tx/${content.blockchain_tx_hash}`, '_blank')}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <FileCheck className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{content.title}</h3>
                    <Badge className="bg-green-500/10 text-green-600">Certified</Badge>
                  </div>

                  {content.file_hash && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">Hash:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[200px]">
                        {content.file_hash}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyHash(content.file_hash);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Type: {content.content_type}</span>
                    <span>Certified: {new Date(content.updated_at || content.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No Issued Certificates Yet</h3>
          <p className="text-sm text-muted-foreground">
            Certify content in "My Proofs" tab to create blockchain certificates.
          </p>
        </Card>
      )}
    </div>
  );
};
