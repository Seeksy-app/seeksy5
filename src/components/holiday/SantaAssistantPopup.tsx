/**
 * Santa Assistant Popup Modal
 * Quick actions modal for holiday assistant
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Mic, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SantaAssistantPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SantaAssistantPopup = ({ open, onOpenChange }: SantaAssistantPopupProps) => {
  const navigate = useNavigate();

  const handleAction = (route: string) => {
    navigate(route);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <img 
              src="/spark/holiday/spark-santa-waving.png" 
              alt="Santa Spark"
              className="w-20 h-20 object-contain"
              style={{ 
                filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))',
                background: 'transparent'
              }}
            />
          </div>
          <DialogTitle className="text-center text-xl">
            Hi, I'm Santa Spark! 🌟
          </DialogTitle>
        </DialogHeader>

        <p className="text-center text-muted-foreground text-sm">
          Ready to help you create something magical for the holidays?
        </p>

        <div className="space-y-3 mt-4">
          <Button 
            onClick={() => handleAction('/meetings/create')}
            className="w-full justify-start gap-3"
            variant="outline"
          >
            <Calendar className="h-5 w-5" />
            Create Meeting
          </Button>

          <Button 
            onClick={() => handleAction('/podcasts/create')}
            className="w-full justify-start gap-3"
            variant="outline"
          >
            <Mic className="h-5 w-5" />
            Add Podcast
          </Button>

          <Button 
            onClick={() => handleAction('/events/create')}
            className="w-full justify-start gap-3"
            variant="outline"
          >
            <Sparkles className="h-5 w-5" />
            Create Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
