import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, Zap } from "lucide-react";

export default function StudioLiveNew() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="container max-w-7xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Live Broadcast</h1>
            <p className="text-muted-foreground mt-1">
              Stream live to multiple platforms
            </p>
          </div>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>

        <Card className="border-2 border-dashed">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <Radio className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Live Broadcasting</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Multi-platform live streaming with real-time interactions 
                  is coming soon to Studio.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-4">
                <Button variant="outline" disabled>
                  <Zap className="w-4 h-4 mr-2" />
                  Go Live
                </Button>
                <Button variant="outline" disabled>
                  Configure Platforms
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planned Features</CardTitle>
            <CardDescription>What's coming to Live Broadcasting</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Simultaneous streaming to YouTube, Twitch, Facebook
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Real-time chat moderation and interaction
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Live viewer analytics and engagement metrics
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Scene switching and overlays
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Automatic VOD creation and publishing
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
