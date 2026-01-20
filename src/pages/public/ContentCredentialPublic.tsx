import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Award, Download, ExternalLink, FileText, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { exportCardAsImage } from "@/lib/utils/exportCardAsImage";

interface ContentCredential {
  id: string;
  content_type: string;
  title: string;
  summary: string;
  content_hash: string;
  tx_hash: string;
  token_id: string;
  chain: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
    full_name: string;
  };
}

export default function ContentCredentialPublic() {
  const { id } = useParams();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [credential, setCredential] = useState<ContentCredential | null>(null);

  useEffect(() => {
    fetchCredential();
  }, [id]);

  const fetchCredential = async () => {
    try {
      const { data: credData, error } = await supabase
        .from('content_credentials')
        .select('*')
        .eq('id', id)
        .eq('status', 'minted')
        .single();

      if (error) throw error;

      // Fetch profile separately
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', credData.user_id)
        .single();

      setCredential({
        ...credData,
        profiles: profileData || undefined
      } as ContentCredential);
    } catch (error) {
      console.error('Error fetching credential:', error);
      toast({
        title: "Error loading certificate",
        description: "Certificate not found or not yet minted.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current || !credential?.profiles?.username) return;
    
    try {
      await exportCardAsImage(cardRef.current, credential.profiles.username);
      toast({
        title: "Certificate downloaded",
        description: "Your content certificate has been saved as an image.",
      });
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast({
        title: "Download failed",
        description: "Could not download the certificate. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!credential) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Certificate Not Found</h2>
          <p className="text-muted-foreground">
            This content certificate does not exist or has not been minted yet.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4">
      <div className="container max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Verified Content Certificate</h1>
          <p className="text-muted-foreground">
            Authenticated on the Polygon blockchain via Seeksy
          </p>
        </div>

        <Card ref={cardRef} className="p-8 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              {credential.content_type === 'transcript' ? (
                <FileText className="h-10 w-10 text-primary" />
              ) : (
                <BookOpen className="h-10 w-10 text-primary" />
              )}
              <div>
                <h2 className="text-2xl font-bold">{credential.title}</h2>
                <Badge variant="secondary" className="mt-1">
                  {credential.content_type === 'transcript' ? 'Transcript' : 'Blog Post'}
                </Badge>
              </div>
            </div>
            <Shield className="h-16 w-16 text-green-600" />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">Creator</h3>
              <p className="font-medium">
                {credential.profiles?.full_name || credential.profiles?.username || 'Anonymous'}
              </p>
            </div>

            {credential.summary && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Summary</h3>
                <p className="text-sm">{credential.summary}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">Content Hash</h3>
              <p className="text-xs font-mono break-all bg-muted p-2 rounded">
                {credential.content_hash}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Blockchain</h3>
                <Badge variant="outline">{credential.chain}</Badge>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Token ID</h3>
                <p className="text-sm font-mono">{credential.token_id}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">Certified On</h3>
              <p className="text-sm">{new Date(credential.created_at).toLocaleString()}</p>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t">
              <Award className="h-5 w-5 text-green-600" />
              <p className="text-sm text-muted-foreground">
                This page verifies that this content's cryptographic hash was recorded on the Polygon blockchain via Seeksy.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download Certificate
          </Button>
          <Button variant="outline" asChild>
            <a
              href={`https://amoy.polygonscan.com/tx/${credential.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Polygonscan
            </a>
          </Button>
        </div>

        <Card className="p-6 bg-muted">
          <h3 className="font-semibold mb-2">About Content Certification</h3>
          <p className="text-sm text-muted-foreground">
            This certificate provides immutable proof that this content existed at a specific point in time
            and belongs to the creator. The cryptographic hash stored on-chain ensures that any changes to
            the original content can be detected, providing permanent authenticity verification.
          </p>
        </Card>
      </div>
    </div>
  );
}
