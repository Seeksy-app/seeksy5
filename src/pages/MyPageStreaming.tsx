import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Radio, DollarSign, Users, Eye } from "lucide-react";

export default function MyPageStreaming() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7FA] to-[#E0ECF9] dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-[1200px] mx-auto px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
              <Radio className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4">Your Streaming Experience</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            is being prepared
          </p>
          <Badge className="text-lg px-4 py-2" variant="secondary">
            Launching Thursday
          </Badge>
        </div>

        {/* Spark Monetization Card */}
        <Card className="mb-8 border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 shadow-xl">
          <CardContent className="pt-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-2xl mb-3">Spark Here!</h3>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  Get ready to monetize your live streams like never before! Your My Page streaming 
                  feature is being set up with powerful monetization tools, real-time engagement tracking, 
                  and seamless integration with your existing content.
                </p>
                <p className="text-muted-foreground">
                  We're building this specifically for <strong>you</strong>—expect subscriber tipping, 
                  sponsored stream slots, viewer analytics, and more. Stay tuned for Thursday's reveal!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-950/20 w-fit mb-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Live Monetization</CardTitle>
              <CardDescription>
                Accept tips, subscriptions, and sponsorships while you stream
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/20 w-fit mb-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Real-Time Engagement</CardTitle>
              <CardDescription>
                Interactive chat, polls, and audience participation tools
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-950/20 w-fit mb-3">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Stream Analytics</CardTitle>
              <CardDescription>
                Track viewers, engagement, and revenue in real-time
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Coming Soon Footer */}
        <Card className="mt-8 border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Your streaming dashboard is almost ready. Check back Thursday for the full launch!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}