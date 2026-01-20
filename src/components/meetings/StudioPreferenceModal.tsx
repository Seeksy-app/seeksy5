import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, Mic, Users, Sparkles, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StudioPreferenceModalProps {
  open: boolean;
  onSelect: (preference: "simple" | "podcast") => void;
}

export function StudioPreferenceModal({ open, onSelect }: StudioPreferenceModalProps) {
  const [selected, setSelected] = useState<"simple" | "podcast">("simple");
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update user preferences
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          meeting_studio_preference: selected,
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;
      
      onSelect(selected);
    } catch (error: any) {
      toast.error("Failed to save preference: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Choose Your Meeting Studio</DialogTitle>
          <DialogDescription>
            Select your preferred video meeting experience. You can change this later in settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Simple Studio Option */}
          <Card
            className={`p-4 cursor-pointer transition-all border-2 ${
              selected === "simple"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/50"
            }`}
            onClick={() => setSelected("simple")}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Simple Meeting Studio</h3>
                  <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Lightweight video calls with camera, mic, screen share, and chat. Perfect for quick meetings.
                </p>
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> Multi-participant
                  </span>
                  <span className="flex items-center gap-1">
                    <Mic className="h-3 w-3" /> Host controls
                  </span>
                </div>
              </div>
              {selected === "simple" && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          </Card>

          {/* Podcast Studio Option */}
          <Card
            className={`p-4 cursor-pointer transition-all border-2 ${
              selected === "podcast"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/50"
            }`}
            onClick={() => setSelected("podcast")}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Sparkles className="h-6 w-6 text-orange-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Podcast Recording Studio</h3>
                  <span className="text-xs bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full">
                    Advanced
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Full recording features with AI transcription, ad markers, scene switching, and post-production tools.
                </p>
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI features
                  </span>
                  <span className="flex items-center gap-1">
                    <Video className="h-3 w-3" /> Recording
                  </span>
                </div>
              </div>
              {selected === "podcast" && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          </Card>
        </div>

        <Button
          className="w-full mt-4"
          onClick={handleConfirm}
          disabled={saving}
        >
          {saving ? "Saving..." : "Continue with " + (selected === "simple" ? "Simple Studio" : "Podcast Studio")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
