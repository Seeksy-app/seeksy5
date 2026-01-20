import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface MyPageWelcomeDialogProps {
  open: boolean;
  onClose: () => void;
}

export const MyPageWelcomeDialog = ({ open, onClose }: MyPageWelcomeDialogProps) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Get the current user's username
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single()
            .then(({ data }) => {
              if (data?.username) {
                setUsername(data.username);
              }
            });
        }
      });
    }
  }, [open]);

  const handleGetStarted = () => {
    onClose();
    if (username) {
      navigate(`/${username}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Your Custom My Page Settings!</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Your My Page is your personal hub to connect with your audience. Here's what you can customize:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Social Media Hub</p>
              <p className="text-sm text-muted-foreground">Connect all your social profiles in one place</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Podcast RSS Feed</p>
              <p className="text-sm text-muted-foreground">Showcase your latest episodes and grow your audience</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Blog</p>
              <p className="text-sm text-muted-foreground">Share your thoughts and build your brand</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Custom Links</p>
              <p className="text-sm text-muted-foreground">Add links to anything you want to share</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Streaming</p>
              <p className="text-sm text-muted-foreground">Go live and engage with your community in real-time</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">And Much More</p>
              <p className="text-sm text-muted-foreground">Events, polls, meetings, and more to grow your presence</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleGetStarted}>
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
