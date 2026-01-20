import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calculator, DollarSign, TrendingUp, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export const ROICalculatorTab = () => {
  const [monthlySpend, setMonthlySpend] = useState(50000);
  const [avgConversion, setAvgConversion] = useState(8.5);
  const [avgLTV, setAvgLTV] = useState(480);

  // Calculate metrics
  const totalLeads = Math.round(monthlySpend / 12); // Rough estimate: $12 per lead
  const conversions = Math.round(totalLeads * (avgConversion / 100));
  const totalRevenue = conversions * avgLTV;
  const roi = ((totalRevenue - monthlySpend) / monthlySpend) * 100;
  const profit = totalRevenue - monthlySpend;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">ROI Calculator</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Input Parameters</CardTitle>
            <CardDescription>Adjust these values to model different scenarios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Monthly Marketing Spend */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="monthly-spend">Monthly Marketing Spend</Label>
                <span className="text-sm font-medium text-primary">${monthlySpend.toLocaleString()}</span>
              </div>
              <Slider
                id="monthly-spend"
                min={10000}
                max={200000}
                step={5000}
                value={[monthlySpend]}
                onValueChange={(value) => setMonthlySpend(value[0])}
                className="w-full"
              />
            </div>

            {/* Average Conversion Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="conversion">Average Conversion Rate</Label>
                <span className="text-sm font-medium text-primary">{avgConversion}%</span>
              </div>
              <Slider
                id="conversion"
                min={3}
                max={20}
                step={0.5}
                value={[avgConversion]}
                onValueChange={(value) => setAvgConversion(value[0])}
                className="w-full"
              />
            </div>

            {/* Average Customer LTV */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="ltv">Average Customer LTV</Label>
                <span className="text-sm font-medium text-primary">${avgLTV}</span>
              </div>
              <Slider
                id="ltv"
                min={200}
                max={2000}
                step={50}
                value={[avgLTV]}
                onValueChange={(value) => setAvgLTV(value[0])}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle>Projected Results</CardTitle>
            <CardDescription>Based on your input parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Total Marketing Spend */}
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Marketing Spend</span>
                </div>
                <span className="text-xl font-bold">${monthlySpend.toLocaleString()}</span>
              </div>

              {/* Total Leads */}
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Estimated Leads</span>
                </div>
                <span className="text-xl font-bold">{totalLeads.toLocaleString()}</span>
              </div>

              {/* Conversions */}
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Conversions</span>
                </div>
                <span className="text-xl font-bold">{conversions.toLocaleString()}</span>
              </div>

              {/* Total Revenue */}
              <div className="flex items-center justify-between p-4 bg-green-500/10 border-green-500/20 border rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">Total Revenue Generated</span>
                </div>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${totalRevenue.toLocaleString()}
                </span>
              </div>

              {/* Overall ROI */}
              <div className="flex items-center justify-between p-4 bg-primary/10 border-primary/20 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Calculator className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Overall ROI</span>
                </div>
                <span className="text-3xl font-bold text-primary">{roi.toFixed(1)}%</span>
              </div>

              {/* Profit */}
              <div className="text-center pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-1">Monthly Profit</p>
                <p className="text-3xl font-bold text-primary">${profit.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Action Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Action Plan</CardTitle>
          <CardDescription>Recommended quarterly initiatives to hit targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { number: 1, title: "Launch Creator Referral Program (Q1)", description: "Incentivize existing users to refer creator friends with 2-month free Pro tier for both parties" },
              { number: 2, title: "Deploy YouTube SEO Content (Q1-Q2)", description: "Publish 50+ tutorial videos targeting high-intent keywords with 10K+ monthly search volume" },
              { number: 3, title: "Expand Podcast Guest Tour (Q2-Q3)", description: "Appear on 25 creator economy podcasts reaching combined 5M+ listeners" },
              { number: 4, title: "Build Agency Partnership Network (Q3-Q4)", description: "Secure 50 agency partners managing 500+ creator clients with white-label options" },
            ].map((action) => (
              <div key={action.number} className="flex gap-4 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  {action.number}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{action.title}</h4>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
