import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trophy, ArrowLeft, Sparkles } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import { FeeConfigurationForm } from "@/components/awards/FeeConfigurationForm";
import { AIAwardsDesignerDialog, type AIAwardsInput } from "@/components/awards/AIAwardsDesignerDialog";

export default function CreateAwardsProgram() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cover_image_url: "",
    voting_method: "public" as "public" | "jury" | "hybrid" | "ranked_choice",
    nomination_type: "public_only" as "public_only" | "self_only" | "both",
    self_nomination_fee: "0",
    registration_fee: "0",
    pass_on_percentage_fee: true,
    pass_on_ach_fee: true,
    allow_public_nominations: false,
    require_voter_registration: false,
    show_live_results: false,
    max_votes_per_voter: 1,
    nominations_open_date: "",
    nominations_close_date: "",
    voting_open_date: "",
    voting_close_date: "",
    ceremony_date: "",
  });

  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("awards_programs")
        .insert({
          ...formData,
          self_nomination_fee: parseFloat(formData.self_nomination_fee),
          registration_fee: parseFloat(formData.registration_fee),
          user_id: user.id,
          status: publish ? "nominations_open" : "draft",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(publish ? "Awards program published!" : "Awards program created as draft!");
      navigate(`/awards/${data.id}`);
    } catch (error: any) {
      console.error("Error creating awards program:", error);
      toast.error(error.message || "Failed to create awards program");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/awards")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Awards
      </Button>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="h-8 w-8 text-brand-gold" />
              <h1 className="text-4xl font-bold text-brand-gold">
                Create Awards Program
              </h1>
            </div>
            <p className="text-muted-foreground">
              Set up your awards program with categories, nominees, and voting
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setAiDialogOpen(true)}
            className="border-brand-gold text-brand-gold hover:bg-brand-gold/10"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            AI Awards Designer
          </Button>
        </div>
      </div>

      <AIAwardsDesignerDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        onGenerate={(data: AIAwardsInput) => {
          // Pre-fill form with AI suggestions
          setFormData(prev => ({
            ...prev,
            title: data.programName || prev.title,
            description: data.additionalNotes || prev.description,
          }));
          toast.success("AI suggestions applied! Review and customize as needed.");
        }}
      />

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        <Card className="p-6 border-brand-gold/20">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Program Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., 2024 Podcast Awards"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your awards program..."
                rows={4}
              />
            </div>

            <div>
              <Label>Cover Image</Label>
              <ImageUpload
                currentImage={formData.cover_image_url}
                onImageUploaded={(url) => setFormData({ ...formData, cover_image_url: url })}
                bucket="event-images"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-brand-gold/20">
          <h2 className="text-xl font-semibold mb-4">Nomination & Voting Settings</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nomination_type">Nomination Type</Label>
              <Select
                value={formData.nomination_type}
                onValueChange={(value: any) => setFormData({ ...formData, nomination_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public_only">Public Nominations Only (Free)</SelectItem>
                  <SelectItem value="self_only">Self Nominations Only (Paid)</SelectItem>
                  <SelectItem value="both">Both Public & Self Nominations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.nomination_type === "self_only" || formData.nomination_type === "both") && (
              <div>
                <Label htmlFor="self_nomination_fee">Self Nomination Fee ($)</Label>
                <Input
                  id="self_nomination_fee"
                  type="number"
                  step="0.01"
                  value={formData.self_nomination_fee}
                  onChange={(e) => setFormData({ ...formData, self_nomination_fee: e.target.value })}
                  placeholder="50.00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You'll receive 50% of nomination fees. Platform keeps 50% for costs.
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="self_nomination_fee">Self-Nomination Fee ($)</Label>
              <Input
                id="self_nomination_fee"
                type="number"
                step="0.01"
                value={formData.self_nomination_fee}
                onChange={(e) => setFormData({ ...formData, self_nomination_fee: e.target.value })}
                placeholder="50.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional fee for self-nominations
              </p>
            </div>
          </div>
        </Card>

        {/* Registration Fee with Fee Configuration */}
        <Card className="p-6 border-brand-gold/20">
          <FeeConfigurationForm
            registrationFee={parseFloat(formData.registration_fee) || 0}
            onChange={(fee, config) => setFormData({ 
              ...formData, 
              registration_fee: fee.toString(),
              pass_on_percentage_fee: config.pass_on_percentage_fee,
              pass_on_ach_fee: config.pass_on_ach_fee,
            })}
          />
        </Card>

        <Card className="p-6 border-brand-gold/20">
          <h2 className="text-xl font-semibold mb-4">Voting Settings</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="voting_method">Voting Method</Label>
              <Select
                value={formData.voting_method}
                onValueChange={(value: any) => setFormData({ ...formData, voting_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public Voting</SelectItem>
                  <SelectItem value="jury">Jury Only</SelectItem>
                  <SelectItem value="hybrid">Hybrid (Public + Jury)</SelectItem>
                  <SelectItem value="ranked_choice">Ranked Choice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="max_votes">Maximum Votes Per Voter</Label>
              <Input
                id="max_votes"
                type="number"
                min="1"
                value={formData.max_votes_per_voter}
                onChange={(e) => setFormData({ ...formData, max_votes_per_voter: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="public_nominations">Allow Public Nominations</Label>
                <Switch
                  id="public_nominations"
                  checked={formData.allow_public_nominations}
                  onCheckedChange={(checked) => setFormData({ ...formData, allow_public_nominations: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="require_registration">Require Voter Registration</Label>
                <Switch
                  id="require_registration"
                  checked={formData.require_voter_registration}
                  onCheckedChange={(checked) => setFormData({ ...formData, require_voter_registration: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="live_results">Show Live Results</Label>
                <Switch
                  id="live_results"
                  checked={formData.show_live_results}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_live_results: checked })}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-brand-gold/20">
          <h2 className="text-xl font-semibold mb-4">Important Dates</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="nominations_open">Nominations Open</Label>
              <Input
                id="nominations_open"
                type="datetime-local"
                value={formData.nominations_open_date}
                onChange={(e) => setFormData({ ...formData, nominations_open_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="nominations_close">Nominations Close</Label>
              <Input
                id="nominations_close"
                type="datetime-local"
                value={formData.nominations_close_date}
                onChange={(e) => setFormData({ ...formData, nominations_close_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="voting_open">Voting Opens</Label>
              <Input
                id="voting_open"
                type="datetime-local"
                value={formData.voting_open_date}
                onChange={(e) => setFormData({ ...formData, voting_open_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="voting_close">Voting Closes</Label>
              <Input
                id="voting_close"
                type="datetime-local"
                value={formData.voting_close_date}
                onChange={(e) => setFormData({ ...formData, voting_close_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="ceremony">Awards Ceremony</Label>
              <Input
                id="ceremony"
                type="datetime-local"
                value={formData.ceremony_date}
                onChange={(e) => setFormData({ ...formData, ceremony_date: e.target.value })}
              />
            </div>
          </div>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/awards")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="outline"
            disabled={loading}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            className="bg-brand-gold hover:bg-brand-darkGold text-white"
          >
            {loading ? "Creating..." : "Create & Publish"}
          </Button>
        </div>
      </form>
    </div>
  );
}