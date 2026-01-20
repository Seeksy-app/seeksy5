import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Users, CalendarDays, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WelcomeModal = () => {
  // Initialize from localStorage synchronously to prevent flash
  const [open, setOpen] = useState(() => {
    const justSignedUp = localStorage.getItem("justSignedUp");
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    // Only show if user just signed up and hasn't seen welcome yet
    return justSignedUp === "true" && hasSeenWelcome !== "true";
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check again on mount in case localStorage changed
    const justSignedUp = localStorage.getItem("justSignedUp");
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (justSignedUp === "true" && hasSeenWelcome !== "true") {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    localStorage.removeItem("justSignedUp");
    setOpen(false);
  };

  const handleAction = (path: string) => {
    handleClose();
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleClose();
      }
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Seeksy! 🎉</DialogTitle>
          <DialogDescription className="text-base">
            You're all set! Here's what you can do to get started:
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <button
            onClick={() => handleAction("/create-event")}
            className="p-4 border rounded-lg hover:border-primary hover:bg-accent/50 transition-all text-left"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Create Your First Event</h3>
                <p className="text-sm text-muted-foreground">
                  Set up an event and start collecting registrations
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleAction("/create-meeting-type")}
            className="p-4 border rounded-lg hover:border-primary hover:bg-accent/50 transition-all text-left"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Set Up Meeting Bookings</h3>
                <p className="text-sm text-muted-foreground">
                  Let people book time with you automatically
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleAction("/create-signup-sheet")}
            className="p-4 border rounded-lg hover:border-primary hover:bg-accent/50 transition-all text-left"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Create a Sign-Up Sheet</h3>
                <p className="text-sm text-muted-foreground">
                  Organize volunteers and time slots
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleAction("/profile/edit")}
            className="p-4 border border-primary/30 rounded-lg hover:border-primary hover:bg-primary/10 transition-all text-left"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Share2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Customize Your Profile Page</h3>
                <p className="text-sm text-muted-foreground">
                  Build your landing page and share it with the world
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            I'll explore on my own
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
