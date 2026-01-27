import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, CheckCircle2, Clock, AlertCircle, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface BlockchainCertificationTabProps {
  userId: string;
}

export const BlockchainCertificationTab = ({ userId }: BlockchainCertificationTabProps) => {
  const [selectedPodcast, setSelectedPodcast] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: podcasts } = useQuery({
    queryKey: ["podcasts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("user_id", userId);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: episodes } = useQuery({
    queryKey: ["podcast-episodes", selectedPodcast],
    queryFn: async () => {
      if (!selectedPodcast) return [];
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("podcast_id", selectedPodcast)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPodcast,
  });

  const { data: certificates } = useQuery({
    queryKey: ["blockchain-certificates", selectedPodcast],
    queryFn: async () => {
      if (!selectedPodcast) return [];
      const result = await (supabase as any)
        .from("episode_blockchain_certificates")
        .select("*, episodes(title)")
        .eq("podcast_id", selectedPodcast)
        .order("certified_at", { ascending: false });
      
      if (result.error) throw result.error;
      return (result.data || []) as any[];
    },
    enabled: !!selectedPodcast,
  });

  const certifyEpisodeMutation = useMutation({
    mutationFn: async (episodeId: string) => {
      const { data, error } = await supabase.functions.invoke('certify-episode-blockchain', {
        body: { episodeId, podcastId: selectedPodcast },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockchain-certificates", selectedPodcast] });
      toast.success("Episode certified on blockchain!");
    },
    onError: (error) => {
      console.error("Error certifying episode:", error);
      toast.error("Failed to certify episode");
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getCertifiedEpisodeIds = () => {
    return new Set(certificates?.map(cert => cert.episode_id) || []);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle2 className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Blockchain Certification:</strong> Certify your podcast episodes on the blockchain to create
          an immutable, timestamped record of your original content. Each certified episode receives a unique
          certificate hash and badge that proves authenticity and ownership.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Select Podcast</CardTitle>
          <CardDescription>Choose a podcast to manage blockchain certifications</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedPodcast} onValueChange={setSelectedPodcast}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a podcast" />
            </SelectTrigger>
            <SelectContent>
              {podcasts?.map((podcast) => (
                <SelectItem key={podcast.id} value={podcast.id}>
                  {podcast.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedPodcast && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Certify Episodes</CardTitle>
              <CardDescription>
                Create blockchain certificates for your published episodes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {episodes?.filter(ep => !getCertifiedEpisodeIds().has(ep.id)).map((episode) => (
                  <div key={episode.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{episode.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Published {format(new Date(episode.created_at), 'PPP')}
                      </p>
                    </div>
                    <Button
                      onClick={() => certifyEpisodeMutation.mutate(episode.id)}
                      disabled={certifyEpisodeMutation.isPending}
                      size="sm"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Certify
                    </Button>
                  </div>
                ))}
                
                {episodes && episodes.filter(ep => !getCertifiedEpisodeIds().has(ep.id)).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-600" />
                    <p>All episodes are certified!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {certificates && certificates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Certified Episodes</CardTitle>
                <CardDescription>
                  View blockchain certificates for your episodes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {certificates.map((cert) => (
                    <Card key={cert.id}>
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">{(cert.episodes as any)?.title}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusColor(cert.certificate_status)} className="gap-1">
                                {getStatusIcon(cert.certificate_status)}
                                {cert.certificate_status}
                              </Badge>
                              <Badge variant="outline">{cert.blockchain_network}</Badge>
                            </div>
                          </div>
                          {cert.certificate_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(cert.certificate_url!, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Certificate Hash:</span>
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {cert.certificate_hash.substring(0, 16)}...
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(cert.certificate_hash)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {cert.blockchain_transaction_id && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Transaction ID:</span>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {cert.blockchain_transaction_id.substring(0, 16)}...
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(cert.blockchain_transaction_id!)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-muted-foreground">Certified:</span>
                            <span>{format(new Date(cert.certified_at), 'PPpp')}</span>
                          </div>
                        </div>

                        {cert.certificate_status === 'verified' && (
                          <div className="pt-3 border-t">
                            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                              <Shield className="h-5 w-5 text-green-600" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                  Blockchain Certified
                                </p>
                                <p className="text-xs text-green-700 dark:text-green-300">
                                  This episode's authenticity is verified on {cert.blockchain_network}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
