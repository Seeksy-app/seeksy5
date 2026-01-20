import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, ArrowLeft } from "lucide-react";

export default function CreateHostScript() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);
  
  const [formData, setFormData] = useState({
    campaignName: "",
    scriptTitle: "",
    duration: "",
    script: "",
    callToAction: "",
    promoCode: "",
    targetAudience: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a host read script",
          variant: "destructive",
        });
        return;
      }

      // TODO: Create the host script in the database
      toast({
        title: "Success!",
        description: "Your host read script has been created",
      });

      navigate("/advertiser/campaigns");
    } catch (error) {
      console.error("Error creating host script:", error);
      toast({
        title: "Error",
        description: "Failed to create host read script",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/advertiser/campaigns/create-type")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Ad Types
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <FileText className="h-6 w-6 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Create Host Read Script</h1>
        </div>
        <p className="text-muted-foreground">
          Create a custom script for hosts to read during their shows
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Script Details</CardTitle>
            <CardDescription className="text-foreground/70">
              Provide the details for your host read advertisement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="campaignName" className="text-foreground">Campaign Name *</Label>
              <Input
                id="campaignName"
                value={formData.campaignName}
                onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                placeholder="Summer Sale Campaign"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scriptTitle" className="text-foreground">Script Title *</Label>
              <Input
                id="scriptTitle"
                value={formData.scriptTitle}
                onChange={(e) => setFormData({ ...formData, scriptTitle: e.target.value })}
                placeholder="Product Launch Announcement"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-foreground">Estimated Duration *</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => setFormData({ ...formData, duration: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                  <SelectItem value="90">90 seconds</SelectItem>
                  <SelectItem value="120">2 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="script" className="text-foreground">Script Content *</Label>
              <Textarea
                id="script"
                value={formData.script}
                onChange={(e) => setFormData({ ...formData, script: e.target.value })}
                placeholder="Write the script that the host will read..."
                rows={8}
                required
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Write a natural, conversational script that sounds authentic to the host's style
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="callToAction" className="text-foreground">Call to Action *</Label>
              <Input
                id="callToAction"
                value={formData.callToAction}
                onChange={(e) => setFormData({ ...formData, callToAction: e.target.value })}
                placeholder="Visit website.com to learn more"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="promoCode" className="text-foreground">Promo Code (Optional)</Label>
              <Input
                id="promoCode"
                value={formData.promoCode}
                onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                placeholder="PODCAST20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience" className="text-foreground">Target Audience</Label>
              <Input
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="Business professionals, age 25-45"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/advertiser/campaigns/create-type")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Host Script"}
          </Button>
        </div>
      </form>
    </div>
  );
}
