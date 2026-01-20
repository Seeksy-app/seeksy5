import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp } from "lucide-react";

export default function StudioAds() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="container max-w-7xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ads & Monetization</h1>
            <p className="text-muted-foreground mt-1">
              Configure ad slots and revenue opportunities
            </p>
          </div>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>

        <Card className="border-2 border-dashed">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <DollarSign className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Monetization Hub</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Dynamic ad insertion, sponsorship management, and revenue tracking 
                  are coming soon to Studio.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-4">
                <Button variant="outline" disabled>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Set Up Ads
                </Button>
                <Button variant="outline" disabled>
                  View Revenue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planned Features</CardTitle>
            <CardDescription>What's coming to Ads & Monetization</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Dynamic ad insertion (pre-roll, mid-roll, post-roll)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Host-read ad script delivery during recording
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Real-time revenue tracking and analytics
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Sponsorship campaign management
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Automated payout and reporting
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
