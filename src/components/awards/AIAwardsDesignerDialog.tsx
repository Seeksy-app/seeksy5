import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIAwardsDesignerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate?: (data: AIAwardsInput) => void;
}

export interface AIAwardsInput {
  programName: string;
  numberOfCategories: string;
  audienceType: string;
  timeline: string;
  additionalNotes: string;
}

export function AIAwardsDesignerDialog({
  open,
  onOpenChange,
  onGenerate,
}: AIAwardsDesignerDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AIAwardsInput>({
    programName: "",
    numberOfCategories: "5",
    audienceType: "",
    timeline: "single-day",
    additionalNotes: "",
  });

  const handleGenerate = async () => {
    if (!formData.programName || !formData.audienceType) {
      toast({
        title: "Missing information",
        description: "Please provide a program name and audience type.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Log the data (stub - will wire AI later)
    console.log("AI Awards Designer Input:", formData);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "AI Awards Designer",
      description: "Your request has been captured. AI generation will be available soon!",
    });

    if (onGenerate) {
      onGenerate(formData);
    }

    setLoading(false);
    onOpenChange(false);

    // Reset form
    setFormData({
      programName: "",
      numberOfCategories: "5",
      audienceType: "",
      timeline: "single-day",
      additionalNotes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-gold" />
            AI Awards Designer
          </DialogTitle>
          <DialogDescription>
            Tell us about your awards program and we'll help you design it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="programName">Program Name *</Label>
            <Input
              id="programName"
              value={formData.programName}
              onChange={(e) => setFormData({ ...formData, programName: e.target.value })}
              placeholder="e.g., 2025 Podcast Excellence Awards"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categories">Number of Categories</Label>
            <Select
              value={formData.numberOfCategories}
              onValueChange={(value) => setFormData({ ...formData, numberOfCategories: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Categories</SelectItem>
                <SelectItem value="5">5 Categories</SelectItem>
                <SelectItem value="10">10 Categories</SelectItem>
                <SelectItem value="15">15 Categories</SelectItem>
                <SelectItem value="20">20+ Categories</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience">Audience Type *</Label>
            <Input
              id="audience"
              value={formData.audienceType}
              onChange={(e) => setFormData({ ...formData, audienceType: e.target.value })}
              placeholder="e.g., podcasters, creators, veterans, brands"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline">Timeline</Label>
            <Select
              value={formData.timeline}
              onValueChange={(value) => setFormData({ ...formData, timeline: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single-day">Single Day Event</SelectItem>
                <SelectItem value="week-long">Week-Long Program</SelectItem>
                <SelectItem value="month-long">Month-Long Campaign</SelectItem>
                <SelectItem value="season-long">Season-Long (3+ months)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              placeholder="Any specific categories, requirements, or themes you'd like to include..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Program
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
