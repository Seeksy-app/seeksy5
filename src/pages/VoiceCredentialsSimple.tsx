import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  LineChart, 
  MapPin, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock,
  Shield,
  Globe,
  Download,
  ExternalLink,
  AlertCircle,
  Share2,
  Code,
  QrCode,
  Award,
  Scan
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { BlockchainExplainer } from "@/components/voice/BlockchainExplainer";
import { PlatformMonitoringBadge } from "@/components/voice/PlatformMonitoringBadge";
import { VoiceNFTBadge } from "@/components/VoiceNFTBadge";
import { VoiceDetectionsList } from "@/components/voice/VoiceDetectionsList";
import { VoiceDetectionsFilters } from "@/components/voice/VoiceDetectionsFilters";
import { getVoiceDetectionsForUser, getRecentDetectionCount } from "@/lib/api/voiceDetectionsAPI";
import type { VoiceDetection } from "@/lib/api/voiceDetectionsAPI";
import { hasVoiceFingerprint, hasActiveMonitoring } from "@/lib/voice/voiceMonitoringSetup";
import { RegisterFaceDialog } from "@/components/face-registration/RegisterFaceDialog";

export default function VoiceCredentials() {
  const [loading, setLoading] = useState(true);
  const [voiceProfiles, setVoiceProfiles] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [listenAnalytics, setListenAnalytics] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [voiceDetections, setVoiceDetections] = useState<VoiceDetection[]>([]);
  const [badgeShares, setBadgeShares] = useState<any[]>([]);
  const [hasFingerprint, setHasFingerprint] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [showFaceRegisterDialog, setShowFaceRegisterDialog] = useState(false);
  
  // Detection filters
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch voice profiles
      (supabase as any)
        .from("creator_voice_profiles")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }: any) => setVoiceProfiles(data || []));

      // Fetch blockchain certificates
      (supabase as any)
        .from("voice_blockchain_certificates")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }: any) => setCertificates(data || []));

      // Fetch badge shares
      (supabase as any)
        .from("voice_badge_shares")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }: any) => setBadgeShares(data || []));

      // Fetch listen analytics
      (supabase as any)
        .from("voice_listen_analytics")
        .select("*")
        .eq("creator_id", user.id)
        .order("listened_at", { ascending: false })
        .limit(100)
        .then(({ data }: any) => setListenAnalytics(data || []));

      // Fetch proposals
      (supabase as any)
        .from("voice_licensing_proposals")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }: any) => setProposals(data || []));

      // Fetch voice detections using new API
      fetchVoiceDetections(user.id);
      
      // Check if user has voice fingerprint enabled
      const fingerprintExists = await hasVoiceFingerprint(user.id);
      setHasFingerprint(fingerprintExists);
      
      // Check if monitoring is active
      const monitoringEnabled = await hasActiveMonitoring(user.id);
      setMonitoringActive(monitoringEnabled);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchVoiceDetections = async (userId: string) => {
    try {
      // Build filters
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
      toast.error("Failed to load voice detections");
    }
  };

  const handleProposalResponse = async (proposalId: string, status: string) => {
    const { error } = await supabase
      .from("voice_licensing_proposals")
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq("id", proposalId);

    if (error) {
      toast.error("Failed to update proposal");
      return;
    }

    toast.success(status === "accepted" ? "Proposal accepted!" : "Proposal declined");
    fetchData();
  };

  const totalListens = listenAnalytics.length;
  const uniqueCountries = new Set(listenAnalytics.map((a) => a.country)).size;
  const pendingProposals = proposals.filter((p) => p.status === "pending").length;
  const totalEarnings = proposals
    .filter((p) => p.status === "accepted")
    .reduce((sum, p) => sum + Number(p.proposed_price), 0);

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          Voice Credentials
        </h1>
        <p className="text-muted-foreground">
          Monitor your voice usage, manage licensing proposals, and track authenticity across platforms
        </p>
      </div>

      {/* Start Certification CTA */}
      <Card className="mb-8 border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-xl mb-1 flex items-center gap-2">
                <Award className="h-6 w-6 text-primary" />
                Get Voice Certified
              </h3>
              <p className="text-sm text-muted-foreground">
                Create your blockchain-verified voice certificate with our 7-step certification flow
              </p>
            </div>
            <Button 
              size="lg" 
              className="whitespace-nowrap"
              onClick={() => window.location.href = '/voice-certification-flow'}
            >
              <Shield className="mr-2 h-5 w-5" />
              Start Certification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Listens</p>
              <p className="text-3xl font-bold">{totalListens}</p>
            </div>
            <LineChart className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Countries</p>
              <p className="text-3xl font-bold">{uniqueCountries}</p>
            </div>
            <MapPin className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Proposals</p>
              <p className="text-3xl font-bold">{pendingProposals}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-3xl font-bold">${totalEarnings.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Platform Monitoring Active */}
      <Card className="mb-6 border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Cross-Platform Monitoring Active
              </h3>
              <p className="text-sm text-muted-foreground">
                Scanning YouTube, Spotify, TikTok, Instagram, Twitter for your certified voice
              </p>
            </div>
            <PlatformMonitoringBadge platforms={['youtube', 'spotify', 'tiktok', 'instagram', 'twitter']} />
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="social">
        <TabsList className="mb-6 grid w-full grid-cols-4">
          <TabsTrigger value="social">
            <Globe className="h-4 w-4 mr-2" />
            Social Monitor
          </TabsTrigger>
          <TabsTrigger value="proposals">
            Licensing
            {pendingProposals > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                {pendingProposals}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="badges">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Listens</h3>
            <div className="space-y-3">
              {listenAnalytics.slice(0, 10).map((listen: any) => (
                <div key={listen.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{listen.city || "Unknown"}, {listen.country || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{listen.platform || "Web"}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(listen.listened_at), "MMM dd, h:mm a")}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposals">
          <div className="space-y-4">
            {proposals.map((proposal: any) => (
              <Card key={proposal.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{proposal.advertiser_company || proposal.advertiser_name}</h3>
                    <p className="text-sm text-muted-foreground">{proposal.advertiser_email}</p>
                  </div>
                  <Badge variant={proposal.status === "pending" ? "secondary" : "default"}>
                    {proposal.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Proposed Price</p>
                    <p className="text-2xl font-bold text-green-600">${proposal.proposed_price}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{format(new Date(proposal.created_at), "MMM dd, yyyy")}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-1">Usage Description</p>
                  <p className="text-sm text-muted-foreground">{proposal.usage_description}</p>
                </div>

                {proposal.status === "pending" && (
                  <div className="flex gap-2">
                    <Button onClick={() => handleProposalResponse(proposal.id, "accepted")} className="flex-1">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Accept
                    </Button>
                    <Button onClick={() => handleProposalResponse(proposal.id, "declined")} variant="destructive" className="flex-1">
                      <XCircle className="mr-2 h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                )}
              </Card>
            ))}
            {proposals.length === 0 && (
              <Card className="p-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Proposals Yet</h3>
                <p className="text-muted-foreground">Licensing proposals from advertisers will appear here</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Social Monitor Tab - Enhanced with Real Data */}
        <TabsContent value="social">
          <Card className="mb-6">
            <div className="p-6 bg-gradient-to-r from-primary/10 to-accent/10">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold">Cross-Platform Voice Monitoring</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                We're actively monitoring your certified voice across Seeksy, YouTube, Spotify, and more.
                New detections will appear here with links, timestamps, and usage context.
              </p>
            </div>
          </Card>

          {!hasFingerprint ? (
            <Card className="p-12 text-center border-2 border-dashed">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Voice Certified</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Complete Voice Certification to enable cross-platform voice monitoring. 
                We'll automatically track where your voice appears across YouTube, Spotify, TikTok, Instagram, and Twitter.
              </p>
              <Button onClick={() => window.location.href = "/voice-certification-flow"}>
                Start Voice Certification
              </Button>
            </Card>
          ) : voiceDetections.length > 0 ? (
            <>
              {/* Filters */}
              <Card className="mb-6 p-6">
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
              </Card>

              {/* Detections List */}
              <VoiceDetectionsList
                detections={voiceDetections}
                onUpdate={fetchData}
              />
            </>
          ) : (
            <Card className="p-12 text-center border-2 border-dashed">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mx-auto mb-4 flex items-center justify-center">
                <Globe className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Monitoring Active</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                We're scanning YouTube, Spotify, TikTok, Instagram, and Twitter for your certified voice. 
                Detections will appear here automatically.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <Badge variant="outline" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  YouTube
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Spotify
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    TikTok
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Instagram
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Twitter
                  </Badge>
                </div>
              </Card>
            )
          }
        </TabsContent>

        {/* Share Badges Tab */}
        <TabsContent value="badges">
          <div className="grid gap-6 mb-8">
            {/* Blockchain Explainer */}
            {certificates.length > 0 && (
              <BlockchainExplainer 
                tokenId={certificates[0]?.token_id}
                transactionHash={certificates[0]?.transaction_hash}
              />
            )}

            <div className="grid gap-6 md:grid-cols-3">
              {/* Embed Badge */}
              <Card>
                <div className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Code className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Embed on Website</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add verification badge to your site or blog
                  </p>
                  <Button className="w-full" variant="outline">
                    Get Code
                  </Button>
                </div>
              </Card>

              {/* Share Link */}
              <Card>
                <div className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                    <Share2 className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Share Link</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Direct link to blockchain certificate
                  </p>
                  <Button className="w-full" variant="outline">
                    Copy Link
                  </Button>
                </div>
              </Card>

              {/* QR Code */}
              <Card>
                <div className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-brand-gold/10 flex items-center justify-center mb-4">
                    <QrCode className="h-6 w-6 text-brand-gold" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">QR Code</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download for offline verification
                  </p>
                  <Button className="w-full" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </Card>
            </div>

            {/* Badge Share Stats */}
            {badgeShares.length > 0 && (
              <Card>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-4">Badge Share Activity</h3>
                  <div className="space-y-3">
                    {badgeShares.map((share: any) => (
                      <div key={share.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                            {share.share_type === 'embed' && <Code className="h-5 w-5" />}
                            {share.share_type === 'link' && <Share2 className="h-5 w-5" />}
                            {share.share_type === 'qr_code' && <QrCode className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{share.share_type.replace('_', ' ')}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(share.created_at), "MMM dd, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{share.view_count} views</p>
                          <p className="text-xs text-muted-foreground">{share.verification_count} verified</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
