import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Upload, Loader2, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CreateAd() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    campaign_id: "",
    advertiser_id: "",
    format: "display",
    description: "",
    cta_text: "",
    cta_url: "",
    duration_seconds: "30",
    asset_file: null as File | null,
  });

  const { data: campaigns } = useQuery({
    queryKey: ["campaigns-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select(`
          id,
          name,
          advertisers (id, company_name)
        `)
        .in("status", ["draft", "active"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, asset_file: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedCampaign = campaigns?.find(c => c.id === formData.campaign_id);
      const advertiserId = selectedCampaign?.advertisers?.id;

      if (!advertiserId) {
        throw new Error("Could not determine advertiser");
      }

      // Create creative record
      const { data: creative, error: creativeError } = await supabase
        .from("ad_creatives")
        .insert({
          name: formData.name,
          campaign_id: formData.campaign_id,
          advertiser_id: advertiserId,
          format: formData.format,
          description: formData.description,
          cta_text: formData.cta_text,
          cta_url: formData.cta_url,
          duration_seconds: parseInt(formData.duration_seconds),
          status: "draft",
        })
        .select()
        .single();

      if (creativeError) throw creativeError;

      // Upload asset if provided
      if (formData.asset_file) {
        setUploadingFile(true);
        const fileExt = formData.asset_file.name.split('.').pop();
        const fileName = `${creative.id}-${Date.now()}.${fileExt}`;
        const filePath = `ad-creatives/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("ad-assets")
          .upload(filePath, formData.asset_file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("Failed to upload file, but creative was created");
        } else {
          // Create asset record
          await supabase
            .from("ad_assets")
            .insert({
              creative_id: creative.id,
              asset_type: formData.format,
              storage_path: filePath,
              duration_seconds: formData.format.includes("audio") || formData.format.includes("video") 
                ? parseInt(formData.duration_seconds) 
                : null,
            });
        }
      }

      toast.success("Ad creative created successfully");
      navigate(`/admin/advertising/campaigns/${formData.campaign_id}`);
    } catch (error: any) {
      console.error("Error creating ad:", error);
      toast.error(error.message || "Failed to create ad");
    } finally {
      setLoading(false);
      setUploadingFile(false);
    }
  };

  const formatTypes = [
    { value: "display", label: "Display Banner" },
    { value: "video", label: "Video Ad" },
    { value: "audio", label: "Audio Ad" },
    { value: "newsletter", label: "Newsletter Feature" },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/admin/ad-campaigns")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Campaigns
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ImageIcon className="h-8 w-8" />
          Create Ad Creative
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload assets and attach to a campaign
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Creative Details</CardTitle>
            <CardDescription>Basic information about the ad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Creative Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Summer Sale Banner"
              />
            </div>

            <div>
              <Label htmlFor="campaign">Campaign *</Label>
              <Select
                value={formData.campaign_id}
                onValueChange={(value) => setFormData({ ...formData, campaign_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns?.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name} ({campaign.advertisers?.company_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="format">Format *</Label>
              <Select
                value={formData.format}
                onValueChange={(value) => setFormData({ ...formData, format: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formatTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe the creative..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cta_text">CTA Text</Label>
                <Input
                  id="cta_text"
                  value={formData.cta_text}
                  onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                  placeholder="Learn More"
                />
              </div>

              <div>
                <Label htmlFor="cta_url">CTA URL</Label>
                <Input
                  id="cta_url"
                  type="url"
                  value={formData.cta_url}
                  onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                  placeholder="https://"
                />
              </div>
            </div>

            {(formData.format === "video" || formData.format === "audio") && (
              <div>
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_seconds}
                  onChange={(e) => setFormData({ ...formData, duration_seconds: e.target.value })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Asset</CardTitle>
            <CardDescription>Upload the ad creative file</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="asset_file">File</Label>
              <Input
                id="asset_file"
                type="file"
                onChange={handleFileChange}
                accept={
                  formData.format === "video" ? "video/*" :
                  formData.format === "audio" ? "audio/*" :
                  "image/*"
                }
              />
              {formData.asset_file && (
                <Badge variant="outline" className="mt-2">
                  {formData.asset_file.name}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/ad-campaigns")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || uploadingFile}>
            {(loading || uploadingFile) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {uploadingFile ? "Uploading..." : "Create Ad"}
          </Button>
        </div>
      </form>
    </div>
  );
}
