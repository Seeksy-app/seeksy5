import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Copy, 
  Check, 
  Link2, 
  Video, 
  Key, 
  RefreshCw,
  Mail,
  Calendar,
  FileText,
  Shield,
  X,
  ChevronUp,
  Save,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface SalesOpportunity {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  access_code: string | null;
  status: string;
  expires_at?: string | null;
  require_nda_board?: boolean;
  require_nda_recipient?: boolean;
  nda_text?: string | null;
}

interface OpportunityInlineEditorProps {
  opportunity: SalesOpportunity;
  onClose: () => void;
}

type DemoVideo = { id: string; title: string; thumbnail_url: string | null; duration_seconds: number | null; category: string | null };

export function OpportunityInlineEditor({ opportunity, onClose }: OpportunityInlineEditorProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [investorEmail, setInvestorEmail] = useState("");
  const [investorName, setInvestorName] = useState("");
  const [expiresAt, setExpiresAt] = useState(opportunity.expires_at?.split("T")[0] || "");
  const [requireNdaBoard, setRequireNdaBoard] = useState(opportunity.require_nda_board ?? true);
  const [requireNdaRecipient, setRequireNdaRecipient] = useState(opportunity.require_nda_recipient ?? true);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [selectedProformaIds, setSelectedProformaIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const shareUrl = `${window.location.origin}/invest/${opportunity.slug}`;

  // Fetch all demo videos
  const { data: allVideos } = useQuery<DemoVideo[]>({
    queryKey: ["all-demo-videos"],
    queryFn: async () => {
      const result = await (supabase.from("demo_videos") as any)
        .select("id, title, thumbnail_url, duration_seconds, category")
        .eq("is_active", true)
        .order("title");
      return (result.data || []) as DemoVideo[];
    },
  });

  // Fetch attached videos
  const { data: attachedVideos } = useQuery({
    queryKey: ["opportunity-videos", opportunity.id],
    queryFn: async () => {
      const result = await (supabase.from("sales_opportunity_videos") as any)
        .select("video_id")
        .eq("opportunity_id", opportunity.id);
      return (result.data || []).map((v: any) => v.video_id) as string[];
    },
  });

  // Fetch all pro formas for this opportunity
  const { data: allProformas } = useQuery({
    queryKey: ["opportunity-proformas-all", opportunity.id],
    queryFn: async () => {
      const result = await (supabase.from("opportunity_proformas") as any)
        .select("*")
        .eq("opportunity_id", opportunity.id)
        .eq("status", "active")
        .order("name");
      return result.data || [];
    },
  });

  // Fetch attached pro formas
  const { data: attachedProformas } = useQuery({
    queryKey: ["opportunity-proformas-attached", opportunity.id],
    queryFn: async () => {
      const result = await (supabase.from("sales_opportunity_proformas") as any)
        .select("proforma_id")
        .eq("opportunity_id", opportunity.id);
      return (result.data || []).map((p: any) => p.proforma_id) as string[];
    },
  });

  // Sync selected videos when data loads
  useEffect(() => {
    if (attachedVideos) setSelectedVideoIds(attachedVideos);
  }, [attachedVideos]);
  
  useEffect(() => {
    if (attachedProformas) setSelectedProformaIds(attachedProformas);
  }, [attachedProformas]);

  const generateAccessCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const updateOpportunityMutation = useMutation({
    mutationFn: async (updates: Partial<SalesOpportunity>) => {
      const { error } = await (supabase.from("sales_opportunities") as any)
        .update(updates)
        .eq("id", opportunity.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Settings updated");
      queryClient.invalidateQueries({ queryKey: ["board-sales-opportunities"] });
    },
    onError: () => {
      toast.error("Failed to update settings");
    },
  });

  const saveVideosMutation = useMutation({
    mutationFn: async (videoIds: string[]) => {
      await (supabase.from("sales_opportunity_videos") as any)
        .delete()
        .eq("opportunity_id", opportunity.id);
      if (videoIds.length > 0) {
        await (supabase.from("sales_opportunity_videos") as any)
          .insert(videoIds.map((videoId, index) => ({
            opportunity_id: opportunity.id,
            video_id: videoId,
            display_order: index
          })));
      }
    },
    onSuccess: () => {
      toast.success("Videos updated");
      queryClient.invalidateQueries({ queryKey: ["opportunity-videos", opportunity.id] });
    },
  });

  const saveProformasMutation = useMutation({
    mutationFn: async (proformaIds: string[]) => {
      await (supabase.from("sales_opportunity_proformas") as any)
        .delete()
        .eq("opportunity_id", opportunity.id);
      if (proformaIds.length > 0) {
        await (supabase.from("sales_opportunity_proformas") as any)
          .insert(proformaIds.map((proformaId, index) => ({
            opportunity_id: opportunity.id,
            proforma_id: proformaId,
            display_order: index
          })));
      }
    },
    onSuccess: () => {
      toast.success("Pro Formas updated");
      queryClient.invalidateQueries({ queryKey: ["opportunity-proformas-attached", opportunity.id] });
    },
  });

  const handleGenerateCode = () => {
    const newCode = generateAccessCode();
    updateOpportunityMutation.mutate({ access_code: newCode } as any);
  };

  const handleSaveSettings = () => {
    updateOpportunityMutation.mutate({
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      require_nda_board: requireNdaBoard,
      require_nda_recipient: requireNdaRecipient,
    } as any);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success("Share link copied");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyAccessCode = () => {
    if (opportunity.access_code) {
      navigator.clipboard.writeText(opportunity.access_code);
      setCopiedCode(true);
      toast.success("Access code copied");
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const copyFullInvite = () => {
    const message = `You've been invited to view ${opportunity.name}.\n\nAccess Link: ${shareUrl}\nAccess Code: ${opportunity.access_code || "No code required"}\n\nPlease keep this information confidential.`;
    navigator.clipboard.writeText(message);
    toast.success("Full invite copied to clipboard");
  };

  const handleSendInvite = () => {
    if (!investorEmail) {
      toast.error("Please enter an email address");
      return;
    }
    const message = `Hi ${investorName || "there"},\n\nYou've been invited to view ${opportunity.name}.\n\nAccess Link: ${shareUrl}\nAccess Code: ${opportunity.access_code || "No code required"}\n\nPlease keep this information confidential.`;
    navigator.clipboard.writeText(message);
    toast.success("Invite copied! Paste into your email client.");
    setInvestorEmail("");
    setInvestorName("");
  };

  const toggleVideo = (videoId: string) => {
    setSelectedVideoIds(prev =>
      prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]
    );
  };

  const toggleProforma = (proformaId: string) => {
    setSelectedProformaIds(prev =>
      prev.includes(proformaId) ? prev.filter(id => id !== proformaId) : [...prev, proformaId]
    );
  };

  return (
    <Card className="mt-4 border-primary/30 shadow-lg animate-in slide-in-from-top-2">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            {opportunity.name}
            <Badge variant={opportunity.status === "active" ? "default" : "secondary"}>
              {opportunity.status}
            </Badge>
          </CardTitle>
          <CardDescription>Configure sharing, videos, pro formas, and access settings</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ChevronUp className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="share">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="share" className="flex items-center gap-1 text-xs">
              <Link2 className="w-3 h-3" />
              Share
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-1 text-xs">
              <Video className="w-3 h-3" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="proforma" className="flex items-center gap-1 text-xs">
              <BarChart3 className="w-3 h-3" />
              Pro Forma
            </TabsTrigger>
            <TabsTrigger value="access" className="flex items-center gap-1 text-xs">
              <Key className="w-3 h-3" />
              Access
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-1 text-xs">
              <Shield className="w-3 h-3" />
              NDA
            </TabsTrigger>
          </TabsList>

          {/* Share Tab */}
          <TabsContent value="share" className="space-y-4 mt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Share Link</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 rounded-lg bg-muted text-xs font-mono truncate">
                      {shareUrl}
                    </code>
                    <Button variant="outline" size="icon" onClick={copyShareLink}>
                      {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button variant="secondary" className="w-full" size="sm" onClick={copyFullInvite}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Full Invite
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Send to Investor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2 grid-cols-2">
                    <Input
                      placeholder="Name"
                      value={investorName}
                      onChange={(e) => setInvestorName(e.target.value)}
                      className="h-9"
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={investorEmail}
                      onChange={(e) => setInvestorEmail(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <Button onClick={handleSendInvite} className="w-full" size="sm">
                    <Mail className="w-4 h-4 mr-2" />
                    Generate Invite
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Select Videos</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedVideoIds(allVideos?.map(v => v.id) || [])}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedVideoIds([])}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <CardDescription>Choose videos to display on the investor page</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] pr-4">
                  <div className="space-y-2">
                    {allVideos?.map((video) => (
                      <div
                        key={video.id}
                        className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                          selectedVideoIds.includes(video.id)
                            ? "bg-primary/10 border-primary/50"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleVideo(video.id)}
                      >
                        <Checkbox checked={selectedVideoIds.includes(video.id)} />
                        <Video className="w-4 h-4 text-muted-foreground" />
                        <span className="flex-1 text-sm truncate">{video.title}</span>
                        {video.category && (
                          <Badge variant="outline" className="text-xs">{video.category}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Separator className="my-3" />
                <Button
                  onClick={() => saveVideosMutation.mutate(selectedVideoIds)}
                  disabled={saveVideosMutation.isPending}
                  className="w-full"
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Videos ({selectedVideoIds.length})
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pro Forma Tab */}
          <TabsContent value="proforma" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Pro Forma Selection</CardTitle>
                  <a href="/admin/cfo/opportunity-proformas" className="text-xs text-primary hover:underline">
                    Manage Pro Formas →
                  </a>
                </div>
                <CardDescription>Select pro formas to include on the investor page</CardDescription>
              </CardHeader>
              <CardContent>
                {allProformas && allProformas.length > 0 ? (
                  <>
                    <ScrollArea className="h-[160px] pr-4">
                      <div className="space-y-2">
                        {allProformas.map((pf: any) => (
                          <div
                            key={pf.id}
                            className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                              selectedProformaIds.includes(pf.id)
                                ? "bg-primary/10 border-primary/50"
                                : "hover:bg-muted/50"
                            }`}
                            onClick={() => toggleProforma(pf.id)}
                          >
                            <Checkbox checked={selectedProformaIds.includes(pf.id)} />
                            <BarChart3 className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{pf.name}</p>
                              {pf.description && (
                                <p className="text-xs text-muted-foreground truncate">{pf.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <Separator className="my-3" />
                    <Button
                      onClick={() => saveProformasMutation.mutate(selectedProformaIds)}
                      disabled={saveProformasMutation.isPending}
                      className="w-full"
                      size="sm"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Pro Formas ({selectedProformaIds.length})
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No pro formas available for this opportunity.</p>
                    <a href="/admin/cfo/opportunity-proformas" className="text-xs text-primary hover:underline">
                      Create one in CFO Studio
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Tab */}
          <TabsContent value="access" className="space-y-4 mt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Access Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {opportunity.access_code ? (
                    <>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 rounded-lg bg-muted text-lg font-mono tracking-widest text-center">
                          {opportunity.access_code}
                        </code>
                        <Button variant="outline" size="icon" onClick={copyAccessCode}>
                          {copiedCode ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        size="sm"
                        onClick={handleGenerateCode}
                        disabled={updateOpportunityMutation.isPending}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate Code
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleGenerateCode} className="w-full" size="sm">
                      <Key className="w-4 h-4 mr-2" />
                      Generate Access Code
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Expiration Date
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="h-9"
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    onClick={handleSaveSettings}
                    disabled={updateOpportunityMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Expiration
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* NDA Tab */}
          <TabsContent value="compliance" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  NDA Requirements
                </CardTitle>
                <CardDescription>Configure disclosure acknowledgments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Checkbox
                    id="nda-board"
                    checked={requireNdaBoard}
                    onCheckedChange={(checked) => setRequireNdaBoard(!!checked)}
                  />
                  <div>
                    <Label htmlFor="nda-board" className="font-medium">
                      Board Member Acknowledgment
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Require board members to acknowledge confidentiality before sharing
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Checkbox
                    id="nda-recipient"
                    checked={requireNdaRecipient}
                    onCheckedChange={(checked) => setRequireNdaRecipient(!!checked)}
                  />
                  <div>
                    <Label htmlFor="nda-recipient" className="font-medium">
                      Investor NDA Acknowledgment
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Require investors to accept NDA terms before viewing content
                    </p>
                  </div>
                </div>

                <Separator />

                <Button
                  onClick={handleSaveSettings}
                  disabled={updateOpportunityMutation.isPending}
                  className="w-full"
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save NDA Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
