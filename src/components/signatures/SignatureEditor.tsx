import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GripVertical, 
  User, 
  Building2, 
  Share2, 
  Image, 
  Quote, 
  Plus,
  Copy,
  Check,
  Upload,
  Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SignaturePreview } from "./SignaturePreview";

interface SignatureEditorProps {
  signature: any;
  onUpdate: (signature: any) => void;
}

const SOCIAL_ICONS = [
  { id: "facebook", label: "Facebook", icon: "🔵" },
  { id: "twitter", label: "X (Twitter)", icon: "🐦" },
  { id: "instagram", label: "Instagram", icon: "📷" },
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
  { id: "youtube", label: "YouTube", icon: "🎬" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "pinterest", label: "Pinterest", icon: "📌" },
];

export function SignatureEditor({ signature, onUpdate }: SignatureEditorProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  const [formData, setFormData] = useState({
    name: signature.name || "",
    quote_text: signature.quote_text || "",
    profile_photo_url: signature.profile_photo_url || "",
    profile_name: signature.profile_name || "",
    profile_title: signature.profile_title || "",
    company_name: signature.company_name || "",
    company_website: signature.company_website || "",
    company_logo_url: signature.company_logo_url || "",
    company_phone: signature.company_phone || "",
    company_address: signature.company_address || "",
    social_links: signature.social_links || {},
    banner_image_url: signature.banner_image_url || "",
    banner_cta_url: signature.banner_cta_url || "",
    banner_alt_text: signature.banner_alt_text || "",
    font_family: signature.font_family || "Arial, sans-serif",
    font_size: signature.font_size || "medium",
    primary_color: signature.primary_color || "#000000",
    secondary_color: signature.secondary_color || "#666666",
    link_color: signature.link_color || "#0066cc",
    profile_image_size: signature.profile_image_size || "medium",
    profile_image_shape: signature.profile_image_shape || "circle",
    social_icon_size: signature.social_icon_size || "medium",
    blocks: signature.blocks || [],
  });

  useEffect(() => {
    setFormData({
      name: signature.name || "",
      quote_text: signature.quote_text || "",
      profile_photo_url: signature.profile_photo_url || "",
      profile_name: signature.profile_name || "",
      profile_title: signature.profile_title || "",
      company_name: signature.company_name || "",
      company_website: signature.company_website || "",
      company_logo_url: signature.company_logo_url || "",
      company_phone: signature.company_phone || "",
      company_address: signature.company_address || "",
      social_links: signature.social_links || {},
      banner_image_url: signature.banner_image_url || "",
      banner_cta_url: signature.banner_cta_url || "",
      banner_alt_text: signature.banner_alt_text || "",
      font_family: signature.font_family || "Arial, sans-serif",
      font_size: signature.font_size || "medium",
      primary_color: signature.primary_color || "#000000",
      secondary_color: signature.secondary_color || "#666666",
      link_color: signature.link_color || "#0066cc",
      profile_image_size: signature.profile_image_size || "medium",
      profile_image_shape: signature.profile_image_shape || "circle",
      social_icon_size: signature.social_icon_size || "medium",
      blocks: signature.blocks || [],
    });
  }, [signature]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (socialId: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: { ...prev.social_links, [socialId]: url },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Generate HTML signature
      const htmlSignature = generateHtmlSignature(formData, signature.id);
      const plainTextSignature = generatePlainTextSignature(formData);

      const { data, error } = await supabase
        .from("email_signatures")
        .update({
          ...formData,
          html_signature: htmlSignature,
          plain_text_signature: plainTextSignature,
        })
        .eq("id", signature.id)
        .select()
        .single();

      if (error) throw error;

      onUpdate(data);
      toast({
        title: "Signature saved",
        description: "Your changes have been saved",
      });
    } catch (error) {
      console.error("Error saving signature:", error);
      toast({
        title: "Error",
        description: "Failed to save signature",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyHtml = async () => {
    const html = generateHtmlSignature(formData, signature.id);
    await navigator.clipboard.writeText(html);
    setCopied(true);
    toast({
      title: "HTML copied",
      description: "Paste this into your email client's signature settings",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyRichText = async () => {
    const html = generateHtmlSignature(formData, signature.id);
    try {
      // Copy as rich text (formatted) so it pastes directly into Gmail
      const blob = new Blob([html], { type: "text/html" });
      const clipboardItem = new ClipboardItem({
        "text/html": blob,
        "text/plain": new Blob([generatePlainTextSignature(formData)], { type: "text/plain" }),
      });
      await navigator.clipboard.write([clipboardItem]);
      setCopied(true);
      toast({
        title: "Signature copied!",
        description: "Paste directly into Gmail signature settings",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support ClipboardItem
      await navigator.clipboard.writeText(html);
      toast({
        title: "HTML copied",
        description: "Your browser doesn't support rich text copy. Paste the HTML code.",
        variant: "destructive",
      });
    }
  };

  const handleCopyPlainText = async () => {
    const text = generatePlainTextSignature(formData);
    await navigator.clipboard.writeText(text);
    toast({
      title: "Plain text copied",
      description: "Signature copied as plain text",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor Panel */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Edit Signature</CardTitle>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Signature Name */}
          <div className="mb-4">
            <Label htmlFor="name">Signature Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="My Signature"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="profile" className="text-xs">
                <User className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="company" className="text-xs">
                <Building2 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="social" className="text-xs">
                <Share2 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="banner" className="text-xs">
                <Image className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="style" className="text-xs">
                🎨
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <div>
                <Label htmlFor="profile_name">Full Name</Label>
                <Input
                  id="profile_name"
                  value={formData.profile_name}
                  onChange={(e) => handleChange("profile_name", e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="profile_title">Job Title</Label>
                <Input
                  id="profile_title"
                  value={formData.profile_title}
                  onChange={(e) => handleChange("profile_title", e.target.value)}
                  placeholder="CEO & Founder"
                />
              </div>
              <div>
                <Label>Profile Photo</Label>
                <div className="mt-2 space-y-3">
                  {formData.profile_photo_url && (
                    <div className="relative w-20 h-20">
                      <img 
                        src={formData.profile_photo_url} 
                        alt="Profile preview" 
                        className={`w-20 h-20 object-cover border ${formData.profile_image_shape === 'square' ? 'rounded-md' : 'rounded-full'}`}
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-1 -right-1 h-6 w-6"
                        onClick={() => handleChange("profile_photo_url", "")}
                      >
                        ×
                      </Button>
                    </div>
                  )}
                  
                  {/* Shape + Size selectors */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Shape</Label>
                      <select
                        value={formData.profile_image_shape}
                        onChange={(e) => handleChange("profile_image_shape", e.target.value)}
                        className="w-full h-9 text-sm rounded-md border border-input bg-background px-2"
                      >
                        <option value="circle">Circle</option>
                        <option value="square">Square</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Size</Label>
                      <select
                        value={formData.profile_image_size}
                        onChange={(e) => handleChange("profile_image_size", e.target.value)}
                        className="w-full h-9 text-sm rounded-md border border-input bg-background px-2"
                      >
                        <option value="small">Small (40px)</option>
                        <option value="medium">Medium (60px)</option>
                        <option value="large">Large (80px)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          if (file.size > 2 * 1024 * 1024) {
                            toast({
                              title: "File too large",
                              description: "Max file size is 2MB",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          try {
                            const fileExt = file.name.split('.').pop();
                            const fileName = `profile_${signature.id}_${Date.now()}.${fileExt}`;
                            
                            const { data, error } = await supabase.storage
                              .from('signature-profiles')
                              .upload(fileName, file, { upsert: true });
                            
                            if (error) throw error;
                            
                            const { data: urlData } = supabase.storage
                              .from('signature-profiles')
                              .getPublicUrl(fileName);
                            
                            handleChange("profile_photo_url", urlData.publicUrl);
                            toast({
                              title: "Photo uploaded",
                              description: "Your profile photo has been uploaded",
                            });
                          } catch (error) {
                            console.error("Upload error:", error);
                            toast({
                              title: "Upload failed",
                              description: "Could not upload profile photo",
                              variant: "destructive",
                            });
                          }
                        }}
                      />
                      <Button variant="outline" className="w-full gap-2" asChild>
                        <span>
                          <Upload className="h-4 w-4" />
                          Upload Photo
                        </span>
                      </Button>
                    </label>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or paste URL</span>
                    </div>
                  </div>
                  
                  <Input
                    id="profile_photo_url"
                    value={formData.profile_photo_url}
                    onChange={(e) => handleChange("profile_photo_url", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="quote_text">Quote (optional)</Label>
                <Textarea
                  id="quote_text"
                  value={formData.quote_text}
                  onChange={(e) => handleChange("quote_text", e.target.value)}
                  placeholder="A short inspirational quote..."
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="company" className="space-y-4">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <Label htmlFor="company_website">Website</Label>
                <Input
                  id="company_website"
                  value={formData.company_website}
                  onChange={(e) => handleChange("company_website", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <Label htmlFor="company_phone">Phone</Label>
                <Input
                  id="company_phone"
                  value={formData.company_phone}
                  onChange={(e) => handleChange("company_phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="company_address">Address</Label>
                <Input
                  id="company_address"
                  value={formData.company_address}
                  onChange={(e) => handleChange("company_address", e.target.value)}
                  placeholder="123 Main St, City, Country"
                />
              </div>
              <div>
                <Label>Company Logo</Label>
                <div className="mt-2 space-y-3">
                  {formData.company_logo_url && (
                    <div className="relative w-24 h-12">
                      <img 
                        src={formData.company_logo_url} 
                        alt="Company logo preview" 
                        className="h-12 w-auto object-contain border rounded"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-1 -right-1 h-5 w-5"
                        onClick={() => handleChange("company_logo_url", "")}
                      >
                        ×
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          if (file.size > 2 * 1024 * 1024) {
                            toast({
                              title: "File too large",
                              description: "Max file size is 2MB",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          try {
                            const fileExt = file.name.split('.').pop();
                            const fileName = `logo_${signature.id}_${Date.now()}.${fileExt}`;
                            
                            const { data, error } = await supabase.storage
                              .from('signature-banners')
                              .upload(fileName, file, { upsert: true });
                            
                            if (error) throw error;
                            
                            const { data: urlData } = supabase.storage
                              .from('signature-banners')
                              .getPublicUrl(fileName);
                            
                            handleChange("company_logo_url", urlData.publicUrl);
                            toast({
                              title: "Logo uploaded",
                              description: "Your company logo has been uploaded",
                            });
                          } catch (error) {
                            console.error("Upload error:", error);
                            toast({
                              title: "Upload failed",
                              description: "Could not upload company logo",
                              variant: "destructive",
                            });
                          }
                        }}
                      />
                      <Button variant="outline" className="w-full gap-2" asChild>
                        <span>
                          <Upload className="h-4 w-4" />
                          Upload Logo
                        </span>
                      </Button>
                    </label>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or paste URL</span>
                    </div>
                  </div>
                  
                  <Input
                    id="company_logo_url"
                    value={formData.company_logo_url}
                    onChange={(e) => handleChange("company_logo_url", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Add your social media links. Each click will be tracked.
              </p>
              {SOCIAL_ICONS.map((social) => (
                <div key={social.id}>
                  <Label htmlFor={`social_${social.id}`}>
                    {social.icon} {social.label}
                  </Label>
                  <Input
                    id={`social_${social.id}`}
                    value={formData.social_links[social.id] || ""}
                    onChange={(e) => handleSocialChange(social.id, e.target.value)}
                    placeholder={`https://${social.id}.com/...`}
                  />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="banner" className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Add a promotional banner (600×200px recommended). Supports JPG, PNG, and animated GIFs.
              </p>
              
              {/* Banner Upload */}
              <div>
                <Label>Banner Image</Label>
                <div className="mt-2 space-y-3">
                  {formData.banner_image_url && (
                    <div className="relative rounded-lg overflow-hidden border">
                      <img 
                        src={formData.banner_image_url} 
                        alt="Banner preview" 
                        className="w-full h-auto max-h-32 object-contain bg-muted"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => handleChange("banner_image_url", "")}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          if (file.size > 2 * 1024 * 1024) {
                            toast({
                              title: "File too large",
                              description: "Max file size is 2MB",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          try {
                            const fileExt = file.name.split('.').pop();
                            const fileName = `banner_${signature.id}_${Date.now()}.${fileExt}`;
                            
                            const { data, error } = await supabase.storage
                              .from('signature-banners')
                              .upload(fileName, file, { upsert: true });
                            
                            if (error) throw error;
                            
                            const { data: urlData } = supabase.storage
                              .from('signature-banners')
                              .getPublicUrl(fileName);
                            
                            handleChange("banner_image_url", urlData.publicUrl);
                            toast({
                              title: "Banner uploaded",
                              description: "Your banner image has been uploaded",
                            });
                          } catch (error) {
                            console.error("Upload error:", error);
                            toast({
                              title: "Upload failed",
                              description: "Could not upload banner image",
                              variant: "destructive",
                            });
                          }
                        }}
                      />
                      <Button variant="outline" className="w-full gap-2" asChild>
                        <span>
                          <Upload className="h-4 w-4" />
                          Upload Banner
                        </span>
                      </Button>
                    </label>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or paste URL</span>
                    </div>
                  </div>
                  
                  <Input
                    id="banner_image_url"
                    value={formData.banner_image_url}
                    onChange={(e) => handleChange("banner_image_url", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="banner_cta_url">CTA Link (tracked)</Label>
                <Input
                  id="banner_cta_url"
                  value={formData.banner_cta_url}
                  onChange={(e) => handleChange("banner_cta_url", e.target.value)}
                  placeholder="https://example.com/promo"
                />
              </div>
              <div>
                <Label htmlFor="banner_alt_text">Alt Text</Label>
                <Input
                  id="banner_alt_text"
                  value={formData.banner_alt_text}
                  onChange={(e) => handleChange("banner_alt_text", e.target.value)}
                  placeholder="Describe the banner for accessibility"
                />
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="font_family">Font Family</Label>
                  <select
                    id="font_family"
                    value={formData.font_family}
                    onChange={(e) => handleChange("font_family", e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Helvetica, sans-serif">Helvetica</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="font_size">Font Size</Label>
                  <select
                    id="font_size"
                    value={formData.font_size}
                    onChange={(e) => handleChange("font_size", e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="small">Small (12px)</option>
                    <option value="medium">Medium (14px)</option>
                    <option value="large">Large (16px)</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="social_icon_size">Social Icon Size</Label>
                <select
                  id="social_icon_size"
                  value={formData.social_icon_size}
                  onChange={(e) => handleChange("social_icon_size", e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <Separator className="my-4" />
              <p className="text-sm font-medium text-muted-foreground">Colors</p>

              <div>
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="primary_color"
                    value={formData.primary_color}
                    onChange={(e) => handleChange("primary_color", e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => handleChange("primary_color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="secondary_color"
                    value={formData.secondary_color}
                    onChange={(e) => handleChange("secondary_color", e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={(e) => handleChange("secondary_color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="link_color">Link Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="link_color"
                    value={formData.link_color}
                    onChange={(e) => handleChange("link_color", e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.link_color}
                    onChange={(e) => handleChange("link_color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <SignaturePreview formData={formData} signatureId={signature.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleCopyRichText} 
              className="w-full justify-start gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy for Gmail (Recommended)
            </Button>
            <Button 
              onClick={handleCopyHtml} 
              variant="outline" 
              className="w-full justify-start gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Raw HTML
            </Button>
            <Button 
              onClick={handleCopyPlainText} 
              variant="outline" 
              className="w-full justify-start gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Plain Text
            </Button>
            <p className="text-xs text-muted-foreground">
              Use "Copy for Gmail" and paste directly into Gmail Settings → Signature.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Size mappings
const PROFILE_IMAGE_SIZES: Record<string, number> = { small: 40, medium: 60, large: 80 };
const FONT_SIZES: Record<string, number> = { small: 12, medium: 14, large: 16 };
const SOCIAL_ICON_SIZES: Record<string, number> = { small: 12, medium: 14, large: 16 };

// Helper functions to generate signature HTML/text
function generateHtmlSignature(formData: any, signatureId: string): string {
  const baseUrl = "https://taxqcioheqdqtlmjeaht.supabase.co/functions/v1";
  const trackingPixelUrl = `${baseUrl}/signature-tracking-pixel/${signatureId}.png`;
  const clickTrackingBase = `${baseUrl}/signature-click-tracking/${signatureId}`;

  const fontSize = FONT_SIZES[formData.font_size] || FONT_SIZES.medium;
  const profileImageSize = PROFILE_IMAGE_SIZES[formData.profile_image_size] || PROFILE_IMAGE_SIZES.medium;
  const socialIconSize = SOCIAL_ICON_SIZES[formData.social_icon_size] || SOCIAL_ICON_SIZES.medium;

  let html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${formData.font_family}; font-size: ${fontSize}px; color: ${formData.primary_color};">`;

  // Quote block
  if (formData.quote_text) {
    html += `
      <tr>
        <td style="padding-bottom: 12px; font-style: italic; color: ${formData.secondary_color};">
          "${formData.quote_text}"
        </td>
      </tr>`;
  }

  // Profile block
  if (formData.profile_name || formData.profile_title) {
    html += `
      <tr>
        <td style="padding-bottom: 8px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>`;
    
    if (formData.profile_photo_url) {
      html += `
              <td style="padding-right: 12px; vertical-align: top;">
                <img src="${formData.profile_photo_url}" alt="${formData.profile_name}" 
                     style="width: ${profileImageSize}px; height: ${profileImageSize}px; border-radius: 50%; object-fit: cover;" />
              </td>`;
    }
    
    html += `
              <td style="vertical-align: middle;">
                ${formData.profile_name ? `<div style="font-weight: bold; font-size: ${fontSize + 2}px;">${formData.profile_name}</div>` : ""}
                ${formData.profile_title ? `<div style="color: ${formData.secondary_color};">${formData.profile_title}</div>` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }

  // Company block
  if (formData.company_name || formData.company_phone || formData.company_website) {
    html += `
      <tr>
        <td style="padding-bottom: 8px; color: ${formData.secondary_color};">`;
    
    if (formData.company_name) {
      html += `<div style="font-weight: 600;">${formData.company_name}</div>`;
    }
    if (formData.company_phone) {
      html += `<div>${formData.company_phone}</div>`;
    }
    if (formData.company_website) {
      const trackUrl = `${clickTrackingBase}/website?url=${encodeURIComponent(formData.company_website)}`;
      html += `<div><a href="${trackUrl}" style="color: ${formData.link_color}; text-decoration: none;">${formData.company_website.replace(/^https?:\/\//, "")}</a></div>`;
    }
    if (formData.company_address) {
      html += `<div style="font-size: 12px;">${formData.company_address}</div>`;
    }
    
    html += `
        </td>
      </tr>`;
  }

  // Social icons block - using small icon images for email compatibility
  const socialLinks = Object.entries(formData.social_links || {}).filter(([_, url]) => url);
  const socialIconSizePx = SOCIAL_ICON_SIZES[formData.social_icon_size] || 14;
  const socialIconImgSize = socialIconSizePx <= 12 ? 20 : socialIconSizePx <= 14 ? 24 : 28;
  
  if (socialLinks.length > 0) {
    html += `
      <tr>
        <td style="padding: 8px 0; font-size: ${socialIconSizePx}px;">`;
    
    for (const [platform, url] of socialLinks) {
      const trackUrl = `${clickTrackingBase}/social/${platform}?url=${encodeURIComponent(url as string)}`;
      const iconUrl = getSocialIconUrl(platform);
      html += `<a href="${trackUrl}" style="margin-right: 8px; text-decoration: none;"><img src="${iconUrl}" alt="${platform}" style="width: ${socialIconImgSize}px; height: ${socialIconImgSize}px; vertical-align: middle;" /></a>`;
    }
    
    html += `
        </td>
      </tr>`;
  }

  // Banner block
  if (formData.banner_image_url) {
    const bannerTrackUrl = formData.banner_cta_url 
      ? `${clickTrackingBase}/banner?url=${encodeURIComponent(formData.banner_cta_url)}`
      : formData.banner_cta_url;
    
    html += `
      <tr>
        <td style="padding-top: 12px;">`;
    
    if (bannerTrackUrl) {
      html += `<a href="${bannerTrackUrl}" target="_blank">`;
    }
    
    html += `<img src="${formData.banner_image_url}" alt="${formData.banner_alt_text || "Banner"}" 
                 style="max-width: 400px; width: 100%; height: auto; display: block;" />`;
    
    if (bannerTrackUrl) {
      html += `</a>`;
    }
    
    html += `
        </td>
      </tr>`;
  }

  // Tracking pixel (invisible)
  html += `
    <tr>
      <td>
        <img src="${trackingPixelUrl}" width="1" height="1" style="display: block;" alt="" />
      </td>
    </tr>`;

  html += `</table>`;
  
  return html;
}

function generatePlainTextSignature(formData: any): string {
  let text = "";

  if (formData.quote_text) {
    text += `"${formData.quote_text}"\n\n`;
  }

  if (formData.profile_name) {
    text += `${formData.profile_name}\n`;
  }
  if (formData.profile_title) {
    text += `${formData.profile_title}\n`;
  }

  if (formData.company_name) {
    text += `\n${formData.company_name}\n`;
  }
  if (formData.company_phone) {
    text += `${formData.company_phone}\n`;
  }
  if (formData.company_website) {
    text += `${formData.company_website}\n`;
  }
  if (formData.company_address) {
    text += `${formData.company_address}\n`;
  }

  return text.trim();
}

// Text labels for social platforms (email-safe, no images needed)
function getSocialLabel(platform: string): string {
  const labels: Record<string, string> = {
    facebook: "Facebook",
    twitter: "𝕏",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    youtube: "YouTube",
    tiktok: "TikTok",
    pinterest: "Pinterest",
  };
  return labels[platform] || platform;
}

// Get social icon URLs - using simple, reliable hosted icons
function getSocialIconUrl(platform: string): string {
  const icons: Record<string, string> = {
    facebook: "https://cdn.simpleicons.org/facebook/1877F2",
    twitter: "https://cdn.simpleicons.org/x/000000",
    instagram: "https://cdn.simpleicons.org/instagram/E4405F",
    linkedin: "https://cdn.simpleicons.org/linkedin/0A66C2",
    youtube: "https://cdn.simpleicons.org/youtube/FF0000",
    tiktok: "https://cdn.simpleicons.org/tiktok/000000",
    pinterest: "https://cdn.simpleicons.org/pinterest/BD081C",
  };
  return icons[platform] || `https://cdn.simpleicons.org/${platform}`;
}
