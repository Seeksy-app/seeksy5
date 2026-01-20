import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus } from "lucide-react";

export default function StudioGuests() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="container max-w-7xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Guests</h1>
            <p className="text-muted-foreground mt-1">
              Invite and manage co-hosts and guests
            </p>
          </div>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>

        <Card className="border-2 border-dashed">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <Users className="w-10 h-10 text-purple-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Guest Management</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Multi-track recording with remote guests is coming soon. 
                  Invite collaborators to join your sessions.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-4">
                <Button variant="outline" disabled>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Guest
                </Button>
                <Button variant="outline" disabled>
                  Guest Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planned Features</CardTitle>
            <CardDescription>What's coming to Guest Management</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Multi-track recording with separate audio per guest
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Remote guest invitations via email or link
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Guest audio quality monitoring
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Individual track editing and mixing
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Guest appearance history and scheduling
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
