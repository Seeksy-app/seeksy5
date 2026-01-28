import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlanCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueId?: string;
  isDemoMode?: boolean;
  onSuccess?: () => void;
}

const channels = [
  { id: "email", label: "Email Marketing" },
  { id: "social", label: "Social Media" },
  { id: "influencers", label: "Influencer Partnerships" },
  { id: "paid", label: "Paid Advertising" },
  { id: "events", label: "Open House Events" },
];

const goals = [
  "Book more winter weddings",
  "Fill weekday availability",
  "Increase corporate bookings",
  "Boost holiday party reservations",
  "Launch new space/package",
  "Other"
];

export function PlanCampaignModal({ open, onOpenChange, venueId, isDemoMode = true, onSuccess }: PlanCampaignModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    customGoal: "",
    startDate: "",
    endDate: "",
    budget: "",
    description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueId) {
      toast.error("No venue selected");
      return;
    }

    setLoading(true);
    try {
      // Use venue_events_marketing for campaigns
      const goalText = formData.goal === "Other" ? formData.customGoal : formData.goal;
      
      const result = await (supabase as any)
        .from('venue_events_marketing')
        .insert({
          venue_id: venueId,
          name: formData.name,
          event_date: formData.startDate || null,
          budget: parseFloat(formData.budget) || null,
          goals: { goal: goalText, channels: selectedChannels },
          channel_mix: { channels: selectedChannels }
        });

      if (result.error) throw result.error;

      toast.success("Campaign created!");
      setFormData({ name: "", goal: "", customGoal: "", startDate: "", endDate: "", budget: "", description: "" });
      setSelectedChannels([]);
      onOpenChange(false);
      onSuccess?.();
      navigate('/venueOS/influencers');
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error(error.message || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Plan Marketing Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Winter Wedding Push"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Goal *</Label>
            <div className="grid grid-cols-2 gap-2">
              {goals.map((goal) => (
                <label 
                  key={goal} 
                  className={`flex items-center p-2 border rounded-lg cursor-pointer transition-colors ${
                    formData.goal === goal ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="goal"
                    value={goal}
                    checked={formData.goal === goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    className="mr-2"
                  />
                  <span className="text-sm">{goal}</span>
                </label>
              ))}
            </div>
            {formData.goal === "Other" && (
              <Input
                placeholder="Describe your goal..."
                value={formData.customGoal}
                onChange={(e) => setFormData({ ...formData, customGoal: e.target.value })}
                className="mt-2"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Channels</Label>
            <div className="space-y-2">
              {channels.map((channel) => (
                <label key={channel.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedChannels.includes(channel.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedChannels([...selectedChannels, channel.id]);
                      } else {
                        setSelectedChannels(selectedChannels.filter(id => id !== channel.id));
                      }
                    }}
                  />
                  <span className="text-sm">{channel.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Budget ($)</Label>
            <Input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
