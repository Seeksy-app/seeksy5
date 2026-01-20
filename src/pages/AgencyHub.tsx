import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, Briefcase, TrendingUp, Calendar, FileText } from "lucide-react";

export default function AgencyHub() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7FA] to-[#E0ECF9] dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3">Agency Hub</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your influencer roster, campaigns, and client relationships—all in one place
          </p>
          <Badge className="mt-4" variant="secondary">
            Launching Soon
          </Badge>
        </div>

        {/* Spark Welcome */}
        <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Agency Management Made Simple</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to Agency Hub! Soon you'll be able to manage your entire influencer roster, 
                  coordinate campaigns, track performance across creators, and handle client billing—all 
                  from this central dashboard. We're preparing everything for you!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/20 w-fit mb-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Creator Roster</CardTitle>
              <CardDescription>
                Manage all your influencers with profiles, contracts, and performance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">Coming Soon</Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-950/20 w-fit mb-3">
                <Briefcase className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Campaign Management</CardTitle>
              <CardDescription>
                Coordinate multi-creator campaigns with timelines and deliverables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">Coming Soon</Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-950/20 w-fit mb-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Aggregate metrics across your roster and compare creator performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">Coming Soon</Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-950/20 w-fit mb-3">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Content Calendar</CardTitle>
              <CardDescription>
                Plan and schedule posts across all creators and platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">Coming Soon</Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="p-3 rounded-xl bg-pink-100 dark:bg-pink-950/20 w-fit mb-3">
                <FileText className="h-6 w-6 text-pink-600" />
              </div>
              <CardTitle>Client Reporting</CardTitle>
              <CardDescription>
                Auto-generate branded reports for your clients with campaign results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">Coming Soon</Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-950/20 w-fit mb-3">
                <Briefcase className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle>Billing & Payments</CardTitle>
              <CardDescription>
                Manage invoicing, creator payouts, and commission tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">Coming Soon</Badge>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <Card className="mt-8 border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-1">Agency Tools In Development</h3>
                <p className="text-sm text-muted-foreground">
                  We're building comprehensive agency management features. Stay tuned for updates!
                </p>
              </div>
              <Button disabled>
                <Sparkles className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}