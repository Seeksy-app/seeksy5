import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { uploadAdScript } from "@/lib/api/advertiserAPI";
import { useToast } from "@/hooks/use-toast";

const CreateScript = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get("campaignId") || "campaign_1";
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    brandName: "",
    title: "",
    scriptText: "",
    readLengthSeconds: 30,
    tags: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.brandName || !formData.title || !formData.scriptText) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await uploadAdScript(campaignId, {
        ...formData,
        campaignId,
      });

      toast({
        title: "Script created",
        description: "Your ad script has been created successfully",
      });

      navigate(`/advertiser/campaigns/${campaignId}`);
    } catch (error) {
      console.error("Failed to create script:", error);
      toast({
        title: "Error",
        description: "Failed to create ad script",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/advertiser/campaigns/${campaignId}`)}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Campaign
        </Button>

        <Card className="p-8 bg-white/95 backdrop-blur">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-[#053877]">Create New Ad Script</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Write a host-read ad script for your campaign
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand Name *</Label>
                <Input
                  id="brandName"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  placeholder="e.g., TechCorp"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Script Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., New Product Launch"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scriptText">Script Text *</Label>
                <Textarea
                  id="scriptText"
                  value={formData.scriptText}
                  onChange={(e) => setFormData({ ...formData, scriptText: e.target.value })}
                  placeholder="Write the full ad script that the host will read..."
                  rows={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.scriptText.length} characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="readLength">Estimated Read Time (seconds)</Label>
                <Input
                  id="readLength"
                  type="number"
                  value={formData.readLengthSeconds}
                  onChange={(e) =>
                    setFormData({ ...formData, readLengthSeconds: parseInt(e.target.value) || 30 })
                  }
                  min={10}
                  max={120}
                />
                <p className="text-xs text-muted-foreground">
                  Typical range: 15-60 seconds
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white"
                >
                  {isSubmitting ? "Creating..." : "Create Script"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/advertiser/campaigns/${campaignId}`)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CreateScript;
