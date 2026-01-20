import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, TrendingUp, Target, Users } from "lucide-react";

export default function FunnelsAttribution() {
  return (
    <div className="px-10 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GitBranch className="h-8 w-8 text-primary" />
          Funnels & Attribution
        </h1>
        <p className="text-muted-foreground mt-1">
          Track conversion funnels and marketing attribution
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Visitors</CardDescription>
            <CardTitle className="text-2xl">24,521</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12% vs last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Signups</CardDescription>
            <CardTitle className="text-2xl">1,847</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">7.5% conversion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Activations</CardDescription>
            <CardTitle className="text-2xl">892</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">48% of signups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Paid Conversions</CardDescription>
            <CardTitle className="text-2xl">156</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">17% of activations</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Full funnel visualization, attribution modeling, and conversion optimization tools
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <GitBranch className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            Advanced attribution features are being developed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
