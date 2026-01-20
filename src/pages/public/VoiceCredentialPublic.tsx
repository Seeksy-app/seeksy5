import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Award, Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { exportCardAsImage } from "@/lib/utils/exportCardAsImage";

interface VoiceCredential {
  id: string;
  voice_profile_id: string;
  token_id: string;
  transaction_hash: string;
  metadata_uri: string;
  nft_metadata: any;
  voice_fingerprint_hash: string;
  created_at: string;
}

interface Profile {
  full_name: string;
  username: string;
  avatar_url?: string;
}

const VoiceCredentialPublic = () => {
  const { username } = useParams<{ username: string }>();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [credential, setCredential] = useState<VoiceCredential | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchCredential();
  }, [username]);

  const fetchCredential = async () => {
    try {
      setLoading(true);
      
      // Fetch profile by username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url, id')
        .eq('username', username)
        .single();

      if (profileError || !profileData) {
        setNotFound(true);
        return;
      }

      setProfile(profileData);

      // Fetch voice credential for this user
      const { data: credentialData, error: credentialError } = await supabase
        .from('voice_blockchain_certificates')
        .select('*')
        .eq('creator_id', profileData.id)
        .eq('certification_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (credentialError || !credentialData) {
        setNotFound(true);
        return;
      }

      setCredential(credentialData);
    } catch (error) {
      console.error('Error fetching credential:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current || !profile?.username) return;
    
    try {
      await exportCardAsImage(cardRef.current, profile.username);
      toast({
        title: "Certificate downloaded",
        description: "Your voice certification has been saved as an image.",
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
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading voice credential...</p>
        </div>
      </div>
    );
  }

  if (notFound || !credential || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="p-12 text-center max-w-lg">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-3">Voice Credential Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This user hasn't created a verified voice credential yet, or the credential link is invalid.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Visit Seeksy
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Verified Voice Credential</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Verified Voice Credential</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Proof of authentic voice identity, protected by Seeksy
          </p>
        </div>

        {/* Voice Credential Card */}
        <Card 
          ref={cardRef}
          className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 p-8 mb-8"
        >
          <div className="flex items-start gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center">
              <Shield className="h-10 w-10 text-white" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  Verified Voice Identity
                </span>
              </div>
            </div>
          </div>

          {/* Audio Waveform Visualization */}
          <div className="h-20 flex items-center justify-center gap-1 px-4 mb-6 bg-background/50 rounded-lg">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary/40 rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 60 + 20}%`,
                  animationDelay: `${i * 0.05}s`
                }}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Token ID</p>
              <p className="font-mono font-semibold text-sm">{credential.token_id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Blockchain Network</p>
              <p className="font-semibold text-sm">Polygon</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Verified On</p>
              <p className="font-semibold text-sm">
                {new Date(credential.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button size="lg" onClick={handleDownload}>
            <Download className="mr-2 h-5 w-5" />
            Download Certificate
          </Button>
          
          <Button size="lg" variant="outline" onClick={() => window.open('/', '_blank')}>
            <ExternalLink className="mr-2 h-5 w-5" />
            Create Your Own
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-2">
            This credential is verified and secured on the blockchain.
          </p>
          <a 
            href="/"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Shield className="h-4 w-4" />
            Verified by Seeksy
          </a>
        </div>
      </div>
    </div>
  );
};

export default VoiceCredentialPublic;
