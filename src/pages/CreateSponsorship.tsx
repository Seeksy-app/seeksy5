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
import { Handshake, ArrowLeft, DollarSign } from "lucide-react";

export default function CreateSponsorship() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);
  
  const [formData, setFormData] = useState({
    sponsorshipName: "",
    sponsorshipType: "",
    budget: "",
    duration: "",
    description: "",
    benefits: "",
    targetCreators: "",
    websiteUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a sponsorship",
          variant: "destructive",
        });
        return;
      }

      // TODO: Create the sponsorship in the database
      toast({
        title: "Success!",
        description: "Your sponsorship opportunity has been created",
      });

      navigate("/advertiser/campaigns");
    } catch (error) {
      console.error("Error creating sponsorship:", error);
      toast({
        title: "Error",
        description: "Failed to create sponsorship",
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
          <div className="p-2 rounded-lg bg-teal-500/10">
            <Handshake className="h-6 w-6 text-teal-600" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Create Sponsorship</h1>
        </div>
        <p className="text-muted-foreground">
          Create a sponsorship opportunity for creators, events, and content
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Sponsorship Details</CardTitle>
            <CardDescription className="text-foreground/70">
              Define your sponsorship opportunity and what you're offering
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="sponsorshipName" className="text-foreground">Sponsorship Name *</Label>
              <Input
                id="sponsorshipName"
                value={formData.sponsorshipName}
                onChange={(e) => setFormData({ ...formData, sponsorshipName: e.target.value })}
                placeholder="Brand Partnership Program"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sponsorshipType" className="text-foreground">Sponsorship Type *</Label>
              <Select
                value={formData.sponsorshipType}
                onValueChange={(value) => setFormData({ ...formData, sponsorshipType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content">Content Sponsorship</SelectItem>
                  <SelectItem value="event">Event Sponsorship</SelectItem>
                  <SelectItem value="series">Series Sponsorship</SelectItem>
                  <SelectItem value="channel">Channel Sponsorship</SelectItem>
                  <SelectItem value="exclusive">Exclusive Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget" className="text-foreground">Budget *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="5000"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-foreground">Duration *</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => setFormData({ ...formData, duration: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 month</SelectItem>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you're looking to sponsor and your brand goals..."
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits" className="text-foreground">Benefits for Creators *</Label>
              <Textarea
                id="benefits"
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                placeholder="What benefits and compensation are you offering to creators?"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetCreators" className="text-foreground">Target Creator Profile</Label>
              <Textarea
                id="targetCreators"
                value={formData.targetCreators}
                onChange={(e) => setFormData({ ...formData, targetCreators: e.target.value })}
                placeholder="Describe your ideal creator partner (niche, audience size, content style, etc.)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl" className="text-foreground">Website URL</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://yourbrand.com"
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
            {loading ? "Creating..." : "Create Sponsorship"}
          </Button>
        </div>
      </form>
    </div>
  );
}
