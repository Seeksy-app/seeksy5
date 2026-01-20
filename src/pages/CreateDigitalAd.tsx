import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Laptop, Instagram, Facebook, Linkedin, Play, ExternalLink } from "lucide-react";
import { FaTiktok } from "react-icons/fa";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

const AD_SIZE_PRESETS = {
  website: [
    { name: "Leaderboard", width: 728, height: 90, description: "Header banner" },
    { name: "Medium Rectangle", width: 300, height: 250, description: "Most popular" },
    { name: "Wide Skyscraper", width: 160, height: 600, description: "Sidebar" },
    { name: "Half Page", width: 300, height: 600, description: "Large sidebar" },
  ],
  social: [
    { name: "Instagram Post", platform: "instagram_post", width: 1080, height: 1080, description: "Square format", icon: Instagram },
    { name: "Instagram Story", platform: "instagram_story", width: 1080, height: 1920, description: "Vertical format", icon: Instagram },
    { name: "Facebook Post", platform: "facebook", width: 1200, height: 628, description: "Link preview", icon: Facebook },
    { name: "LinkedIn Post", platform: "linkedin", width: 1200, height: 627, description: "Professional feed", icon: Linkedin },
    { name: "TikTok Video", platform: "tiktok", width: 1080, height: 1920, description: "Vertical video", icon: FaTiktok },
  ],
};

export default function CreateDigitalAd() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [platformType, setPlatformType] = useState<"website" | "social_media">("website");
  const [selectedPreset, setSelectedPreset] = useState<any>(null);
  const [creativeFile, setCreativeFile] = useState<File | null>(null);
  const [creativePreview, setCreativePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    ctaUrl: "",
    ctaText: "Learn More",
    caption: "",
    hashtags: "",
    mentions: "",
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return user;
    },
  });

  const { data: advertiser } = useQuery({
    queryKey: ["advertiser", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advertisers")
        .select("*")
        .eq("owner_profile_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast({
        title: "Invalid file",
        description: "Please upload an image or video file",
        variant: "destructive",
      });
      return;
    }

    setCreativeFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCreativePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const createDigitalAd = useMutation({
    mutationFn: async () => {
      if (!advertiser || !selectedPreset || !creativeFile) {
        throw new Error("Missing required data");
      }

      setUploading(true);

      try {
        // Upload creative
        const fileExt = creativeFile.name.split(".").pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("digital-ad-creatives")
          .upload(fileName, creativeFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("digital-ad-creatives")
          .getPublicUrl(fileName);

        // Create digital ad record
        const { error: insertError } = await supabase
          .from("digital_ads")
          .insert({
            advertiser_id: advertiser.id,
            platform_type: platformType,
            social_platform: selectedPreset.platform || null,
            ad_size_preset: selectedPreset.name,
            width: selectedPreset.width,
            height: selectedPreset.height,
            creative_url: publicUrl,
            creative_type: creativeFile.type.startsWith("image/") ? "image" : "video",
            cta_url: formData.ctaUrl,
            cta_text: formData.ctaText,
            caption: formData.caption || null,
            hashtags: formData.hashtags ? formData.hashtags.split(",").map(h => h.trim()) : null,
            mentions: formData.mentions ? formData.mentions.split(",").map(m => m.trim()) : null,
            status: "ready",
          });

        if (insertError) throw insertError;

        toast({
          title: "Success!",
          description: "Your digital ad has been created",
        });

        navigate("/advertiser/ads");
      } finally {
        setUploading(false);
      }
    },
  });

  const openCanva = () => {
    if (!selectedPreset) return;
    const canvaUrl = `https://www.canva.com/create?width=${selectedPreset.width}&height=${selectedPreset.height}`;
    window.open(canvaUrl, "_blank");
    toast({
      title: "Opening Canva",
      description: "Design your ad in Canva, then download and upload it here",
    });
  };

  const presets = platformType === "website" ? AD_SIZE_PRESETS.website : AD_SIZE_PRESETS.social;

  return (
    <div className="container max-w-6xl py-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/advertiser/campaigns/create-type")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Ad Types
      </Button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Create Digital Ad</h1>
        <p className="text-muted-foreground">
          Design ads for websites and social media platforms
        </p>
      </div>

      {/* Platform Type Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Platform Type</CardTitle>
          <CardDescription>Choose where your ad will appear</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={platformType}
            onValueChange={(value: "website" | "social_media") => {
              setPlatformType(value);
              setSelectedPreset(null);
            }}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem value="website" id="website" className="peer sr-only" />
              <Label
                htmlFor="website"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Laptop className="mb-3 h-6 w-6" />
                <span className="font-semibold">Website Ads</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="social_media" id="social" className="peer sr-only" />
              <Label
                htmlFor="social"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Instagram className="mb-3 h-6 w-6" />
                <span className="font-semibold">Social Media Ads</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Size Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Choose Ad Size</CardTitle>
          <CardDescription>Select from standard ad formats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {presets.map((preset) => {
              const Icon = 'icon' in preset ? preset.icon as React.ElementType : Laptop;
              return (
                <div
                  key={preset.name}
                  onClick={() => setSelectedPreset(preset)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPreset?.name === preset.name
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-5 w-5" />}
                      <h3 className="font-semibold">{preset.name}</h3>
                    </div>
                    <Badge variant="secondary">
                      {preset.width}×{preset.height}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{preset.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Creative Upload */}
      {selectedPreset && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload Creative</CardTitle>
            <CardDescription>
              Upload your ad image or video ({selectedPreset.width}×{selectedPreset.height}px)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={openCanva}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Design in Canva
              </Button>
              <Label htmlFor="creative-upload" className="flex-1">
                <div className="flex items-center justify-center gap-2 h-10 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90">
                  <Upload className="h-4 w-4" />
                  Upload File
                </div>
                <Input
                  id="creative-upload"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </Label>
            </div>

            {creativePreview && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">Preview:</p>
                {creativeFile?.type.startsWith("image/") ? (
                  <img
                    src={creativePreview}
                    alt="Preview"
                    className="max-w-full max-h-96 mx-auto rounded"
                  />
                ) : (
                  <video
                    src={creativePreview}
                    controls
                    className="max-w-full max-h-96 mx-auto rounded"
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ad Details */}
      {creativeFile && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ad Details</CardTitle>
            <CardDescription>Add your call-to-action and additional content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ctaUrl">Call-to-Action URL *</Label>
                <Input
                  id="ctaUrl"
                  placeholder="https://example.com"
                  value={formData.ctaUrl}
                  onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ctaText">CTA Button Text</Label>
                <Input
                  id="ctaText"
                  placeholder="Learn More"
                  value={formData.ctaText}
                  onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                />
              </div>
            </div>

            {platformType === "social_media" && (
              <>
                <div>
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    placeholder="Write your ad caption..."
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.caption.length} characters
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hashtags">Hashtags</Label>
                    <Input
                      id="hashtags"
                      placeholder="#marketing, #business"
                      value={formData.hashtags}
                      onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Comma-separated</p>
                  </div>
                  <div>
                    <Label htmlFor="mentions">Mentions</Label>
                    <Input
                      id="mentions"
                      placeholder="@username1, @username2"
                      value={formData.mentions}
                      onChange={(e) => setFormData({ ...formData, mentions: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Comma-separated</p>
                  </div>
                </div>
              </>
            )}

            <Button
              onClick={() => createDigitalAd.mutate()}
              disabled={!formData.ctaUrl || uploading}
              className="w-full"
              size="lg"
            >
              {uploading ? "Creating Ad..." : "Create Digital Ad"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}