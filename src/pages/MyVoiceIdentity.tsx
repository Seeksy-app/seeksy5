import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Mic, 
  CheckCircle2, 
  AlertCircle, 
  Activity,
  Download,
  ExternalLink,
  Sparkles,
  Globe,
  TrendingUp,
  DollarSign,
  Award,
  Trash2,
  RefreshCw,
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { VoiceNFTBadge } from "@/components/VoiceNFTBadge";
import { BlockchainExplainer } from "@/components/voice/BlockchainExplainer";
import { PlatformMonitoringBadge } from "@/components/voice/PlatformMonitoringBadge";
import { VoiceDetectionsList } from "@/components/voice/VoiceDetectionsList";
import { VoiceDetectionsFilters } from "@/components/voice/VoiceDetectionsFilters";
import { getVoiceDetectionsForUser } from "@/lib/api/voiceDetectionsAPI";
import type { VoiceDetection } from "@/lib/api/voiceDetectionsAPI";
import { hasVoiceFingerprint, hasActiveMonitoring } from "@/lib/voice/voiceMonitoringSetup";

import { IdentityLayout } from "@/components/identity/IdentityLayout";

export default function MyVoiceIdentity() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [voiceProfiles, setVoiceProfiles] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [voiceDetections, setVoiceDetections] = useState<VoiceDetection[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [listenAnalytics, setListenAnalytics] = useState<any[]>([]);
  const [hasFingerprint, setHasFingerprint] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(false);
  
  // Detection filters
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all");

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchVoiceDetections(user.id);
    }
  }, [user, platformFilter, statusFilter, dateRangeFilter]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Using (supabase as any) to avoid TypeScript deep type instantiation errors
      (supabase as any)
        .from("creator_voice_profiles")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }: any) => setVoiceProfiles(data || []));

      (supabase as any)
        .from("voice_blockchain_certificates")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }: any) => setCertificates(data || []));

      (supabase as any)
        .from("voice_licensing_proposals")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }: any) => setProposals(data || []));

      (supabase as any)
        .from("voice_listen_analytics")
        .select("*")
        .eq("creator_id", user.id)
        .order("listened_at", { ascending: false })
        .limit(100)
        .then(({ data }: any) => setListenAnalytics(data || []));

      // Check fingerprint and monitoring status
      const fingerprintExists = await hasVoiceFingerprint(user.id);
      setHasFingerprint(fingerprintExists);
      
      const monitoringEnabled = await hasActiveMonitoring(user.id);
      setMonitoringActive(monitoringEnabled);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load voice identity data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVoiceDetections = async (userId: string) => {
    try {
      const filters: any = {};
      
      if (platformFilter.length > 0) {
        filters.platform = platformFilter;
      }
      
      if (statusFilter.length > 0) {
        filters.status = statusFilter;
      }
      
      if (dateRangeFilter !== "all") {
        const days = parseInt(dateRangeFilter);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        filters.dateRange = {
          start: startDate,
          end: new Date(),
        };
      }
      
      const detections = await getVoiceDetectionsForUser(userId, filters);
      setVoiceDetections(detections);
    } catch (error) {
      console.error("Error fetching voice detections:", error);
    }
  };

  const isCertified = certificates.length > 0 && certificates[0].certification_status === 'verified';
  const hasAIClone = voiceProfiles.length > 0;
  const totalListens = listenAnalytics.length;
  const pendingProposals = proposals.filter((p) => p.status === "pending").length;
  const totalEarnings = proposals
    .filter((p) => p.status === "accepted")
    .reduce((sum, p) => sum + Number(p.proposed_price), 0);

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading your voice identity...</p>
        </div>
      </div>
    );
  }

  return (
    <IdentityLayout>
      {/* Identity & Rights Hub Banner */}
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">
                Complete Identity Management
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage face, voice, and licensing rights from Identity Hub
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/identity")} variant="default" size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Identity Hub
              </Button>
              <Button onClick={() => navigate("/identity/rights")} variant="outline" size="sm">
                <Lock className="h-4 w-4 mr-2" />
                Rights
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Certification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isCertified ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Not Certified
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mic className="h-4 w-4" />
              AI Clone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasAIClone ? (
                <Badge variant="default" className="bg-blue-500">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Not Created
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Listens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalListens}</div>
            <p className="text-xs text-muted-foreground">Voice profile plays</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{pendingProposals} pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="certification" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="certification">
            <Shield className="h-4 w-4 mr-2" />
            Certification
          </TabsTrigger>
          <TabsTrigger value="ai-clone">
            <Mic className="h-4 w-4 mr-2" />
            AI Clone
          </TabsTrigger>
          <TabsTrigger value="blockchain">
            <Award className="h-4 w-4 mr-2" />
            Blockchain
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* SECTION 1: Certified Voice */}
        <TabsContent value="certification" className="space-y-6">
          {isCertified ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Voice Certified
                </CardTitle>
                <CardDescription>
                  Your voice has been verified and secured on the blockchain
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {certificates[0]?.voice_fingerprint_hash && (
                  <div>
                    <p className="text-sm font-medium mb-2">Voice Fingerprint</p>
                    <code className="text-xs bg-muted p-2 rounded block break-all">
                      {certificates[0].voice_fingerprint_hash}
                    </code>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button onClick={() => navigate('/voice-certification/upload')} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reverify Voice
                  </Button>
                  <Button variant="destructive" disabled>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Identity
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Verify Your Voice Identity
                </CardTitle>
                <CardDescription>
                  Create a blockchain-verified voice credential to prove authenticity and protect your voice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/identity/voice/consent')} size="lg">
                  <Shield className="h-4 w-4 mr-2" />
                  Start Certification Process
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Monitoring Status */}
          {isCertified && monitoringActive && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Platform Monitoring
                </CardTitle>
                <CardDescription>
                  Cross-platform voice detection status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlatformMonitoringBadge 
                  platforms={['youtube', 'spotify', 'apple_podcasts', 'tiktok', 'instagram', 'twitter']}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SECTION 2: AI Cloned Voice */}
        <TabsContent value="ai-clone" className="space-y-6">
          {hasAIClone ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-blue-500" />
                  AI Voice Clone Active
                </CardTitle>
                <CardDescription>
                  Your ElevenLabs voice profile is ready to use
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {voiceProfiles[0]?.voice_name && (
                  <div>
                    <p className="text-sm font-medium mb-2">Voice Name</p>
                    <p className="text-lg">{voiceProfiles[0].voice_name}</p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button onClick={() => navigate('/voice-protection')} variant="outline">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Manage AI Clone
                  </Button>
                  <Button variant="outline" disabled>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate Voice
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-blue-500/30 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-blue-500" />
                  Create AI Voice Clone
                </CardTitle>
                <CardDescription>
                  {!isCertified ? (
                    "Your voice must be certified before creating an AI clone"
                  ) : (
                    "Generate a high-quality AI voice clone using ElevenLabs"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => {
                    if (!isCertified) {
                      toast({
                        title: "Certification Required",
                        description: "Your voice must be certified before creating an AI clone. Begin certification?",
                        action: (
                          <Button size="sm" onClick={() => navigate('/identity/voice/consent')}>
                            Start Certification
                          </Button>
                        ),
                      });
                    } else {
                      navigate('/voice-protection');
                    }
                  }}
                  size="lg"
                  disabled={!isCertified}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Create AI Voice Clone
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SECTION 3: Blockchain Proof */}
        <TabsContent value="blockchain" className="space-y-6">
          {certificates.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Blockchain Certificate
                  </CardTitle>
                  <CardDescription>
                    Immutable proof of voice ownership
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <VoiceNFTBadge 
                    tokenId={certificates[0].token_id || 'Pending'}
                    transactionHash={certificates[0].transaction_hash || ''}
                  />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Token ID</p>
                      <p className="font-mono">{certificates[0].token_id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Network</p>
                      <p>Polygon</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Transaction Hash</p>
                      <p className="font-mono text-xs break-all">
                        {certificates[0].transaction_hash || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Explorer
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <Download className="h-4 w-4 mr-2" />
                      Export Certificate
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <BlockchainExplainer />
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Blockchain Certificate</CardTitle>
                <CardDescription>
                  Complete voice certification to receive your blockchain certificate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/voice-certification-flow')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Start Certification
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SECTION 4: Activity & History */}
        <TabsContent value="activity" className="space-y-6">
          {/* Voice Detections */}
          {monitoringActive && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Social Media Monitoring
                </CardTitle>
                <CardDescription>
                  Real-time detection of your voice across platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <VoiceDetectionsFilters
                  platformFilter={platformFilter}
                  statusFilter={statusFilter}
                  dateRangeFilter={dateRangeFilter}
                  onPlatformChange={setPlatformFilter}
                  onStatusChange={setStatusFilter}
                  onDateRangeChange={setDateRangeFilter}
                  onClearFilters={() => {
                    setPlatformFilter([]);
                    setStatusFilter([]);
                    setDateRangeFilter("all");
                  }}
                />
                
                <VoiceDetectionsList 
                  detections={voiceDetections}
                  onUpdate={() => user && fetchVoiceDetections(user.id)}
                />
              </CardContent>
            </Card>
          )}

          {/* Licensing Proposals */}
          {proposals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Licensing Proposals
                </CardTitle>
                <CardDescription>
                  Manage voice licensing requests from advertisers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {proposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{proposal.advertiser_name || 'Advertiser'}</p>
                        <p className="text-sm text-muted-foreground">
                          ${proposal.proposed_price} • {proposal.usage_scope}
                        </p>
                      </div>
                      <Badge variant={
                        proposal.status === 'accepted' ? 'default' :
                        proposal.status === 'pending' ? 'secondary' :
                        'destructive'
                      }>
                        {proposal.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Timeline
              </CardTitle>
              <CardDescription>
                Recent actions and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {certificates.map((cert) => (
                  <div key={cert.id} className="flex gap-4 items-start">
                    <div className="rounded-full bg-green-500/10 p-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">Voice Certified</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(cert.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
                {voiceProfiles.map((profile) => (
                  <div key={profile.id} className="flex gap-4 items-start">
                    <div className="rounded-full bg-blue-500/10 p-2">
                      <Mic className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">AI Clone Created</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(profile.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </IdentityLayout>
  );
}