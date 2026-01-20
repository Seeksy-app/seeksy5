import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, UserPlus, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useMemo } from "react";

export const GuestInvitePanel = () => {
  // Generate unique session ID (in production, this would come from the session state)
  const sessionId = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('sessionId') || crypto.randomUUID().substring(0, 8);
  }, []);
  
  const inviteLink = `${window.location.origin}/studio/guest/${sessionId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Guest Invite</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invite Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Invite Link</label>
          <div className="flex gap-2">
            <Input value={inviteLink} readOnly className="font-mono text-xs" />
            <Button onClick={handleCopyLink} size="icon" variant="outline">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Waiting Room */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Waiting Room</span>
            <Badge variant="secondary" className="gap-1">
              <Clock className="w-3 h-3" />
              2 waiting
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">Guest 1</div>
                  <div className="text-xs text-muted-foreground">Waiting to join</div>
                </div>
              </div>
              <Button size="sm">Admit</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">Guest 2</div>
                  <div className="text-xs text-muted-foreground">Waiting to join</div>
                </div>
              </div>
              <Button size="sm">Admit</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
