import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ExternalLink, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContentCredential {
  id: string;
  status: string;
  tx_hash: string | null;
  token_id: string | null;
  content_hash: string;
  created_at: string;
}

export default function BlogCertify() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [blogPost, setBlogPost] = useState<any>(null);
  const [credential, setCredential] = useState<ContentCredential | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // Fetch blog post
      const { data: blog, error: blogError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (blogError) throw blogError;
      setBlogPost(blog);

      // Fetch existing credential
      const { data: cred } = await supabase
        .from('content_credentials')
        .select('*')
        .eq('blog_post_id', id)
        .single();

      if (cred) {
        setCredential(cred);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    setMinting(true);
    try {
      const { data, error } = await supabase.functions.invoke('mint-content-credential', {
        body: {
          content_type: 'blog_post',
          blog_post_id: id,
        }
      });

      if (error) throw error;

      toast({
        title: "Blog post certified!",
        description: "Your blog post has been certified on the Polygon blockchain.",
      });

      await fetchData();
    } catch (error) {
      console.error('Error minting credential:', error);
      toast({
        title: "Certification failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setMinting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Button variant="ghost" onClick={() => navigate('/blog')}>
        ← Back to Blog Library
      </Button>

      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Content Certification</CardTitle>
                <CardDescription>
                  Certify your blog post on the Polygon blockchain for authenticity and ownership proof
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {blogPost && (
              <div className="space-y-2">
                <h3 className="font-semibold">{blogPost.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {blogPost.excerpt || blogPost.content.substring(0, 200) + '...'}
                </p>
              </div>
            )}

            {!credential && (
              <div className="bg-muted p-6 rounded-lg space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">What is Content Certification?</h4>
                    <p className="text-sm text-muted-foreground">
                      Content certification creates an immutable, timestamped record of your blog post on the
                      Polygon blockchain. This provides cryptographic proof of authorship and creation date,
                      protecting your intellectual property and ensuring authenticity.
                    </p>
                  </div>
                </div>
                <Button onClick={handleMint} disabled={minting} className="w-full">
                  {minting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Minting Certificate...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Certify Blog Post on-Chain
                    </>
                  )}
                </Button>
              </div>
            )}

            {credential && (
              <div className="border-2 border-green-600 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold">Certified on Blockchain</h3>
                    <Badge variant="outline" className="mt-1">
                      {credential.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Content Hash:</span>
                    <p className="font-mono break-all">{credential.content_hash}</p>
                  </div>
                  
                  {credential.token_id && (
                    <div>
                      <span className="text-muted-foreground">Token ID:</span>
                      <p className="font-mono">{credential.token_id}</p>
                    </div>
                  )}

                  {credential.tx_hash && (
                    <div>
                      <span className="text-muted-foreground">Transaction:</span>
                      <div className="flex items-center gap-2">
                        <p className="font-mono break-all">{credential.tx_hash}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <a
                            href={`https://amoy.polygonscan.com/tx/${credential.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-muted-foreground">Certified:</span>
                    <p>{new Date(credential.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => navigate(`/c/${credential.id}`)}
                  className="w-full"
                >
                  View Public Certificate
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
