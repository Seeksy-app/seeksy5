import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Mic, Users, ArrowRight } from "lucide-react";
import { StudioInviteDialog } from "./StudioInviteDialog";

interface StudioLobbyProps {
  onEnterStudio: (sessionName: string) => void;
}

export function StudioLobby({ onEnterStudio }: StudioLobbyProps) {
  const [sessionName, setSessionName] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [invitedGuests, setInvitedGuests] = useState<string[]>([]);

  const handleEnterStudio = () => {
    if (sessionName.trim()) {
      onEnterStudio(sessionName.trim());
    }
  };

  const handleGuestInvited = (email: string) => {
    setInvitedGuests(prev => [...prev, email]);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Welcome to Studio</CardTitle>
            <CardDescription>
              Set up your recording session before you begin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="session-name">Session Name</Label>
              <Input
                id="session-name"
                placeholder="e.g., Episode 42: The Future of AI"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && sessionName.trim()) {
                    handleEnterStudio();
                  }
                }}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Guest Invitations</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInviteDialog(true)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Invite Guests
                </Button>
              </div>
              
              {invitedGuests.length > 0 && (
                <div className="space-y-1">
                  {invitedGuests.map((email, index) => (
                    <div 
                      key={index}
                      className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md"
                    >
                      {email}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">What you'll be able to do:</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" />
                  <span>Record video and audio with professional quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-primary" />
                  <span>Control your camera and microphone settings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Collaborate with invited guests in real-time</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleEnterStudio}
              disabled={!sessionName.trim()}
              size="lg"
              className="w-full"
            >
              Enter Studio
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>

        <StudioInviteDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          sessionName={sessionName || "Your Studio Session"}
          onInviteSent={handleGuestInvited}
        />
      </div>
    </div>
  );
}
