import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Mail, 
  Users, 
  Send, 
  Plus, 
  Trash2, 
  Calendar, 
  DollarSign,
  Edit,
  Eye,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { NewsletterBuilder, RevenuesDashboard, NewsletterBlock } from "@/components/newsletter";

const Newsletter = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [campaignTitle, setCampaignTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [blocks, setBlocks] = useState<NewsletterBlock[]>([]);
  const [aiAdPlacementEnabled, setAiAdPlacementEnabled] = useState(false);

  const { data: subscribers } = useQuery({
    queryKey: ["newsletter-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .eq("status", "active")
        .order("subscribed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ["newsletter-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      if (!campaignTitle || !subject) {
        throw new Error("Please fill in all required fields");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate HTML from blocks
      const htmlContent = generateHtmlFromBlocks(blocks);

      const { error } = await supabase
        .from("newsletter_campaigns")
        .insert({
          user_id: user.id,
          title: campaignTitle,
          subject,
          preview_text: previewText,
          html_content: htmlContent,
          blocks: blocks as any,
          ai_ad_placement_enabled: aiAdPlacementEnabled,
          status: "draft",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campaign created successfully");
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
      resetForm();
      setIsCreateOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async () => {
      if (!editingCampaign) return;

      const htmlContent = generateHtmlFromBlocks(blocks);

      const { error } = await supabase
        .from("newsletter_campaigns")
        .update({
          title: campaignTitle,
          subject,
          preview_text: previewText,
          html_content: htmlContent,
          blocks: blocks as any,
          ai_ad_placement_enabled: aiAdPlacementEnabled,
        })
        .eq("id", editingCampaign.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campaign updated");
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
      resetForm();
      setIsEditorOpen(false);
      setEditingCampaign(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const generateHtmlFromBlocks = (blocks: NewsletterBlock[]): string => {
    // Simple HTML generation from blocks
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">`;
    
    for (const block of blocks) {
      switch (block.type) {
        case 'text':
          const fontSize = { sm: '14px', base: '16px', lg: '18px', xl: '22px', '2xl': '28px' }[block.content.fontSize || 'base'];
          const textAlign = block.content.textAlign || 'left';
          html += `<p style="font-size: ${fontSize}; text-align: ${textAlign}; margin: 16px 0;">${block.content.text || ''}</p>`;
          break;
        case 'image':
          if (block.content.imageUrl) {
            const imgHtml = `<img src="${block.content.imageUrl}" alt="${block.content.imageAlt || ''}" style="max-width: 100%; height: auto; border-radius: 8px;">`;
            html += block.content.imageLink 
              ? `<a href="${block.content.imageLink}">${imgHtml}</a>` 
              : imgHtml;
          }
          break;
        case 'button':
          const btnAlign = { left: 'flex-start', center: 'center', right: 'flex-end' }[block.content.buttonAlign || 'center'];
          html += `<div style="display: flex; justify-content: ${btnAlign}; margin: 20px 0;">
            <a href="${block.content.buttonUrl || '#'}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              ${block.content.buttonText || 'Click Here'}
            </a>
          </div>`;
          break;
        case 'divider':
          html += `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">`;
          break;
        case 'blog-excerpt':
          html += `<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            ${block.content.blogPostImage ? `<img src="${block.content.blogPostImage}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 6px; margin-bottom: 12px;">` : ''}
            <h3 style="margin: 0 0 8px 0;">${block.content.blogPostTitle || 'Blog Post'}</h3>
            <p style="color: #6b7280; margin: 0;">${block.content.blogPostExcerpt || ''}</p>
          </div>`;
          break;
        case 'product-card':
          html += `<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <div style="display: flex; gap: 16px;">
              ${block.content.productImage ? `<img src="${block.content.productImage}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 6px;">` : ''}
              <div>
                <h4 style="margin: 0 0 4px 0;">${block.content.productName || 'Product'}</h4>
                <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">${block.content.productDescription || ''}</p>
                <p style="color: #3b82f6; font-weight: 700; font-size: 18px; margin: 0;">${block.content.productPrice || ''}</p>
              </div>
            </div>
          </div>`;
          break;
        case 'ad-marker':
          // Ad markers are replaced at send time
          html += `<!-- AD_MARKER:${block.id}:${block.content.adType || 'cpm'} -->`;
          break;
        default:
          break;
      }
    }
    
    html += `</body></html>`;
    return html;
  };

  const resetForm = () => {
    setCampaignTitle("");
    setSubject("");
    setPreviewText("");
    setBlocks([]);
    setAiAdPlacementEnabled(false);
  };

  const handleEditCampaign = (campaign: any) => {
    setEditingCampaign(campaign);
    setCampaignTitle(campaign.title);
    setSubject(campaign.subject);
    setPreviewText(campaign.preview_text || "");
    setBlocks(campaign.blocks || []);
    setAiAdPlacementEnabled(campaign.ai_ad_placement_enabled || false);
    setIsEditorOpen(true);
  };

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm("Send this newsletter to all active subscribers?")) return;

    toast.info("Sending newsletter...");

    const { error } = await supabase.functions.invoke("send-newsletter", {
      body: { campaignId },
    });

    if (error) {
      toast.error("Failed to send newsletter");
      return;
    }

    toast.success("Newsletter sent successfully!");
    queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Delete this campaign?")) return;

    const { error } = await supabase
      .from("newsletter_campaigns")
      .delete()
      .eq("id", campaignId);

    if (error) {
      toast.error("Failed to delete campaign");
      return;
    }

    toast.success("Campaign deleted");
    queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Newsletter</h1>
              <p className="text-muted-foreground">Build beautiful newsletters with drag-and-drop</p>
            </div>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="campaigns">
              <Mail className="w-4 h-4 mr-2" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="subscribers">
              <Users className="w-4 h-4 mr-2" />
              Subscribers
            </TabsTrigger>
            <TabsTrigger value="revenue">
              <DollarSign className="w-4 h-4 mr-2" />
              Revenue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            {campaigns && campaigns.length > 0 ? (
              <div className="grid gap-4">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle>{campaign.title}</CardTitle>
                            {campaign.ai_ad_placement_enabled && (
                              <Badge variant="secondary" className="gap-1">
                                <Sparkles className="h-3 w-3" />
                                AI Ads
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="mt-1">{campaign.subject}</CardDescription>
                        </div>
                        <Badge variant={campaign.status === "sent" ? "default" : "secondary"}>
                          {campaign.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Created {format(new Date(campaign.created_at), "MMM d, yyyy")}
                          </div>
                          {campaign.sent_at && (
                            <div className="flex items-center gap-4">
                              <span>Sent to {campaign.recipient_count} recipients</span>
                              <span>{campaign.opened_count || 0} opens</span>
                              <span>{campaign.clicked_count || 0} clicks</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {campaign.status === "draft" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCampaign(campaign)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSendCampaign(campaign.id)}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Send
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No campaigns yet</p>
                  <Button onClick={() => setIsCreateOpen(true)} className="mt-4">
                    Create your first campaign
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="subscribers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Subscribers</CardTitle>
                <CardDescription>
                  {subscribers?.length || 0} active subscribers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscribers && subscribers.length > 0 ? (
                  <div className="space-y-2">
                    {subscribers.map((subscriber) => (
                      <div
                        key={subscriber.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium">{subscriber.name || subscriber.email}</p>
                          {subscriber.name && (
                            <p className="text-sm text-muted-foreground">{subscriber.email}</p>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(subscriber.subscribed_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No subscribers yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <RevenuesDashboard />
          </TabsContent>
        </Tabs>

        {/* Create Campaign Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Create Newsletter Campaign</DialogTitle>
              <DialogDescription>
                Build your newsletter using drag-and-drop blocks
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="title">Campaign Title</Label>
                <Input
                  id="title"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="Internal campaign name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line recipients will see"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="preview">Preview Text</Label>
                <Input
                  id="preview"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Text shown in inbox preview"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <NewsletterBuilder
                initialBlocks={blocks}
                onChange={setBlocks}
                aiAdPlacementEnabled={aiAdPlacementEnabled}
                onAiAdPlacementChange={setAiAdPlacementEnabled}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => { resetForm(); setIsCreateOpen(false); }}>
                Cancel
              </Button>
              <Button 
                onClick={() => createCampaignMutation.mutate()}
                disabled={createCampaignMutation.isPending}
              >
                {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Campaign Dialog */}
        <Dialog open={isEditorOpen} onOpenChange={(open) => { if (!open) { setIsEditorOpen(false); setEditingCampaign(null); } }}>
          <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit Campaign</DialogTitle>
              <DialogDescription>
                Update your newsletter content
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="edit-title">Campaign Title</Label>
                <Input
                  id="edit-title"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="Internal campaign name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-subject">Email Subject</Label>
                <Input
                  id="edit-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line recipients will see"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-preview">Preview Text</Label>
                <Input
                  id="edit-preview"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Text shown in inbox preview"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <NewsletterBuilder
                initialBlocks={blocks}
                onChange={setBlocks}
                aiAdPlacementEnabled={aiAdPlacementEnabled}
                onAiAdPlacementChange={setAiAdPlacementEnabled}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => { resetForm(); setIsEditorOpen(false); setEditingCampaign(null); }}>
                Cancel
              </Button>
              <Button 
                onClick={() => updateCampaignMutation.mutate()}
                disabled={updateCampaignMutation.isPending}
              >
                {updateCampaignMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Newsletter;
