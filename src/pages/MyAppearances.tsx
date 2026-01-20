import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  RefreshCw, 
  Youtube, 
  Music2, 
  ExternalLink, 
  Clock, 
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  Trash2,
  Mic2,
  Shield,
  AlertCircle,
  Fingerprint,
  Instagram,
  List,
  Share2,
  Video,
  ScanFace,
  Link2,
  Settings
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


interface GuestAppearance {
  id: string;
  platform: string;
  external_id: string;
  title: string;
  show_name: string | null;
  description: string | null;
  thumbnail_url: string | null;
  external_url: string | null;
  published_at: string | null;
  duration_seconds: number | null;
  detection_method: string | null;
  is_verified: boolean;
  is_hidden: boolean;
  created_at: string;
}

export default function MyAppearances() {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchName, setSearchName] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["youtube", "spotify"]);
  const [activeTab, setActiveTab] = useState("all");
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("My Guest Appearances");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detectionFilter, setDetectionFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [scanMethod, setScanMethod] = useState<string>("name");
  const [disclaimerAcknowledged, setDisclaimerAcknowledged] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  // Check voice and face certification status
  const [voiceStatus, setVoiceStatus] = useState<{
    isCertified: boolean;
    hasFingerprint: boolean;
    certificate: any;
  } | null>(null);

  const [faceStatus, setFaceStatus] = useState<{
    isCertified: boolean;
    faceIdentity: any;
  } | null>(null);

  // Check Spotify/YouTube connection status
  const { data: socialConnections } = useQuery({
    queryKey: ["social-connections-appearances", user?.id],
    queryFn: async () => {
      if (!user) return { spotify: false, youtube: false };
      const { data } = await supabase
        .from("social_media_profiles")
        .select("platform")
        .eq("user_id", user.id);
      
      const platforms = data?.map(d => d.platform) || [];
      return {
        spotify: platforms.includes("spotify"),
        youtube: platforms.includes("youtube"),
      };
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    
    const checkCertificationStatus = async () => {
      try {
        // Check for active blockchain certificate with verified status
        const certResult = await supabase
          .from("voice_blockchain_certificates")
          .select("id, certification_status, is_active, voice_fingerprint_hash")
          .eq("creator_id", user.id)
          .eq("is_active", true)
          .eq("certification_status", "verified")
          .limit(1);

        // Check for voice identity record
        const identityResult = await supabase
          .from("voice_identity")
          .select("id, fingerprint, certification_status")
          .eq("creator_id", user.id)
          .limit(1);

        const hasCert = certResult.data && certResult.data.length > 0;
        const hasIdentity = identityResult.data && identityResult.data.length > 0;

        setVoiceStatus({
          isCertified: !!hasCert,
          hasFingerprint: !!(hasCert || (hasIdentity && identityResult.data[0].fingerprint)),
          certificate: certResult.data?.[0] || null
        });

        // Check for face identity - check both face_identity and identity_assets tables
        let faceVerified = false;
        let faceData = null;

        // Check face_identity table first
        const faceResult = await supabase
          .from("face_identity")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (faceResult.data?.verification_status === "verified") {
          faceVerified = true;
          faceData = faceResult.data;
        }

        // Also check identity_assets table for face_identity type
        if (!faceVerified) {
          const assetResult = await supabase
            .from("identity_assets")
            .select("*")
            .eq("user_id", user.id)
            .eq("type", "face_identity")
            .eq("cert_status", "minted")
            .maybeSingle();

          if (assetResult.data) {
            faceVerified = true;
            faceData = assetResult.data;
          }
        }

        setFaceStatus({
          isCertified: faceVerified,
          faceIdentity: faceData
        });
      } catch (error) {
        console.error("Error checking certification status:", error);
        setVoiceStatus({ isCertified: false, hasFingerprint: false, certificate: null });
        setFaceStatus({ isCertified: false, faceIdentity: null });
      }
    };

    checkCertificationStatus();
  }, [user]);

  // Fetch appearances - only for this user
  const { data: appearances, isLoading } = useQuery({
    queryKey: ["guest-appearances", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_appearance_scans")
        .select("*")
        .eq("user_id", user!.id)
        .order("published_at", { ascending: false });
      
      if (error) throw error;
      return data as GuestAppearance[];
    },
    enabled: !!user,
  });

  // Scan mutation
  const scanMutation = useMutation({
    mutationFn: async () => {
      if (!searchName.trim()) {
        throw new Error("Please enter your name to search");
      }

      const { data, error } = await supabase.functions.invoke("scan-guest-appearances", {
        body: { 
          searchName: searchName.trim(),
          platforms: selectedPlatforms 
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Found ${data.count} potential appearances!`);
      queryClient.invalidateQueries({ queryKey: ["guest-appearances"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Scan failed");
    },
  });

  // Toggle verified status
  const toggleVerified = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("guest_appearance_scans")
      .update({ is_verified: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update");
    } else {
      queryClient.invalidateQueries({ queryKey: ["guest-appearances"] });
      toast.success(currentStatus ? "Unmarked as verified" : "Marked as verified");
    }
  };

  // Toggle hidden status
  const toggleHidden = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("guest_appearance_scans")
      .update({ is_hidden: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update");
    } else {
      queryClient.invalidateQueries({ queryKey: ["guest-appearances"] });
    }
  };

  // Delete appearance
  const deleteAppearance = async (id: string) => {
    const { error } = await supabase
      .from("guest_appearance_scans")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete");
    } else {
      queryClient.invalidateQueries({ queryKey: ["guest-appearances"] });
      toast.success("Removed from list");
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "youtube": return <Youtube className="h-4 w-4 text-red-500" />;
      case "spotify": return <Music2 className="h-4 w-4 text-green-500" />;
      default: return <Mic2 className="h-4 w-4" />;
    }
  };

  const filteredAppearances = appearances?.filter(a => {
    // Tab filter
    if (activeTab === "verified" && (!a.is_verified || a.is_hidden)) return false;
    if (activeTab === "hidden" && !a.is_hidden) return false;
    if (activeTab === "all" && a.is_hidden) return false;
    
    // Detection method filter
    if (detectionFilter !== "all") {
      const method = a.detection_method?.toLowerCase() || "";
      if (detectionFilter === "name" && !method.includes("name")) return false;
      if (detectionFilter === "face" && !method.includes("face")) return false;
      if (detectionFilter === "voice" && !method.includes("voice")) return false;
    }
    
    // Channel/platform filter
    if (channelFilter !== "all") {
      if (a.platform !== channelFilter) return false;
    }
    
    return true;
  });

  const stats = {
    total: appearances?.filter(a => !a.is_hidden).length || 0,
    verified: appearances?.filter(a => a.is_verified && !a.is_hidden).length || 0,
    youtube: appearances?.filter(a => a.platform === "youtube" && !a.is_hidden).length || 0,
    spotify: appearances?.filter(a => a.platform === "spotify" && !a.is_hidden).length || 0,
  };

  const verifiedAppearances = appearances?.filter(a => a.is_verified && !a.is_hidden) || [];

  // Bulk actions
  const toggleSelectAll = () => {
    if (!filteredAppearances) return;
    if (selectedIds.size === filteredAppearances.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAppearances.map(a => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const bulkVerify = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await supabase
        .from("guest_appearance_scans")
        .update({ is_verified: true })
        .eq("id", id);
    }
    queryClient.invalidateQueries({ queryKey: ["guest-appearances"] });
    setSelectedIds(new Set());
    toast.success(`Verified ${ids.length} appearances`);
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await supabase
        .from("guest_appearance_scans")
        .delete()
        .eq("id", id);
    }
    queryClient.invalidateQueries({ queryKey: ["guest-appearances"] });
    setSelectedIds(new Set());
    toast.success(`Deleted ${ids.length} appearances`);
  };

  const bulkHide = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await supabase
        .from("guest_appearance_scans")
        .update({ is_hidden: true })
        .eq("id", id);
    }
    queryClient.invalidateQueries({ queryKey: ["guest-appearances"] });
    setSelectedIds(new Set());
    toast.success(`Hidden ${ids.length} appearances`);
  };

  const handleBuildPlaylist = async () => {
    if (verifiedAppearances.length === 0) {
      toast.error("No verified appearances to create playlist from");
      return;
    }

    // For now, we'll create a shareable page URL
    const playlistData = {
      name: playlistName,
      description: playlistDescription,
      appearances: verifiedAppearances.map(a => ({
        id: a.id,
        title: a.title,
        show_name: a.show_name,
        platform: a.platform,
        external_url: a.external_url,
        thumbnail_url: a.thumbnail_url,
        published_at: a.published_at
      }))
    };

    // Store in localStorage for now, can be expanded to database
    localStorage.setItem("guest_appearances_playlist", JSON.stringify(playlistData));
    
    toast.success("Playlist landing page created!");
    setPlaylistDialogOpen(false);
    navigate("/my-appearances/playlist");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Guest Appearance Scanner</h1>
          <p className="text-muted-foreground">
            Track your podcast and video guest appearances across platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={playlistDialogOpen} onOpenChange={setPlaylistDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={verifiedAppearances.length === 0}>
                <List className="h-4 w-4 mr-2" />
                Build Playlist Page
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Playlist Landing Page</DialogTitle>
                <DialogDescription>
                  Create a shareable landing page showcasing your verified podcast appearances
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Playlist Name</Label>
                  <Input
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    placeholder="My Guest Appearances"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={playlistDescription}
                    onChange={(e) => setPlaylistDescription(e.target.value)}
                    placeholder="A collection of podcasts and videos I've appeared on..."
                    rows={3}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {verifiedAppearances.length} verified appearance{verifiedAppearances.length !== 1 ? "s" : ""} will be included
                </div>
                <Button onClick={handleBuildPlaylist} className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Create Landing Page
                </Button>
              </div>
          </DialogContent>
        </Dialog>

        {/* Disclaimer Modal */}
        <Dialog open={showDisclaimerModal} onOpenChange={setShowDisclaimerModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Important Notice
              </DialogTitle>
              <DialogDescription>
                Please read and acknowledge before scanning
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-800">
                  This tool is designed to help you discover and track your own appearances across platforms. 
                  It should only be used for legitimate purposes such as protecting your likeness, building your portfolio, 
                  and managing your public presence.
                </AlertDescription>
              </Alert>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>By using this scanner, you agree that:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You are searching for your own appearances only</li>
                  <li>Results are a guide to support your likeness protection</li>
                  <li>Seeksy cannot guarantee the accuracy of search results</li>
                  <li>You will not use this tool with harmful intent</li>
                </ul>
              </div>
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border bg-muted/50">
                <Checkbox
                  checked={disclaimerAcknowledged}
                  onCheckedChange={(checked) => setDisclaimerAcknowledged(checked === true)}
                  className="mt-0.5"
                />
                <span className="text-sm">
                  I understand and agree to use this tool responsibly for my own likeness protection only.
                </span>
              </label>
              <Button 
                onClick={() => {
                  if (disclaimerAcknowledged) {
                    setShowDisclaimerModal(false);
                    scanMutation.mutate();
                  }
                }}
                disabled={!disclaimerAcknowledged}
                className="w-full"
              >
                <Search className="h-4 w-4 mr-2" />
                Continue to Scan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {/* Verification Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Voice Status */}
        {voiceStatus?.isCertified ? (
          <Alert className="border-green-500/50 bg-green-500/10">
            <Shield className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700">Voice Certified</AlertTitle>
            <AlertDescription className="text-green-600">
              Your voice is blockchain-certified for fingerprint verification.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-700">Voice Not Certified</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span className="text-amber-600">Certify to enable voice verification.</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/voice-certification")}
                className="ml-4 border-amber-500 text-amber-700 hover:bg-amber-500/20"
              >
                <Fingerprint className="h-4 w-4 mr-2" />
                Certify
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Face Status */}
        {faceStatus?.isCertified ? (
          <Alert className="border-green-500/50 bg-green-500/10">
            <ScanFace className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700">Face Verified</AlertTitle>
            <AlertDescription className="text-green-600">
              Your face is verified for appearance detection.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-700">Face Not Verified</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span className="text-amber-600">Verify to enable face detection.</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/identity")}
                className="ml-4 border-amber-500 text-amber-700 hover:bg-amber-500/20"
              >
                <ScanFace className="h-4 w-4 mr-2" />
                Verify
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Connected Channels */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Connected Channels</CardTitle>
                <CardDescription>
                  Your connected platforms for auto-scanning appearances
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/integrations")}>
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {socialConnections?.youtube ? (
              <Badge variant="outline" className="gap-2 py-1.5 px-3 border-green-500/50 bg-green-500/10 text-green-700">
                <Youtube className="h-4 w-4 text-red-500" />
                YouTube Connected
              </Badge>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/integrations?connect=youtube")}>
                <Youtube className="h-4 w-4 mr-2 text-red-500" />
                Connect YouTube
              </Button>
            )}
            {socialConnections?.spotify ? (
              <Badge variant="outline" className="gap-2 py-1.5 px-3 border-green-500/50 bg-green-500/10 text-green-700">
                <Music2 className="h-4 w-4 text-green-500" />
                Spotify Connected
              </Badge>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/integrations?connect=spotify")}>
                <Music2 className="h-4 w-4 mr-2 text-green-500" />
                Connect Spotify
              </Button>
            )}
            <Badge variant="outline" className="gap-2 py-1.5 px-3 opacity-50">
              <Instagram className="h-4 w-4 text-pink-500" />
              Instagram (Soon)
            </Badge>
            <Badge variant="outline" className="gap-2 py-1.5 px-3 opacity-50">
              <Video className="h-4 w-4" />
              TikTok (Soon)
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Unified Search Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Scan for Your Appearances
          </CardTitle>
          <CardDescription>
            Find your podcast, video, and social media appearances across platforms.
            {voiceStatus?.isCertified && (
              <span className="ml-2 text-green-600">✓ Voice certified</span>
            )}
            {faceStatus?.isCertified && (
              <span className="ml-2 text-green-600">✓ Face verified</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scan Method Tabs */}
          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
            <Button
              variant={scanMethod === "name" ? "default" : "ghost"}
              size="sm"
              onClick={() => setScanMethod("name")}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              Name Search
            </Button>
            <Button
              variant={scanMethod === "face" ? "default" : "ghost"}
              size="sm"
              onClick={() => setScanMethod("face")}
              disabled={!faceStatus?.isCertified}
              className="gap-2"
            >
              <ScanFace className="h-4 w-4" />
              Face Detection
              {!faceStatus?.isCertified && <Badge variant="outline" className="text-xs ml-1">Requires Verification</Badge>}
            </Button>
            <Button
              variant={scanMethod === "voice" ? "default" : "ghost"}
              size="sm"
              onClick={() => setScanMethod("voice")}
              disabled={!voiceStatus?.isCertified}
              className="gap-2"
            >
              <Mic2 className="h-4 w-4" />
              Voice Match
              {!voiceStatus?.isCertified && <Badge variant="outline" className="text-xs ml-1">Requires Certification</Badge>}
            </Button>
          </div>

          {/* Dynamic Input Based on Method */}
          {scanMethod === "name" && (
            <>
              <Alert className="border-muted bg-muted/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Searches by name in episode titles/descriptions. Only search for YOUR name to find YOUR appearances.
                </AlertDescription>
              </Alert>
              <div className="flex gap-3 items-center">
                <Input
                  placeholder="Enter YOUR name (e.g., John Smith)"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => {
                    if (!disclaimerAcknowledged) {
                      setShowDisclaimerModal(true);
                    } else {
                      scanMutation.mutate();
                    }
                  }}
                  disabled={scanMutation.isPending || !searchName.trim()}
                >
                  {scanMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Scan
                    </>
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-medium">Platforms:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedPlatforms.includes("youtube")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPlatforms([...selectedPlatforms, "youtube"]);
                      } else {
                        setSelectedPlatforms(selectedPlatforms.filter(p => p !== "youtube"));
                      }
                    }}
                  />
                  <Youtube className="h-4 w-4 text-red-500" />
                  <span className="text-sm">YouTube</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedPlatforms.includes("spotify")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPlatforms([...selectedPlatforms, "spotify"]);
                      } else {
                        setSelectedPlatforms(selectedPlatforms.filter(p => p !== "spotify"));
                      }
                    }}
                  />
                  <Music2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Spotify</span>
                </label>
              </div>
            </>
          )}

          {scanMethod === "face" && (
            <>
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <ScanFace className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-700">
                  AI face detection scans video thumbnails and frames to find your appearances.
                </AlertDescription>
              </Alert>
              <div className="flex gap-3 items-center">
                <Input
                  placeholder="Paste YouTube video URL (e.g., youtube.com/watch?v=...)"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={async () => {
                    if (!disclaimerAcknowledged) {
                      setShowDisclaimerModal(true);
                      return;
                    }
                    if (!searchName.trim()) {
                      toast.error("Please enter a YouTube video URL");
                      return;
                    }
                    const isVideoUrl = searchName.includes('watch?v=') || searchName.includes('youtu.be/');
                    if (!isVideoUrl) {
                      toast.error("Please enter a YouTube video URL (not a channel)");
                      return;
                    }
                    try {
                      const { data, error } = await supabase.functions.invoke("scan-face-youtube", {
                        body: { videoUrl: searchName.trim() },
                      });
                      if (error) throw error;
                      if (data?.matchFound) {
                        toast.success(`Face match found in "${data.videoTitle}"!`);
                        queryClient.invalidateQueries({ queryKey: ["guest-appearances"] });
                      } else {
                        toast.info("No face match found in this video");
                      }
                    } catch (error) {
                      toast.error("Failed to scan video");
                    }
                  }}
                  disabled={!searchName.trim()}
                >
                  <ScanFace className="h-4 w-4 mr-2" />
                  Scan Video
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium">Scan by platform:</span>
                <Badge variant="outline" className="gap-2 py-1.5 px-3">
                  <Youtube className="h-4 w-4 text-red-500" />
                  YouTube Video
                </Badge>
                <Badge variant="outline" className="gap-2 py-1.5 px-3 opacity-50">
                  <Instagram className="h-4 w-4 text-pink-500" />
                  Instagram (Soon)
                </Badge>
                <Badge variant="outline" className="gap-2 py-1.5 px-3 opacity-50">
                  <Video className="h-4 w-4" />
                  TikTok (Soon)
                </Badge>
              </div>
            </>
          )}

          {scanMethod === "voice" && (
            <>
              <Alert className="border-purple-500/50 bg-purple-500/10">
                <Mic2 className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-sm text-purple-700">
                  Voice fingerprint matching compares audio to your certified voice signature. Coming soon!
                </AlertDescription>
              </Alert>
              <div className="flex gap-3 items-center">
                <Input
                  placeholder="Paste podcast episode URL..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="flex-1"
                  disabled
                />
                <Button disabled>
                  <Mic2 className="h-4 w-4 mr-2" />
                  Scan Audio
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Voice matching is in development. Your voice is certified and ready for when this feature launches.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Appearances</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
            <p className="text-sm text-muted-foreground">Verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-500">{stats.youtube}</div>
            <p className="text-sm text-muted-foreground">YouTube</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{stats.spotify}</div>
            <p className="text-sm text-muted-foreground">Spotify</p>
          </CardContent>
        </Card>
      </div>

      {/* Appearances List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="verified">Verified ({stats.verified})</TabsTrigger>
            <TabsTrigger value="hidden">Hidden</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Channel:</span>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="youtube">
                    <div className="flex items-center gap-2">
                      <Youtube className="h-3 w-3 text-red-500" />
                      YouTube
                    </div>
                  </SelectItem>
                  <SelectItem value="spotify">
                    <div className="flex items-center gap-2">
                      <Music2 className="h-3 w-3 text-green-500" />
                      Spotify
                    </div>
                  </SelectItem>
                  <SelectItem value="instagram">
                    <div className="flex items-center gap-2">
                      <Instagram className="h-3 w-3 text-pink-500" />
                      Instagram
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Detection:</span>
              <Select value={detectionFilter} onValueChange={setDetectionFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="name">
                    <div className="flex items-center gap-2">
                      <Search className="h-3 w-3" />
                      Name Search
                    </div>
                  </SelectItem>
                  <SelectItem value="face">
                    <div className="flex items-center gap-2">
                      <ScanFace className="h-3 w-3" />
                      Face Verified
                    </div>
                  </SelectItem>
                  <SelectItem value="voice">
                    <div className="flex items-center gap-2">
                      <Mic2 className="h-3 w-3" />
                      Voice Verified
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          {/* Bulk Actions Bar */}
          {filteredAppearances && filteredAppearances.length > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedIds.size === filteredAppearances.length && filteredAppearances.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm">Select All</span>
              </label>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
                  <Button size="sm" variant="outline" onClick={bulkVerify}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Verify
                  </Button>
                  <Button size="sm" variant="outline" onClick={bulkHide}>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Hide
                  </Button>
                  <Button size="sm" variant="destructive" onClick={bulkDelete}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredAppearances?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {activeTab === "all" ? (
                  <>
                    <Mic2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No appearances found yet.</p>
                    <p className="text-sm">Enter your name above and scan to find your guest appearances.</p>
                  </>
                ) : (
                  <p>No {activeTab} appearances.</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAppearances?.map((appearance) => (
                <Card key={appearance.id} className={appearance.is_verified ? "border-green-500/50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Checkbox */}
                      <Checkbox
                        checked={selectedIds.has(appearance.id)}
                        onCheckedChange={() => toggleSelect(appearance.id)}
                        className="mt-1"
                      />
                      
                      {/* Thumbnail */}
                      {appearance.thumbnail_url && (
                        <img
                          src={appearance.thumbnail_url}
                          alt={appearance.title}
                          className="w-32 h-20 object-cover rounded-md flex-shrink-0"
                        />
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getPlatformIcon(appearance.platform)}
                              {appearance.is_verified && (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold line-clamp-1">{appearance.title}</h3>
                            {appearance.show_name && (
                              <p className="text-sm text-muted-foreground">{appearance.show_name}</p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleVerified(appearance.id, appearance.is_verified)}
                              title={appearance.is_verified ? "Unverify" : "Mark as verified"}
                            >
                              <CheckCircle2 className={`h-4 w-4 ${appearance.is_verified ? "text-green-600" : ""}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleHidden(appearance.id, appearance.is_hidden)}
                              title={appearance.is_hidden ? "Show" : "Hide"}
                            >
                              {appearance.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteAppearance(appearance.id)}
                              title="Remove"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            {appearance.external_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <a href={appearance.external_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {appearance.published_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(appearance.published_at), "MMM d, yyyy")}
                            </span>
                          )}
                          {appearance.duration_seconds && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(appearance.duration_seconds)}
                            </span>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {appearance.detection_method}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
